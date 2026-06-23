/*
 * CalmBand — Firmware ESP32 (pulsera) · v2.6
 * ---------------------------------------------------------------------------
 * Provisioning con PORTAL A MEDIDA (AP+STA simultáneo): la pulsera crea su red
 * "CalmBand-XXXX" y, al guardar las credenciales, se conecta a tu WiFi SIN bajar
 * su propia red — así la página del portal muestra el resultado REAL en vivo:
 * "✅ Conectado · IP x.x.x.x" o "❌ contraseña incorrecta". Las credenciales
 * quedan en NVS para siempre.
 *
 * La identidad de la pulsera es su MAC. Al conectarse se registra sola en
 * Supabase (queda "pendiente") y el tutor la asigna a una persona desde la web.
 * Luego envía pulso real (MAX3010x) cada pocos segundos, identificándose por MAC.
 *
 * v2.1 — Buffer offline:
 *   El sensor toma datos SIEMPRE, esté o no conectado a WiFi.
 *   Las lecturas sin conexión se guardan en un buffer circular (BUF_SIZE × 8s).
 *   Al reconectar se sincronizan por NTP y se envían con timestamps reales.
 *
 * v2.4 — Escaneo de redes robusto en el portal:
 *   Antes el portal mostraba "no se vieron redes" porque el intento de conexión
 *   STA a la red guardada mantenía la radio ocupada. Ahora /scan libera la radio
 *   (disconnect si no está conectado), reintenta el barrido y omite duplicados.
 *
 * v2.5 — SoftAP estable (el portal "no emitía señal"):
 *   En AP+STA la radio es una sola; si el STA reintenta una red en segundo plano
 *   el SoftAP salta de canal y se vuelve invisible. Ahora, con el portal abierto,
 *   el STA queda en reposo (setAutoReconnect(false) + sin reintento de la red
 *   guardada): el AP queda fijo y visible. La reconexión la dispara /save.
 *
 * v2.6 — Filtrado de latidos más permisivo (priorizar que llegue data):
 *   MIN_BEATS_TO_SEND 3→1, se quita el descarte por salto >25%, RR_MAX 1500→2000
 *   ms, reset por inactividad 5→8 s e IR_FINGER_THRESHOLD 50000→35000. El BPM
 *   puede ser más ruidoso, pero deja de quedar en 0/N y manda lecturas reales.
 *
 * Placa:     ESP32 Dev Module (FQBN esp32:esp32:esp32)
 * Sensor:    MAX30102 / MAX30105 / MAX30100  por I2C (SDA=GPIO21, SCL=GPIO22)
 * Librerías: SparkFun MAX3010x (WebServer/DNSServer/Preferences vienen con el core)
 *
 * Reconfigurar WiFi: mantené pulsado BOOT (GPIO0) ~3 s → borra la red guardada
 * y reabre el portal.
 * ---------------------------------------------------------------------------
 */

#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <time.h>               // NTP / gmtime_r
#include "esp_mac.h"            // esp_read_mac (MAC desde eFuse, disponible siempre)
#include "MAX30105.h"
#include "heartRate.h"

// Proyecto Supabase (kgamvzlehrnvpwwnjamp). La anon key es pública por diseño;
// con las funciones RPC SECURITY DEFINER solo puede registrar/enviar lecturas.
#define SUPABASE_URL  "https://kgamvzlehrnvpwwnjamp.supabase.co"
#define SUPABASE_ANON "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW12emxlaHJudnB3d25qYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzU2NzksImV4cCI6MjA5Njc1MTY3OX0.IEdSi4pbFNi2RlG468apJDxD8p0Rbf5zJyHhv1IRxJM"

#define FW_VERSION        "calmband-2.5"
#define SEND_INTERVAL_MS  2000        // envío cada 2 s (antes 4 s) → menos delay en el dashboard
#define REOPEN_PORTAL_MS  120000  // sin WiFi este tiempo y con el AP cerrado → reabrir portal
#define BOOT_BUTTON       0       // GPIO0 = botón BOOT en casi todas las placas ESP32
#define STATUS_LED        2       // LED integrado (GPIO2) en la mayoría de placas ESP32

MAX30105 particleSensor;
bool   sensorOk = false;
String deviceMac;                 // "AA:BB:CC:DD:EE:FF" — identidad de la pulsera

