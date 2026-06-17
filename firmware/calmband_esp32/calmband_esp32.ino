/*
 * CalmBand — Firmware ESP32 (pulsera) · v1.0
 * ---------------------------------------------------------------------------
 * Provisioning sin recompilar: la pulsera virgen crea su propia red WiFi con
 * un PORTAL CAUTIVO (universal, funciona en iPhone/Android/PC). El usuario
 * elige su red y escribe la clave; queda guardada en NVS para siempre.
 *
 * La identidad de la pulsera es su MAC. Al conectarse se registra sola en
 * Supabase (queda "pendiente") y el tutor la asigna a una persona desde la web.
 * Luego envía pulso real (MAX3010x) cada pocos segundos, identificándose por MAC.
 *
 * Placa:     ESP32 Dev Module (FQBN esp32:esp32:esp32)
 * Sensor:    MAX30102 / MAX30105 / MAX30100  por I2C (SDA=GPIO21, SCL=GPIO22)
 * Librerías: WiFiManager (tzapu), SparkFun MAX3010x, ArduinoJson (transitiva)
 *
 * Reconfigurar WiFi: mantené pulsado el botón BOOT (GPIO0) ~3 s → borra la red
 * guardada y reabre el portal cautivo.
 * ---------------------------------------------------------------------------
 */

#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WiFiManager.h>          // tzapu/WiFiManager
#include "esp_mac.h"              // esp_read_mac (MAC desde eFuse, disponible siempre)
#include "MAX30105.h"
#include "heartRate.h"

// Proyecto Supabase (kgamvzlehrnvpwwnjamp). La anon key es pública por diseño;
// con las funciones RPC SECURITY DEFINER solo puede registrar/enviar lecturas.
#define SUPABASE_URL  "https://kgamvzlehrnvpwwnjamp.supabase.co"
#define SUPABASE_ANON "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW12emxlaHJudnB3d25qYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzU2NzksImV4cCI6MjA5Njc1MTY3OX0.IEdSi4pbFNi2RlG468apJDxD8p0Rbf5zJyHhv1IRxJM"

#define FW_VERSION        "calmband-1.0"
#define SEND_INTERVAL_MS  8000
#define BOOT_BUTTON       0       // GPIO0 = botón BOOT en casi todas las placas ESP32
#define STATUS_LED        2       // LED integrado (GPIO2) en la mayoría de placas ESP32

MAX30105 particleSensor;
WiFiManager wm;                   // global: el portal corre en modo NO bloqueante
bool   portalRunning = false;     // true mientras el portal cautivo está abierto
String deviceMac;                 // "AA:BB:CC:DD:EE:FF" — identidad de la pulsera
bool   sensorOk = false;

// ── LED de estado: FIJO = conectado · PARPADEO = configurar/sin WiFi ──
void updateStatusLed() {
  if (WiFi.status() == WL_CONNECTED) digitalWrite(STATUS_LED, HIGH);   // fijo
  else digitalWrite(STATUS_LED, (millis() / 250) % 2);                 // parpadeo ~2/s
}
// Parpadeo corto = acabamos de mandar un dato.
void blinkActivity() {
  digitalWrite(STATUS_LED, LOW); delay(40); digitalWrite(STATUS_LED, HIGH);
}

// ── Cálculo de pulso a partir de intervalos RR (ms) ──
#define IR_FINGER_THRESHOLD 50000     // IR por debajo = no hay dedo
#define RR_MIN_MS           333       // 180 bpm
#define RR_MAX_MS           1500      // 40 bpm
#define MIN_BEATS_TO_SEND   5         // latidos válidos antes de enviar (calentar)

const byte RR_SIZE = 10;
long rr[RR_SIZE];                     // últimos intervalos RR, en orden cronológico
byte rrCount = 0;
long lastBeat = 0;

// Inserta un intervalo RR manteniendo el orden (los más viejos se desplazan).
void pushRR(long interval) {
  if (rrCount < RR_SIZE) {
    rr[rrCount++] = interval;
  } else {
    for (byte i = 1; i < RR_SIZE; i++) rr[i - 1] = rr[i];
    rr[RR_SIZE - 1] = interval;
  }
}

int bpmFromRR() {
  if (rrCount == 0) return 0;
  long sum = 0;
  for (byte i = 0; i < rrCount; i++) sum += rr[i];
  return (int)(60000.0 / (sum / (double)rrCount));   // media de los RR
}

