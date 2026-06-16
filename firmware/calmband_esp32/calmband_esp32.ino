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

MAX30105 particleSensor;
String deviceMac;                 // "AA:BB:CC:DD:EE:FF" — identidad de la pulsera
bool   sensorOk = false;

// ── Cálculo de pulso (basado en el ejemplo HeartRate de SparkFun) ──
const byte RATE_SIZE = 8;
byte  rates[RATE_SIZE];
byte  rateSpot = 0;
long  lastBeat = 0;
float beatsPerMinute = 0;
int   beatAvg = 0;

// RR intervals (ms) → HRV aprox (RMSSD).
const byte RR_SIZE = 8;
long rrIntervals[RR_SIZE];
byte rrSpot = 0, rrCount = 0;

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
}

// ───────────────────────── Sensor / métricas ─────────────────────────
int computeHRV() {
  if (rrCount < 2) return 0;
  double sumSq = 0; int n = 0;
  for (byte i = 1; i < rrCount; i++) {
    long d = rrIntervals[i] - rrIntervals[i - 1];
    sumSq += (double)d * d; n++;
  }
  return n ? (int)sqrt(sumSq / n) : 0;
}

int computeCalma(int bpm, int hrv) {
  int fromBpm = map(constrain(bpm, 55, 130), 55, 130, 95, 20);
  int fromHrv = map(constrain(hrv, 0, 80), 0, 80, 0, 25);
  return constrain(fromBpm + fromHrv - 12, 0, 100);
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
}

// ───────────────────────── WiFi / portal cautivo ─────────────────────────
void startProvisioning(bool forced) {
  WiFiManager wm;
  wm.setConfigPortalTimeout(0);               // sin timeout: espera a que configuren

  // AP con sufijo del MAC para que el usuario reconozca su pulsera.
  String apName = "CalmBand-" + deviceMac.substring(12);  // últimos 2 bytes
  apName.replace(":", "");

  // Mostrar el MAC completo en el portal (lo necesita para vincular en la web).
  String macHtml = "<div style='text-align:center;margin:10px 0;padding:10px;"
                   "background:#eef;border-radius:8px'>MAC de esta pulsera:<br>"
                   "<b style='font-size:1.1em'>" + deviceMac + "</b></div>";
  WiFiManagerParameter macField(macHtml.c_str());
  wm.addParameter(&macField);

  Serial.printf("[WiFi] Portal abierto. Conéctate a la red \"%s\" para configurar.\n", apName.c_str());
  bool ok = forced ? wm.startConfigPortal(apName.c_str()) : wm.autoConnect(apName.c_str());
  if (ok) Serial.printf("[WiFi] Conectado. IP: %s\n", WiFi.localIP().toString().c_str());
  else    Serial.println("[WiFi] No se pudo conectar; reiniciando…");
  if (!ok) { delay(1500); ESP.restart(); }
}

void maybeResetWiFi() {
  // Mantener BOOT pulsado ~3 s borra la red guardada.
  if (digitalRead(BOOT_BUTTON) != LOW) return;
  unsigned long t0 = millis();
  while (digitalRead(BOOT_BUTTON) == LOW) {
    if (millis() - t0 > 3000) {
      Serial.println("[WiFi] BOOT mantenido: borrando credenciales y reabriendo portal…");
      WiFiManager wm; wm.resetSettings();
      delay(500); ESP.restart();
    }
    delay(50);
  }
}

// ──────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  pinMode(BOOT_BUTTON, INPUT_PULLUP);
  Serial.println("\n=== CalmBand ESP32 ===");

  WiFi.mode(WIFI_STA);
  // La MAC se lee del eFuse (siempre disponible, incluso antes de levantar WiFi).
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  char macbuf[18];
  snprintf(macbuf, sizeof(macbuf), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  deviceMac = String(macbuf);
  Serial.printf("[ID] MAC: %s\n", deviceMac.c_str());

  // Sensor MAX3010x (I2C por defecto: SDA=21, SCL=22).
  Wire.begin(21, 22);
  sensorOk = particleSensor.begin(Wire, I2C_SPEED_FAST);
  if (sensorOk) {
    Serial.println("[Sensor] MAX3010x OK");
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  } else {
    Serial.println("[Sensor] MAX3010x NO detectado (revisa cableado I2C). Sigo igual.");
  }

  // Conecta con la red guardada o abre el portal cautivo si no hay ninguna.
  startProvisioning(false);

  // Registro inicial por MAC (queda "pendiente" hasta que la asignen en la web).
  registerDevice();
  lastSend = millis();
}

void loop() {
  maybeResetWiFi();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Desconectado, reintentando…");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  if (sensorOk) {
    long irValue = particleSensor.getIR();
    if (irValue > 50000 && checkForBeat(irValue)) {
      long now = millis();
      long delta = now - lastBeat;
      lastBeat = now;
      if (delta > 0) {
        beatsPerMinute = 60.0 / (delta / 1000.0);
        if (beatsPerMinute > 30 && beatsPerMinute < 220) {
          rates[rateSpot++] = (byte)beatsPerMinute; rateSpot %= RATE_SIZE;
          int sum = 0; for (byte i = 0; i < RATE_SIZE; i++) sum += rates[i];
          beatAvg = sum / RATE_SIZE;
          rrIntervals[rrSpot++] = delta; rrSpot %= RR_SIZE;
          if (rrCount < RR_SIZE) rrCount++;
        }
      }
    }
  }

  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    bool finger = sensorOk && particleSensor.getIR() > 50000;
    if (!finger || beatAvg == 0) {
      // Sin dedo: igual mandamos un "latido" de presencia para que la web sepa
      // que la pulsera está viva (register_device actualiza last_seen).
      registerDevice();
      Serial.println("[Lectura] sin pulso estable — solo presencia");
      return;
    }
    int bpm = beatAvg, hrv = computeHRV();
    sendReading(bpm, hrv, computeCalma(bpm, hrv));
  }
}