// ── Portal / conexión ──
WebServer  server(80);
DNSServer  dnsServer;
Preferences prefs;
bool   apActive = false;          // AP + portal levantados
String pendSsid, pendUser, pendAnon, pendPass;  // credenciales del intento en curso (user vacío = red común)
// Estado del intento de conexión que reporta /status al navegador.
enum ConnState { IDLE, CONNECTING, CONNECTED, FAILED };
ConnState connState = IDLE;
unsigned long connStart = 0, connectedAt = 0;
unsigned long disconnectedSince = 0;   // primer instante sin WiFi (0 = conectada)

// ── LED de estado: FIJO = conectado · PARPADEO = configurar/sin WiFi ──
void updateStatusLed() {
  if (WiFi.status() == WL_CONNECTED) digitalWrite(STATUS_LED, HIGH);   // fijo
  else digitalWrite(STATUS_LED, (millis() / 250) % 2);                 // parpadeo ~2/s
}
// Parpadeo corto = acabamos de mandar un dato.
void blinkActivity() {
  digitalWrite(STATUS_LED, LOW); delay(40); digitalWrite(STATUS_LED, HIGH);
}
// Celebración al conectar: 3 parpadeos rápidos y luego queda fijo (éxito).
void celebrateConnected() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(STATUS_LED, HIGH); delay(120);
    digitalWrite(STATUS_LED, LOW);  delay(120);
  }
  digitalWrite(STATUS_LED, HIGH);
}

// ── Cálculo de pulso a partir de intervalos RR (ms) ──
#define IR_FINGER_THRESHOLD 35000     // IR por debajo = no hay dedo (bajado: sin dedo lee ~22000)
#define RR_MIN_MS           333       // 180 bpm
#define RR_MAX_MS           2000      // 30 bpm (ampliado: acepta detecciones más lentas)
#define MIN_BEATS_TO_SEND   1         // priorizamos que llegue data: manda con 1 intervalo válido

const byte RR_SIZE = 6;               // media móvil de 6 latidos (antes 10) → bpm reacciona más rápido
long rr[RR_SIZE];                     // últimos intervalos RR, en orden cronológico
byte rrCount = 0;
long lastBeat = 0;

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

// ── Offline ring buffer (lecturas capturadas sin WiFi) ───────────────────────
// 400 lecturas × 8 s/lectura ≈ 53 minutos de autonomía sin conexión.
#define BUF_SIZE 400

struct OfflineReading {
  unsigned long capturedAt;   // millis() en el momento de la lectura
  int16_t bpm, hrv, calma;   // int16_t alcanza para todos los valores posibles
};
OfflineReading offBuf[BUF_SIZE];
int offHead  = 0;             // próxima posición de escritura
int offCount = 0;             // lecturas almacenadas actualmente

void offPush(int bpm, int hrv, int calma) {
  offBuf[offHead] = { millis(), (int16_t)bpm, (int16_t)hrv, (int16_t)calma };
  offHead = (offHead + 1) % BUF_SIZE;
  if (offCount < BUF_SIZE) offCount++;
  // Si el buffer está lleno, offHead avanzó sobre la lectura más antigua (ring).
}

// ── NTP ───────────────────────────────────────────────────────────────────────
bool          ntpSynced  = false;
unsigned long ntpMs      = 0;     // millis() en el momento de sincronización
time_t        ntpEpoch   = 0;     // epoch Unix en el momento de sincronización

void syncNTP() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  time_t now = 0;
  for (int i = 0; i < 20 && now < 1000000000UL; i++) {
    delay(250);
    now = time(nullptr);
  }
  if (now > 1000000000UL) {
    ntpSynced = true;
    ntpEpoch  = now;
    ntpMs     = millis();
    Serial.printf("[NTP] Sincronizado: epoch=%ld\n", (long)now);
  } else {
    Serial.println("[NTP] Sin respuesta — los datos offline se enviarán sin timestamp exacto.");
  }
}

bool prevWifiOk = false;   // para detectar la transición offline→online

// ───────────────────────── Supabase RPC ─────────────────────────
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
int computeCalma(int bpm, int hrv) {
  (void)hrv;   // el MAX30102 no mide HRV fiable; calma derivada solo del pulso.
  return constrain(map(constrain(bpm, 50, 120), 50, 120, 92, 10), 0, 100);
}