int hrvFromRR() {                                    // RMSSD sobre RR consecutivos
  if (rrCount < 2) return 0;
  double s = 0;
  for (byte i = 1; i < rrCount; i++) {
    long d = rr[i] - rr[i - 1];
    s += (double)d * d;
  }
  return (int)sqrt(s / (rrCount - 1));
}

unsigned long lastSend = 0;

// ───────────────────────── Supabase RPC ─────────────────────────
// POST /rest/v1/rpc/<fn> con cuerpo JSON de parámetros nombrados.
int callRpc(const char* fn, const String& jsonBody, String* outResp = nullptr) {
  if (WiFi.status() != WL_CONNECTED) return -1;

  WiFiClientSecure client;
  client.setInsecure();                       // demo: sin validar certificado
  HTTPClient https;
  String url = String(SUPABASE_URL) + "/rest/v1/rpc/" + fn;
  if (!https.begin(client, url)) return -2;

  https.addHeader("Content-Type", "application/json");
  https.addHeader("apikey", SUPABASE_ANON);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON);

  int code = https.POST(jsonBody);
  if (outResp) *outResp = https.getString();
  https.end();
  return code;
}

void registerDevice() {
  String body = String("{\"p_mac\":\"") + deviceMac +
                "\",\"p_modelo\":\"ESP32\",\"p_firmware\":\"" + FW_VERSION + "\"}";
  String resp;
  int code = callRpc("register_device", body, &resp);
  Serial.printf("[Supabase] register_device -> %d %s\n", code, resp.c_str());
  if (code > 0) blinkActivity();
}

// ───────────────────────── Sensor / métricas ─────────────────────────
// Calma 0-100 (mayor = más calmado), derivada del PULSO: alto en reposo, baja
// cuando sube el bpm. No usamos HRV (este sensor no lo mide de forma fiable y
// saturaba la calma en 100). Rango pensado para que se mueva con el pulso real.
int computeCalma(int bpm, int hrv) {
  (void)hrv;
  return constrain(map(constrain(bpm, 50, 120), 50, 120, 92, 10), 0, 100);
}

const char* estadoFromCalma(int c) {
  if (c >= 70) return "tranquilo";
  if (c >= 40) return "neutral";
  return "estres";
}

void sendReading(int bpm, int hrv, int calma) {
  String body = String("{\"p_mac\":\"") + deviceMac +
                "\",\"p_bpm\":" + bpm +
                ",\"p_hrv\":" + hrv +
                ",\"p_calma\":" + calma +
                ",\"p_estado\":\"" + estadoFromCalma(calma) + "\"}";
  String resp;
  int code = callRpc("ingest_biometria", body, &resp);
  Serial.printf("[Supabase] ingest %d  bpm=%d hrv=%d calma=%d (%s) %s\n",
                code, bpm, hrv, calma, estadoFromCalma(calma), resp.c_str());
  if (code > 0) blinkActivity();
}

// ───────────────────────── WiFi / portal cautivo ─────────────────────────
// AP que crea la pulsera cuando no tiene/no logra WiFi (último 2 bytes del MAC).
String apName() {
  String n = "CalmBand-" + deviceMac.substring(12);
  n.replace(":", "");
  return n;
}

void startProvisioning() {
  wm.setConfigPortalTimeout(0);               // sin timeout: el portal queda abierto
  wm.setConfigPortalBlocking(false);          // NO bloquea: el loop sigue corriendo (LED)

  // Mostrar el MAC completo en el portal (lo necesita para vincular en la web).
  static String macHtml = "<div style='text-align:center;margin:10px 0;padding:10px;"
                   "background:#eef;border-radius:8px'>MAC de esta pulsera:<br>"
                   "<b style='font-size:1.1em'>" + deviceMac + "</b></div>";
  static WiFiManagerParameter macField(macHtml.c_str());
  wm.addParameter(&macField);

  // autoConnect: intenta la red guardada; si falla, abre el portal (no bloqueante).
  if (wm.autoConnect(apName().c_str())) {
    Serial.printf("[WiFi] Conectado. IP: %s\n", WiFi.localIP().toString().c_str());
    portalRunning = false;
  } else {
    Serial.printf("[WiFi] Sin conexión. Portal abierto: conéctate a \"%s\" (LED parpadeando).\n",
                  apName().c_str());
    portalRunning = true;
  }
}

void maybeResetWiFi() {
  // Mantener BOOT pulsado ~3 s borra la red guardada y reabre el portal.
  if (digitalRead(BOOT_BUTTON) != LOW) return;
  unsigned long t0 = millis();
  while (digitalRead(BOOT_BUTTON) == LOW) {
    updateStatusLed();
    if (millis() - t0 > 3000) {
      Serial.println("[WiFi] BOOT mantenido: borrando credenciales y reabriendo portal…");
      wm.resetSettings();
      delay(500); ESP.restart();
    }
    delay(50);
  }
}

