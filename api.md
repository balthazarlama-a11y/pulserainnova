# Contrato del hardware — CalmBand / PulseraInnova

Este documento describe cómo la pulsera (hardware) se conecta al software y envía
biometría. Cubre el emparejamiento, la ingesta de lecturas y la visualización en
vivo.

---

## 1. Ciclo completo

```
[Panel web]  POST /api/pairing   → crea persona (si hace falta) + vincula dispositivo + WiFi
[Pulsera]    POST /api/biometria → inserta lecturas (cada N segundos) + heartbeat del dispositivo
[Panel web]  Realtime / polling  → muestra calma, BPM y HRV en vivo en el dashboard
```

La pulsera **no** tiene sesión web. Por eso la ingesta usa la `service_role_key`
en el servidor (nunca en el cliente) para saltarse RLS. El emparejamiento, en
cambio, lo hace el tutor desde el navegador y respeta RLS.

---

## 2. Ingesta de biometría

### Endpoint

```
POST {BASE_URL}/api/biometria
```

### Headers

| Header          | Valor                       | Obligatorio                          |
| --------------- | --------------------------- | ------------------------------------ |
| `Content-Type`  | `application/json`          | Sí                                   |
| `Authorization` | `Bearer <DEVICE_INGEST_TOKEN>` | Solo si `DEVICE_INGEST_TOKEN` está configurado en el servidor |

> Alternativa al `Authorization`: cabecera `x-device-token: <token>`.
> Si el servidor no define `DEVICE_INGEST_TOKEN`, el endpoint queda abierto (modo prueba).

### Cuerpo (JSON)

```json
{
  "niño_id": "1e9d4c7a-3b2f-4e8a-9c10-7f6b5a4d3c21",
  "bpm": 82,
  "hrv": 65,
  "nivel_calma": 70,
  "estado": "activo"
}
```

| Campo         | Tipo   | Rango     | Obligatorio | Notas                                                  |
| ------------- | ------ | --------- | ----------- | ------------------------------------------------------ |
| `niño_id`     | string (UUID) | —  | **Sí**      | Id de la persona en la tabla `niños`. Se obtiene al emparejar. También se acepta `nino_id` (ASCII). |
| `bpm`         | number | 20–250    | No          | Pulsaciones por minuto.                                |
| `hrv`         | number | 0–600     | No          | Variabilidad de la frecuencia cardíaca (ms).           |
| `nivel_calma` | number | 0–100     | No          | 100 = máxima calma. El estrés del panel = 100 − calma. |
| `estado`      | string | —         | No          | Por defecto `"activo"`.                                |

Los valores fuera de rango devuelven `400`. Los campos numéricos ausentes se
guardan como `null`.

### Respuestas

| Código | Significado                                                          |
| ------ | ------------------------------------------------------------------- |
| `201`  | Lectura guardada. `{ "success": true, "message": "Lectura guardada" }` |
| `400`  | JSON inválido, falta `niño_id`, o métrica fuera de rango.           |
| `401`  | Token de dispositivo inválido (cuando hay token configurado).      |
| `404`  | `niño_id` no existe.                                                |
| `500`  | Servidor mal configurado (falta `SUPABASE_SERVICE_ROLE_KEY`) o error de BD. |

Cada inserción correcta también actualiza `dispositivos.last_seen` y pone
`estado = 'activo'` (heartbeat) para las pulseras de esa persona.

### Frecuencia recomendada

Una lectura cada **5–15 segundos** durante el uso. El dashboard considera la
pulsera **conectada** si la última lectura tiene < 2 min, **parcial** entre 2 y
10 min, y **desconectada** a partir de 10 min.

### Ejemplo `curl`

```bash
curl -X POST "$BASE_URL/api/biometria" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEVICE_INGEST_TOKEN" \
  -d '{"niño_id":"1e9d4c7a-3b2f-4e8a-9c10-7f6b5a4d3c21","bpm":82,"hrv":65,"nivel_calma":70}'
```

### Health-check

```bash
curl "$BASE_URL/api/biometria"
# → { "ok": true, "service": "biometria-ingest", "configured": true, "tokenRequired": false }
```

---

## 3. Emparejamiento (desde el panel)

```
POST {BASE_URL}/api/pairing      (requiere sesión de tutor; aplica RLS)
```

```json
{
  "ninoId": "uuid-existente-o-null",
  "newPerson": { "nombre": "Lucía", "edad": 10 },
  "device": {
    "nombre": "CalmBand",
    "modelo": "Pro",
    "mac": "F4:8E:38:CB:A3:F2",
    "wifiSsid": "Colegio_Red_5G"
  }
}
```

- Si `ninoId` es `null`, se crea la persona con `newPerson`.
- La **contraseña WiFi no se persiste**: se provisiona a la pulsera en el momento;
  solo se guarda el SSID para mostrarlo en el panel.
- Respuesta `201`: `{ "success": true, "ninoId": "...", "dispositivo": { ... } }`.
  Usa ese `ninoId` para configurar el firmware de la pulsera.

---

## 4. Simulador (pruebas sin hardware)

`scripts/sim-pulsera.js` envía lecturas periódicas como si fuera la pulsera.

```bash
# Persona existente (copia su id de la tab`niños` o del emparejamiento)
node scripts/sim-pulsera.js --nino <UUID>

# Contra producción, cada 3 s, escenario de crisis, con token
node scripts/sim-pulsera.js -n <UUID> -u https://miapp.vercel.app -i 3 -s crisis -t <TOKEN>

# 10 lecturas y termina
node scripts/sim-pulsera.js -n <UUID> -c 10
```

Escenarios: `calm`, `variable` (por defecto), `crisis`. Requiere Node 18+.

---

## 5. Variables de entorno

| Variable                        | Dónde            | Uso                                                      |
| ------------------------------- | ---------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | cliente+servidor | URL del proyecto Supabase.                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente+servidor | Clave pública (RLS) para el panel.                      |
| `SUPABASE_SERVICE_ROLE_KEY`     | **solo servidor**| Imprescindible para la ingesta de biometría.            |
| `DEVICE_INGEST_TOKEN`           | solo servidor    | Opcional. Si se define, la pulsera debe enviarlo.       |
| `NVIDIA_API_KEY`                | solo servidor    | Opcional. Recomendaciones IA (si falta, hay fallback local). |

Ver `.env.example`.

---

## 6. Realtime

Para que el dashboard reciba lecturas al instante, habilita Realtime para la
tabla `sesiones_biometria` (Supabase → Database → Replication, o ejecutando la
línea `ALTER PUBLICATION supabase_realtime ADD TABLE sesiones_biometria;` de
`supabase/schema.sql`). Si Realtime no está disponible, el panel usa un sondeo
de respaldo cada 20 s, así que la visualización en vivo funciona igualmente.