const char* estadoFromCalma(int c) {
  if (c >= 70) return "tranquilo";
  if (c >= 40) return "neutral";
  return "estres";
}

// isoTs: timestamp ISO-8601 UTC de la lectura (para datos offline). NULL = usar now() en Supabase.
void sendReading(int bpm, int hrv, int calma, const char* isoTs = nullptr) {
  String body = String("{\"p_mac\":\"") + deviceMac +
                "\",\"p_bpm\":" + bpm +
                ",\"p_hrv\":" + hrv +
                ",\"p_calma\":" + calma +
                ",\"p_estado\":\"" + estadoFromCalma(calma) + "\"";
  if (isoTs) body += String(",\"p_ts\":\"") + isoTs + "\"";
  body += "}";
  String resp;
  int code = callRpc("ingest_biometria", body, &resp);
  Serial.printf("[Supabase] ingest %d  bpm=%d hrv=%d calma=%d (%s)%s %s\n",
                code, bpm, hrv, calma, estadoFromCalma(calma),
                isoTs ? " [offline]" : "", resp.c_str());
  if (code > 0) blinkActivity();
}

// Envía hasta 3 lecturas guardadas en offBuf con sus timestamps reales (NTP) por ciclo para no bloquear.
void flushBuffer() {
  if (offCount == 0) return;
  int tail = (offHead - offCount + BUF_SIZE) % BUF_SIZE;
  int sent_this_cycle = 0;
  while (offCount > 0 && WiFi.status() == WL_CONNECTED && sent_this_cycle < 3) {
    OfflineReading& r = offBuf[tail];
    char ts[25] = {0};
    if (ntpSynced) {
      // Calcula el epoch real de la lectura a partir del offset desde la sync NTP.
      long msAgo = (long)(ntpMs - r.capturedAt);
      time_t readingEpoch = ntpEpoch - msAgo / 1000;
      struct tm t;
      gmtime_r(&readingEpoch, &t);
      strftime(ts, sizeof(ts), "%Y-%m-%dT%H:%M:%SZ", &t);
    }
    sendReading(r.bpm, r.hrv, r.calma, ntpSynced ? ts : nullptr);
    tail = (tail + 1) % BUF_SIZE;
    offCount--;
    sent_this_cycle++;
    delay(50);   // pausa muy breve
  }
  if (offCount > 0) {
    Serial.printf("[Buffer] Quedan %d lecturas offline por enviar…\n", offCount);
  } else {
    Serial.println("[Buffer] Buffer vaciado completamente.");
  }
}

void initSensor() {
  sensorOk = particleSensor.begin(Wire, I2C_SPEED_STANDARD);   // 100 kHz
  if (sensorOk) {
    Serial.println("[Sensor] MAX3010x OK");
    // Config explícita para MAX30102 (2 LEDs: Red + IR, sin verde). CLAVE: hay que
    // encender el LED INFRARROJO, que es el que se usa para detectar el dedo
    // (getIR()). El setup() por defecto usa ledMode=3 (incluye un verde inexistente)
    // y no fija la amplitud del IR → lecturas basura tipo IR=448.
    // setup(powerLevel, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange)
    particleSensor.setup(0x1F, 4, 2, 400, 411, 16384);
    particleSensor.setPulseAmplitudeRed(0x0A);   // rojo bajo (no se usa para el pulso)
    particleSensor.setPulseAmplitudeIR(0x24);    // IR fuerte → señal de dedo robusta
    particleSensor.setPulseAmplitudeGreen(0);    // el MAX30102 no tiene verde
    particleSensor.clearFIFO();
  } else {
    Serial.println("[Sensor] MAX3010x NO detectado (revisa cableado I2C). Sigo igual.");
  }
}

// ───────────────────────── Portal a medida (AP+STA) ─────────────────────────
String apName() {
  String n = "CalmBand-" + deviceMac.substring(12);
  n.replace(":", "");
  return n;
}

String jsonEscape(const String& s) {
  String o;
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if (c == '"' || c == '\\') { o += '\\'; o += c; }
    else if (c >= 32) o += c;
  }
  return o;
}