// Inicializa (o reinicia) el sensor de pulso. Se llama al arrancar y para
// recuperarse si el sensor deja de entregar muestras (IR=0).
void initSensor() {
  sensorOk = particleSensor.begin(Wire, I2C_SPEED_STANDARD);   // 100 kHz
  if (sensorOk) {
    Serial.println("[Sensor] MAX3010x OK");
    particleSensor.setup();                      // config por defecto (IR fuerte)
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  } else {
    Serial.println("[Sensor] MAX3010x NO detectado (revisa cableado I2C). Sigo igual.");
  }
}

// ──────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  pinMode(BOOT_BUTTON, INPUT_PULLUP);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);
  Serial.println("\n=== CalmBand ESP32 ===");

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  // La MAC se lee del eFuse (siempre disponible, incluso antes de levantar WiFi).
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  char macbuf[18];
  snprintf(macbuf, sizeof(macbuf), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  deviceMac = String(macbuf);
  Serial.printf("[ID] MAC: %s\n", deviceMac.c_str());

  // Sensor MAX3010x (I2C: SDA=21, SCL=22). 100 kHz = más robusto con cables dupont.
  Wire.begin(21, 22);
  Wire.setClock(100000);
  initSensor();

  // Conecta con la red guardada o abre el portal cautivo si no hay ninguna.
  startProvisioning();

  // Registro inicial por MAC (solo si ya conectó; si no, se hace al conectar).
  if (WiFi.status() == WL_CONNECTED) registerDevice();
  lastSend = millis();
}

void loop() {
  // Mientras el portal está abierto, atenderlo y detectar la conexión.
  if (portalRunning) {
    wm.process();
    if (WiFi.status() == WL_CONNECTED) {
      portalRunning = false;
      Serial.printf("[WiFi] Conectado. IP: %s\n", WiFi.localIP().toString().c_str());
      registerDevice();
      lastSend = millis();
    }
  }

  updateStatusLed();
  maybeResetWiFi();

  // Sin WiFi: el LED parpadea y no intentamos enviar (el stack reconecta solo).
  if (WiFi.status() != WL_CONNECTED) return;

  if (sensorOk) {
    long ir = particleSensor.getIR();
    if (ir == 0) {
      // Glitch de lectura (I2C/cable): ignorar, NO borrar el histórico de latidos.
    } else if (ir < IR_FINGER_THRESHOLD) {
      // Dedo retirado de verdad: descartar el histórico.
      rrCount = 0;
      lastBeat = 0;
    } else if (checkForBeat(ir)) {
      long now = millis();
      if (lastBeat > 0) {
        long delta = now - lastBeat;
        bool plausible = (delta >= RR_MIN_MS && delta <= RR_MAX_MS);
        // Filtro de artefactos: descartar latidos que saltan >25% vs la media
        // (latido saltado o doble detección) — si no, inflan el HRV.
        if (plausible && rrCount >= 3) {
          long avg = 0;
          for (byte i = 0; i < rrCount; i++) avg += rr[i];
          avg /= rrCount;
          // Rechazar saltos > 25% del promedio (latido saltado / doble detección).
          if (labs(delta - avg) > avg / 4) plausible = false;
        }
        if (plausible) pushRR(delta);
      }
      lastBeat = now;
    }
  }

  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    // Si hace >5 s que no llega un latido, consideramos perdido el pulso.
    if (lastBeat == 0 || millis() - lastBeat > 5000) { rrCount = 0; lastBeat = 0; }

    long ir = sensorOk ? particleSensor.getIR() : 0;

    // Mandamos lectura si tenemos pulso reciente (rrCount), aunque el IR parpadee.
    if (rrCount < MIN_BEATS_TO_SEND) {
      registerDevice();
      Serial.printf("[Lectura] solo presencia — IR=%ld latidos=%d/%d\n",
                    ir, rrCount, MIN_BEATS_TO_SEND);
      // Auto-reinicio: el sensor responde pero no entrega muestras (IR=0).
      if (sensorOk && ir == 0) {
        Serial.println("[Sensor] IR=0 — reinicializando sensor…");
        initSensor();
      }
      return;
    }
    int bpm = bpmFromRR();
    int hrv = constrain(hrvFromRR(), 0, 120);   // techo fisiológico (RMSSD reposo ~20-100)
    sendReading(bpm, hrv, computeCalma(bpm, hrv));
  }
}
