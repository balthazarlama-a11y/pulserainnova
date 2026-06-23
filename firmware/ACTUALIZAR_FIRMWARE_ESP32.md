# Actualizar firmware del ESP32 (CalmBand) — v2.4

Hola 👋 Gracias por ayudar a flashear la pulsera. El firmware **v2.4** arregla el
escaneo de redes del portal de configuración: antes el portal podía mostrar
**"no se vieron redes"** y ahora lista todas las redes 2.4 GHz disponibles para
que elijas a cuál conectarte.

El cambio NO viaja por WiFi: hay que subir el firmware **por el cable USB** (una sola vez).
Toda la conexión WiFi de la pulsera es solo para mandar datos, no para actualizarse.

---

## Qué cambió en v2.4

- **Escaneo de redes robusto en el portal.** El portal levanta en modo AP+STA y,
  si había una red guardada que ya no existe, la pulsera seguía intentando
  conectarse a ella y eso dejaba la radio ocupada → el escaneo devolvía 0 redes.
  Ahora `/scan` corta ese intento para liberar la radio, reintenta el barrido y
  omite redes sin nombre y duplicados (mismo SSID en 2.4/5 GHz).
- Incluye el fix de sensor de v2.3 (config explícita del LED infrarrojo del
  MAX30102) y el buffer offline en RAM de v2.1 (~53 min sin conexión).

> Si te pasaron el `.ino` ya actualizado, **no hace falta editar nada**: abrí ese
> archivo directamente y andá al paso de flasheo.

No toques las claves de Supabase ni el WiFi en el código: esas cosas no cambian.

---

## Cómo flashear — Opción A: Arduino IDE (la más simple)

1. Conectá la pulsera (ESP32) por USB.
2. Abrí `calmband_esp32.ino` en el Arduino IDE.
3. En **Herramientas → Placa**, elegí la placa ESP32 (típicamente *ESP32 Dev Module*;
   si Baltazar te dijo otro modelo, usá ese).
4. En **Herramientas → Puerto**, elegí el COM que aparezca (ej. `COM3`). Es un chip
   CH340; si no aparece el puerto, instalá el driver CH340.
5. Apretá el botón **Subir** (la flecha →). Esperá a que diga *"Subida completada"*.

> Si falla la subida: mantené apretado el botón **BOOT** de la placa justo cuando
> empieza a subir, y soltalo cuando veas "Connecting...".

---

## Cómo flashear — Opción B: arduino-cli (línea de comandos)

Desde la carpeta `firmware/` (la que contiene `calmband_esp32/`):

```bash
# Compilar
arduino-cli compile --fqbn esp32:esp32:esp32 calmband_esp32

# Subir (cambiá COM3 por el puerto real)
arduino-cli upload -p COM3 --fqbn esp32:esp32:esp32 calmband_esp32
```

Para ver el puerto y la placa correctos:

```bash
arduino-cli board list
```

Si la placa no es la genérica `esp32:esp32:esp32`, cambiá el `--fqbn`
(ej. `esp32:esp32:esp32doit-devkit-v1`).

---

## Conectar la pulsera a tu WiFi (portal de configuración)

Si la pulsera no tiene red guardada (o la guardada no está disponible), abre su
propio portal:

1. Desde el **celular**, conectate a la red WiFi **`CalmBand-XXXX`** (abierta, sin clave).
2. Se abre solo el portal. Si no, entrá a `192.168.4.1`.
3. La lista de redes se completa con las **2.4 GHz** que haya alrededor (el ESP32
   no ve las de 5 GHz). Elegí la tuya y poné la clave.
   - **Redes universitarias / eduroam:** completá el campo *Usuario*
     (`usuario@universidad.edu`); la identidad anónima se autocompleta.
4. Esperá el **"✅ ¡Conectada!"**. Ahí la pulsera empieza a registrarse en Supabase.

Para **reconfigurar el WiFi** más adelante: mantené apretado **BOOT** ~3 s → borra
la red guardada y reabre el portal.

---

## Cómo confirmar que quedó bien ✅

1. Abrí el **Monitor Serie** (Arduino IDE: lupa arriba a la derecha) a **115200 baudios**.
2. Reiniciá la pulsera (botón EN/RST).
3. Deberías ver:
   - `=== CalmBand ESP32 v2.4 ===` al arrancar → confirma la versión nueva.
   - `firmware":"calmband-2.4"` cuando se registra.
   - Con WiFi conectado, la línea `[Supabase] ingest 200 ... "ok"` cada ~2 s.
4. Para **pulso real**, poné el dedo firme sobre el sensor: el `IR` tiene que
   saltar por arriba de **50000** (sin dedo queda en ~130, es normal) y empezar a
   contar latidos.

> Si el dashboard sigue vacío aunque la pulsera esté conectada: está "pendiente" y
> hay que **vincularla a una persona** desde la web (por su MAC). Sin vincular, la
> ingesta responde `unassigned` y no guarda lecturas.

---

## Si algo no funciona

- **No aparece el puerto COM** → instalar driver CH340.
- **Error al subir / "Failed to connect"** → mantener BOOT apretado al iniciar la subida.
- **El portal muestra "no se vieron redes"** → esto se arregló en v2.4; asegurate de
  estar en esta versión (banner `v2.4` en el Monitor Serie).
- **Compila pero el Monitor Serie sale ilegible** → poné 115200 baudios.
- Cualquier otra cosa, mandale captura del Monitor Serie a Baltazar.