// Página del portal (HTML + JS). Escanea redes, envía credenciales y consulta
// /status hasta mostrar el resultado real de la conexión.
const char PORTAL_PAGE[] PROGMEM = R"HTML(
<!DOCTYPE html><html lang=es><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1"><title>CalmBand</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0e1116;color:#e8eef5;margin:0;padding:18px;display:flex;justify-content:center}
.card{max-width:400px;width:100%;background:#161b22;border:1px solid #2a313c;border-radius:16px;padding:22px}
h1{font-size:21px;margin:0 0 2px}.sub{color:#9aa7b4;font-size:13px;margin:0 0 16px}
.mac{font-family:monospace;background:#0e1116;border:1px solid #2a313c;border-radius:8px;padding:8px;text-align:center;font-size:12px;margin-bottom:14px;color:#9aa7b4}
label{font-size:13px;color:#9aa7b4;display:block;margin:14px 0 6px}
select,input{width:100%;background:#0e1116;border:1px solid #2a313c;border-radius:10px;padding:12px;color:#e8eef5;font-size:15px}
button{width:100%;margin-top:18px;padding:13px;border:0;border-radius:12px;background:linear-gradient(135deg,#5EDC9A,#7DD3B8);color:#06281a;font-weight:700;font-size:15px;cursor:pointer}
button:disabled{opacity:.55}
.st{margin-top:16px;padding:14px;border-radius:12px;text-align:center;font-size:14px;line-height:1.5;display:none}
.ok{background:#0f2e1f;border:1px solid #5EDC9A;color:#86f0bb}
.err{background:#2e1216;border:1px solid #ec5b6b;color:#ffb0b8}
.wait{background:#15202e;border:1px solid #3a4456;color:#9fc0ff}
.sp{display:inline-block;width:14px;height:14px;border:2px solid #9fc0ff;border-top-color:transparent;border-radius:50%;animation:s 1s linear infinite;vertical-align:-2px;margin-right:7px}
@keyframes s{to{transform:rotate(360deg)}}
</style></head><body><div class=card>
<h1>CalmBand</h1><p class=sub>Conectá la pulsera a tu WiFi (2.4 GHz)</p>
<div class=mac id=mac>MAC …</div>
<div id=form>
<label>Red WiFi</label>
<select id=ssid><option>Buscando redes…</option></select>
<label>Usuario <span style="color:#9aa7b4">(eduroam: usuario@universidad.edu)</span></label>
<input id=user type=text placeholder="Dejar vacío si la red solo tiene clave" autocomplete=off spellcheck=false inputmode=email>
<label id=anonlbl style="display:none">Identidad anónima <span style="color:#9aa7b4">(outer identity — se auto-completa)</span></label>
<input id=anon type=text placeholder="anonymous@universidad.edu" autocomplete=off spellcheck=false inputmode=email style="display:none">
<label>Contraseña</label>
<input id=pass type=password placeholder="Contraseña de la red" autocomplete=off>
<button id=go>Conectar</button>
</div>
<div class=st id=st></div>
</div><script>
var $=function(i){return document.getElementById(i)};
fetch('/info').then(function(r){return r.json()}).then(function(d){$('mac').textContent='MAC '+d.mac});
fetch('/scan').then(function(r){return r.json()}).then(function(n){var s=$('ssid');s.innerHTML='';
 if(!n.length){s.innerHTML='<option>(no se vieron redes)</option>';return}
 n.forEach(function(x){var o=document.createElement('option');o.textContent=x;s.appendChild(o)})}).catch(function(){});
function show(c,h){var e=$('st');e.className='st '+c;e.innerHTML=h;e.style.display='block'}
$('user').oninput=function(){
 var u=$('user').value,at=u.indexOf('@');
 var show=u.length>0;
 $('anonlbl').style.display=show?'block':'none';
 $('anon').style.display=show?'block':'none';
 if(at>0)$('anon').value='anonymous'+u.substring(at);
 else if(!u.length)$('anon').value='';
};
$('go').onclick=function(){
 var ssid=$('ssid').value,user=$('user').value,anon=$('anon').value,pass=$('pass').value;
 $('go').disabled=true;show('wait','<span class=sp></span>Guardando y conectando…');
 fetch('/save',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:'ssid='+encodeURIComponent(ssid)+'&user='+encodeURIComponent(user)+'&anon='+encodeURIComponent(anon)+'&pass='+encodeURIComponent(pass)})
  .then(function(){setTimeout(poll,1200)}).catch(function(){setTimeout(poll,1200)});
};
function poll(){fetch('/status').then(function(r){return r.json()}).then(function(d){
 if(d.state=='connected'){show('ok','✅ <b>¡Conectada!</b><br>Red: '+d.ssid+'<br>IP: '+d.ip+'<br><br>Ya podés cerrar esta página. La pulsera ya envía datos.')}
 else if(d.state=='failed'){show('err','❌ <b>No se pudo conectar.</b><br>Revisá la contraseña y reintentá.');$('go').disabled=false}
 else{show('wait','<span class=sp></span>Conectando a la red…');setTimeout(poll,1500)}
}).catch(function(){setTimeout(poll,1500)})}
</script></body></html>
)HTML";

void handleRoot()   { server.send_P(200, "text/html", PORTAL_PAGE); }
void handleInfo()   { server.send(200, "application/json", "{\"mac\":\"" + deviceMac + "\"}"); }

void handleScan() {
  // En modo portal (AP+STA) suele haber un intento de conexión STA en curso
  // (p. ej. a una red guardada que ya no existe) que mantiene la radio ocupada
  // y hace que WiFi.scanNetworks() devuelva 0 → "no se vieron redes". Si NO
  // estamos conectados, abortamos ese intento para liberar la radio, y luego
  // escaneamos de forma síncrona reintentando si el primer barrido falla.
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.disconnect();   // no borra credenciales; solo corta el intento en curso
    delay(120);
  }
  int n = WiFi.scanNetworks(false /*async*/, true /*incluir ocultas*/);
  for (int tries = 0; n <= 0 && tries < 3; tries++) {
    WiFi.scanDelete();
    delay(300);
    n = WiFi.scanNetworks(false, true);
  }

  // Construir JSON sin SSIDs vacíos y sin duplicados (2.4/5 GHz con mismo nombre).
  String j = "[";
  for (int i = 0; i < n; i++) {
    String s = WiFi.SSID(i);
    if (s.length() == 0) continue;                 // red oculta sin nombre
    if (j.indexOf("\"" + jsonEscape(s) + "\"") >= 0) continue;  // ya está
    if (j.length() > 1) j += ",";
    j += "\"" + jsonEscape(s) + "\"";
  }
  j += "]";
  WiFi.scanDelete();
  Serial.printf("[Portal] scan -> %d redes encontradas\n", n);
  server.send(200, "application/json", j);
}

// Conecta según el tipo de red:
//   user vacío → WPA2-Personal (clave simple)
//   user con @ → WPA2-Enterprise PEAP/MSCHAPv2 (eduroam, redes universitarias)
// eduroam requiere outer identity ≠ inner username. Si anon está vacío se
// auto-genera como "anonymous@dominio" (estándar eduroam RFC 7542).
void wifiConnect(const String& ssid, const String& user, const String& anon, const String& pass) {
  WiFi.disconnect(true);
  delay(100);
  if (user.length()) {
    String outer = anon.length() ? anon : user;
    if (!anon.length()) {
      int at = user.indexOf('@');
      if (at > 0) outer = "anonymous" + user.substring(at);
    }
    Serial.printf("[WiFi] Enterprise — outer: %s  inner: %s\n", outer.c_str(), user.c_str());
    WiFi.begin(ssid.c_str(), WPA2_AUTH_PEAP,
               outer.c_str(),  // outer identity (anonymous@dominio)
               user.c_str(),   // inner username  (user@dominio)
               pass.c_str());
  } else {
    WiFi.begin(ssid.c_str(), pass.c_str());
  }
}

void beginConnect(const String& ssid, const String& user, const String& anon, const String& pass) {
  pendSsid = ssid; pendUser = user; pendAnon = anon; pendPass = pass;
  wifiConnect(ssid, user, anon, pass);
  connState = CONNECTING;
  connStart = millis();
  Serial.printf("[WiFi] Intentando conectar a \"%s\"%s…\n",
                ssid.c_str(), user.length() ? " (Enterprise)" : "");
}

void handleSave() {
  String ssid = server.arg("ssid");
  String user = server.arg("user");
  String anon = server.arg("anon");   // outer identity (eduroam); vacío = auto
  String pass = server.arg("pass");
  if (ssid.length() == 0) { server.send(400, "text/plain", "ssid vacío"); return; }
  beginConnect(ssid, user, anon, pass);
  server.send(200, "text/plain", "ok");
}

void handleStatus() {
  const char* st = (WiFi.status() == WL_CONNECTED) ? "connected"
                 : (connState == FAILED)           ? "failed"
                 :                                    "connecting";
  String j = String("{\"state\":\"") + st +
             "\",\"ssid\":\"" + jsonEscape(pendSsid) +
             "\",\"ip\":\"" + WiFi.localIP().toString() + "\"}";
  server.send(200, "application/json", j);
}

void startAPPortal() {
  // STA en reposo mientras el portal está abierto: en AP+STA la radio es una
  // sola; si el STA escanea o reintenta una red (p. ej. una guardada que ya no
  // existe) el SoftAP salta de canal y se vuelve invisible/inestable. Lo dejamos
  // quieto → el AP queda fijo en un canal y visible para el celular.
  WiFi.setAutoReconnect(false);
  WiFi.mode(WIFI_AP_STA);
  WiFi.disconnect(false);          // corta cualquier intento STA en curso (sin apagar la radio)
  WiFi.softAP(apName().c_str());
  delay(120);
  dnsServer.start(53, "*", WiFi.softAPIP());

  server.on("/",        handleRoot);
  server.on("/info",    handleInfo);
  server.on("/scan",    handleScan);
  server.on("/save",    HTTP_POST, handleSave);
  server.on("/status",  handleStatus);
  server.onNotFound(handleRoot);   // portal cautivo: cualquier URL muestra la página
  server.begin();
  apActive = true;
  connState = IDLE;

  // NO reintentamos la red guardada en segundo plano: en el arranque (setup) ya
  // se probó durante 30 s, y reintentarla acá tira abajo el AP. La reconexión la
  // dispara el usuario al guardar una red desde el portal (/save).

  Serial.printf("[WiFi] Portal AP abierto: \"%s\" (192.168.4.1). LED parpadeando.\n",
                apName().c_str());
}

void stopAPPortal() {
  server.stop();
  dnsServer.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);
  apActive = false;
  Serial.println("[WiFi] Portal cerrado — modo estación.");
}

void maybeResetWiFi() {
  if (digitalRead(BOOT_BUTTON) != LOW) return;
  unsigned long t0 = millis();
  while (digitalRead(BOOT_BUTTON) == LOW) {
    updateStatusLed();
    if (millis() - t0 > 3000) {
      Serial.println("[WiFi] BOOT mantenido: borrando credenciales y reiniciando…");
      prefs.clear();
      delay(400); ESP.restart();
    }
    delay(50);
  }
}

// ──────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  pinMode(BOOT_BUTTON, INPUT_PULLUP);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);
  Serial.println("\n=== CalmBand ESP32 v2.6 ===");

  // MAC desde eFuse (siempre disponible).
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  char macbuf[18];
  snprintf(macbuf, sizeof(macbuf), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  deviceMac = String(macbuf);
  Serial.printf("[ID] MAC: %s\n", deviceMac.c_str());

  // Sensor MAX3010x (I2C 100 kHz = más robusto con cables dupont).
  Wire.begin(21, 22);
  Wire.setClock(100000);
  initSensor();

  prefs.begin("calmband", false);
  WiFi.setAutoReconnect(true);

  // Intento con la red guardada (espera breve con LED parpadeando).
  String ssid = prefs.getString("ssid", "");
  if (ssid.length()) {
    Serial.printf("[WiFi] Red guardada: \"%s\". Conectando…\n", ssid.c_str());
    WiFi.mode(WIFI_STA);
    wifiConnect(ssid, prefs.getString("user", ""), prefs.getString("anon", ""), prefs.getString("pass", ""));
    unsigned long t0 = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - t0 < 30000) {
      updateStatusLed(); delay(50);
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] Conectado. IP: %s\n", WiFi.localIP().toString().c_str());
    connState = CONNECTED;
    celebrateConnected();
    syncNTP();
    registerDevice();
    prevWifiOk = true;
  } else {
    startAPPortal();   // sin red o falló: abre el portal a medida
  }
  lastSend = millis();
}

void loop() {
  // Atender el portal (DNS + web) mientras está activo.
  if (apActive) {
    dnsServer.processNextRequest();
    server.handleClient();
  }

  // Máquina de conexión disparada por /save o por reintento de creds guardadas.
  if (connState == CONNECTING) {
    if (WiFi.status() == WL_CONNECTED) {
      connState = CONNECTED;
      connectedAt = millis();
      WiFi.setAutoReconnect(true);   // ya conectados: que el STA reconecte solo si se cae
      prefs.putString("ssid", pendSsid);
      prefs.putString("user", pendUser);
      prefs.putString("anon", pendAnon);
      prefs.putString("pass", pendPass);
      Serial.printf("[WiFi] Conectado. IP: %s\n", WiFi.localIP().toString().c_str());
      celebrateConnected();
      registerDevice();
      lastSend = millis();
    } else if (millis() - connStart > 35000) {
      connState = FAILED;
      Serial.println("[WiFi] Conexión fallida (clave incorrecta, red fuera de alcance o servidor RADIUS tardó demasiado).");
    }
  }

  // Tras conectar, dejamos el portal abierto 45 s (para ver la página de éxito)
  // y luego lo cerramos para ahorrar y quedar en modo estación.
  if (apActive && connState == CONNECTED && millis() - connectedAt > 45000) {
    stopAPPortal();
  }

  updateStatusLed();
  maybeResetWiFi();

  bool wifiOk = (WiFi.status() == WL_CONNECTED);

  if (!wifiOk) {
    // Sin WiFi: gestionar reconexión automática y eventual reapertura del portal.
    if (!apActive) {
      if (disconnectedSince == 0) disconnectedSince = millis();
      else if (millis() - disconnectedSince > REOPEN_PORTAL_MS) {
        Serial.println("[WiFi] Sin conexión sostenida — reabriendo portal.");
        startAPPortal();
        disconnectedSince = 0;
      }
    }
    // No hacemos return: el sensor sigue leyendo y las métricas van al buffer.
  } else {
    disconnectedSince = 0;
    // Transición offline → online: sincronizar NTP y vaciar el buffer acumulado.
    if (!prevWifiOk) {
      if (!ntpSynced) syncNTP();
      if (offCount > 0) flushBuffer();
    }
  }
  prevWifiOk = wifiOk;

  // ── Lectura de pulso (SIEMPRE, con o sin WiFi) ──
  if (sensorOk) {
    long ir = particleSensor.getIR();
    if (ir == 0) {
      // Glitch de lectura (I2C/cable): ignorar, NO borrar el histórico de latidos.
    } else if (ir < IR_FINGER_THRESHOLD) {
      rrCount = 0;
      lastBeat = 0;
    } else if (checkForBeat(ir)) {
      long now = millis();
      if (lastBeat > 0) {
        long delta = now - lastBeat;
        // Filtrado mínimo: solo el rango fisiológico (RR_MIN..RR_MAX). Se quitó el
        // descarte por "salto >25%" porque frenaba la acumulación y dejaba 0/N.
        if (delta >= RR_MIN_MS && delta <= RR_MAX_MS) pushRR(delta);
      }
      lastBeat = now;
    }
  }

  // ── Envío / buffering periódico ──
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    if (lastBeat == 0 || millis() - lastBeat > 8000) { rrCount = 0; lastBeat = 0; }
    long ir = sensorOk ? particleSensor.getIR() : 0;

    if (rrCount < MIN_BEATS_TO_SEND) {
      // Pocas muestras: solo mandamos heartbeat de presencia si hay WiFi.
      if (wifiOk) {
        registerDevice();
        Serial.printf("[Lectura] solo presencia — IR=%ld latidos=%d/%d\n",
                      ir, rrCount, MIN_BEATS_TO_SEND);
      } else {
        Serial.printf("[Lectura] sin WiFi — IR=%ld latidos=%d/%d (esperando)\n",
                      ir, rrCount, MIN_BEATS_TO_SEND);
      }
      if (sensorOk && ir == 0) { Serial.println("[Sensor] IR=0 — reinicializando…"); initSensor(); }
      return;
    }

    int bpm   = bpmFromRR();
    int hrv   = constrain(hrvFromRR(), 0, 120);
    int calma = computeCalma(bpm, hrv);

    if (wifiOk) {
      sendReading(bpm, hrv, calma);
    } else {
      offPush(bpm, hrv, calma);
      Serial.printf("[Buffer] +1 offline — bpm=%d hrv=%d calma=%d  cola=%d/%d\n",
                    bpm, hrv, calma, offCount, BUF_SIZE);
    }
  }
}
