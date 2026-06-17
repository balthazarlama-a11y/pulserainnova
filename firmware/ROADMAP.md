# CalmBand — Roadmap del firmware ESP32

Estado actual: provisioning por **portal cautivo WiFi** (WiFiManager), identidad por
**MAC**, envío de biometría real a Supabase vía RPC. Funcionando end-to-end.

Quedan dos features grandes. Ambas **requieren la pulsera conectada por USB** para
flashear y verificar por serial.

---

## 1. Soporte eduroam (WPA2-Enterprise / 802.1X)

**Problema:** eduroam no usa una sola contraseña, sino usuario + clave (PEAP-MSCHAPv2).
WiFiManager no lo soporta. El portal cautivo actual solo sirve para redes normales
(WPA2-PSK) o hotspots.

**Solución:** conectar con la API enterprise del ESP32 (`esp_eap_client.h`, core 3.x).

Boceto:
```cpp
#include "esp_eap_client.h"
WiFi.mode(WIFI_STA);
esp_eap_client_set_identity((uint8_t*)IDENTITY, strlen(IDENTITY)); // outer (anónima ok)
esp_eap_client_set_username((uint8_t*)USERNAME, strlen(USERNAME)); // user@uni.edu
esp_eap_client_set_password((uint8_t*)PASSWORD, strlen(PASSWORD));
esp_wifi_sta_enterprise_enable();
WiFi.begin("eduroam");   // sin contraseña PSK
```

**Decisiones a tomar:**
- Cómo cargar usuario/clave: (a) campos extra en el portal cautivo (WiFiManagerParameter,
  guardar en Preferences/NVS, y si están presentes usar modo enterprise); o (b) quemadas
  como constantes y recompilar por usuario. (a) es más flexible.
- Detectar si la red es enterprise vs normal para elegir el método de conexión.

**Caveats reales:**
- Muchas universidades bloquean dispositivos IoT en eduroam o aíslan clientes; puede que
  no deje salir a internet aunque conecte. Probar antes de depender de esto.
- Algunas eduroam exigen validar el certificado del servidor (CA). Empezar sin validar
  (inseguro pero funcional) y endurecer después si hace falta.

---

## 2. BLE Improv — configurar por Bluetooth desde la web

**Objetivo:** botón en la web que, por **Web Bluetooth**, encuentra la pulsera y le
manda las credenciales WiFi. Estándar **Improv-WiFi** (hay web component oficial).

**Limitación:** Web Bluetooth solo en **Chrome/Edge (Android/PC)**. No en iPhone/Firefox.
Por eso el portal cautivo WiFi se mantiene como camino universal; Improv es un extra.

**Firmware:** implementar el servicio BLE Improv (UUIDs y state machine del estándar) o
usar una librería Arduino de Improv-BLE. Al recibir SSID+clave, guardar en NVS (igual que
hoy) y conectar; devolver la URL de redirección de Improv apuntando a /pairing.

**Web:** integrar el web component `improv-wifi-sdk` (`<improv-wifi-launch-button>`) en
`/pairing`. Tras provisionar, leer la MAC y reclamar el dispositivo (claim_device) — el
mismo flujo que ya existe, pero con la MAC capturada automáticamente.

**Riesgo:** el handshake Improv-BLE no se puede verificar sin un navegador + la pulsera;
iterar con hardware en mano.

---

## Notas de calidad de dato (ya implementadas)
- bpm: media de intervalos RR plausibles (40-180 bpm), warmup de 5 latidos, descarte al
  soltar el sensor, filtro de artefactos (>25% vs media).
- HRV: el MAX30102 + detección simple **no da HRV fiable** (jitter de timing). Se topea a
  120 pero sigue siendo aproximado; no se muestra en la UI. Para HRV real haría falta un
  pipeline PPG sobre muestras crudas.
- nivel_calma: derivado solo del pulso (el HRV saturaba el valor en 100).
