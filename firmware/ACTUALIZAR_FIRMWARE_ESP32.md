# Actualizar firmware del ESP32 (CalmBand) — v2.1 → v2.2

Hola 👋 Gracias por ayudar a flashear la pulsera. Este cambio hace que la pulsera
**envíe las lecturas más seguido (cada 2 s en vez de 4 s)** y que el pulso reaccione
más rápido, para que el dashboard se actualice con menos delay.

El cambio NO viaja por WiFi: hay que subir el firmware **por el cable USB** (una sola vez).
Toda la conexión WiFi de la pulsera es solo para mandar datos, no para actualizarse.

---

## Qué cambió (solo 4 líneas)

Si ya tenés el archivo `calmband_esp32.ino`, abrilo y cambiá **solo estas líneas**.
Están todas arriba del archivo, en la zona de `#define`.

| Buscá esta línea (ANTES)                          | Dejala así (DESPUÉS)                               |
|---------------------------------------------------|---------------------------------------------------|
| `#define FW_VERSION        "calmband-2.1"`        | `#define FW_VERSION        "calmband-2.2"`         |
| `#define SEND_INTERVAL_MS  4000`                  | `#define SEND_INTERVAL_MS  2000`                   |
| `#define MIN_BEATS_TO_SEND   5`                   | `#define MIN_BEATS_TO_SEND   3`                    |
| `const byte RR_SIZE = 10;`                        | `const byte RR_SIZE = 6;`                          |

> Si te pasaron el `.ino` ya actualizado junto con este instructivo, **no hace falta
> editar nada**: abrí ese archivo directamente y andá al paso de flasheo.

No toques nada más (WiFi, claves, etc.): esas cosas no cambian.

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

Desde la carpeta que contiene `calmband_esp32/`:

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

## Cómo confirmar que quedó bien ✅

1. Abrí el **Monitor Serie** (Arduino IDE: lupa arriba a la derecha) a **115200 baudios**.
2. Reiniciá la pulsera (botón EN/RST).
3. Deberías ver:
   - `firmware":"calmband-2.2"` cuando se registra → confirma que es la versión nueva.
   - La línea `[Supabase] ingest 200 ... "ok"` apareciendo **cada ~2 segundos** (antes era cada 4).

Si ves `calmband-2.2` y los `ingest ... "ok"` cada 2 s, ¡listo! 🎉

---

## Si algo no funciona

- **No aparece el puerto COM** → instalar driver CH340.
- **Error al subir / "Failed to connect"** → mantener BOOT apretado al iniciar la subida.
- **Compila pero el Monitor Serie sale ilegible** → poné 115200 baudios.
- Cualquier otra cosa, mandale captura del Monitor Serie a Baltazar.
