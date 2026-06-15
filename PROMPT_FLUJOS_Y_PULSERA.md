# Prompt — Dejar todos los flujos/rutas funcionales y conectar la pulsera al software

## Rol y objetivo
Actúa como ingeniero full-stack senior del proyecto **PulseraInnova / CalmBand**
(Next.js 14 App Router en JavaScript + Supabase). Tu misión es:

1. **Revisar y dejar funcionando de extremo a extremo todos los flujos y rutas de la web.**
2. **Hacer que una pulsera (hardware) se pueda conectar al software y enviar datos**,
   de modo que el panel muestre la biometría en tiempo (casi) real y todo el ciclo
   *emparejar → enviar datos → visualizar* quede operativo.

No rompas el diseño visual existente. Cambia solo lo necesario para que funcione,
y deja todo probado.

## Contexto del proyecto (no lo redescubras, ya está así)
- **Stack:** Next.js 14 (App Router, archivos `.jsx`/`.js`, sin TypeScript),
  Tailwind, Supabase (`@supabase/ssr` + `@supabase/supabase-js`).
- **Auth y roles:** Supabase Auth. Roles en `user_metadata.rol`: `tutor`, `niño`,
  `admin_colegio`. `middleware.js` protege rutas y redirige según rol
  (el rol `niño` queda confinado a `/kids`).
- **Rutas web (App Router):**
  - `app/(auth)/sign-in`, `app/(auth)/sign-up`
  - `app/(app)/dashboard`, `/kids`, `/onboarding`, `/pairing`, `/history`,
    `/schedule`, `/settings`
  - API: `app/api/pairing/route.js`, `app/api/biometria/route.js`,
    `app/api/recommendations/route.js`, `app/auth/callback/route.js`
- **Datos (Supabase, `supabase/schema.sql`):** tablas `usuarios`, `niños`,
  `dispositivos`, `sesiones_biometria`, `eventos_actividad`, `juegos_completados`,
  `ejercicios_respiracion`, `colegios`. RLS activo: los tutores solo ven/gestionan
  sus propios `niños` y datos asociados. Hay trigger `handle_new_user` que crea fila
  en `usuarios` al registrarse.
- **Contexto de personas:** `lib/peopleContext.jsx` expone la lista real de `niños`
  del tutor, la persona seleccionada (en localStorage) y utilidades de refresco.
- **Emparejamiento:** `components/pairing/PairingClient.jsx` (UI con pasos
  form → connecting → success → error) llama a `POST /api/pairing`, que crea la
  persona si hace falta e inserta el `dispositivo`. La contraseña WiFi NO se persiste
  (solo se guarda el SSID).
- **Ingesta de la pulsera:** `POST /api/biometria` usa `service_role` para saltarse
  RLS e insertar en `sesiones_biometria` (el hardware no tiene sesión web).

## Trabajo a realizar

### 1) Auditoría de flujos y rutas (haz esto primero)
Recorre y verifica cada ruta y cada flujo end-to-end. Para cada uno documenta:
estado actual, fallos detectados y la corrección aplicada.
- **Registro/Login:** sign-up → trigger crea `usuarios` → callback → redirección por
  rol. Login, logout, sesión persistente, refresco de cookies en redirects.
- **Protección de rutas:** que `middleware.js` redirija correctamente (no logueado →
  `/sign-in`; logueado en rutas de auth → dashboard o `/kids`; rol `niño` confinado).
  Revisa que el `matcher` no rompa assets ni el callback de auth.
- **Onboarding:** que no bloquee el acceso al dashboard y guíe a emparejar la primera
  pulsera.
- **Dashboard:** carga de personas reales, selector de persona, tarjetas de estado y
  conexión del dispositivo, datos biométricos. Estados de carga, vacío y error.
- **Kids:** vista del rol niño funcional y aislada.
- **Pairing:** flujo completo de emparejamiento (persona existente o nueva + WiFi),
  manejo de errores y refresco de la lista al terminar.
- **History / Schedule / Settings:** que muestren datos reales (o estado vacío claro)
  y que las acciones (guardar, editar, eliminar) persistan en Supabase.
- **Navegación:** todos los links, botones y redirecciones llevan a destinos válidos.
  Cero rutas muertas o 404 internos.

### 2) Conexión de la pulsera al software (núcleo de la tarea)
Deja operativo el ciclo completo hardware ↔ software:
- **Emparejamiento:** confirma que `POST /api/pairing` vincula `dispositivo` a la
  persona correcta, respeta RLS y refleja `estado` y `last_seen`.
- **Ingesta de biometría:** robustece `POST /api/biometria`:
  - Validación de payload (`niño_id` requerido; rangos de `bpm`, `hrv`, `nivel_calma`).
  - Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada y **no** caiga
    silenciosamente al anon key (advierte si falta).
  - Actualiza `dispositivos.last_seen`/`estado` al recibir datos (heartbeat) para que
    el panel sepa si la pulsera está "en línea".
  - Idealmente protege el endpoint con un token/secreto de dispositivo.
- **Visualización en vivo:** el dashboard debe reflejar los datos entrantes. Usa
  Supabase Realtime (suscripción a `sesiones_biometria`) o polling razonable, con
  indicador de "conectado / sin conexión" basado en `last_seen`.
- **Simulador de pulsera:** crea un script/utilidad (p. ej. `scripts/sim-pulsera.js`
  o una ruta de prueba) que envíe POSTs periódicos a `/api/biometria` para poder
  probar todo el flujo **sin hardware físico**. Documenta cómo usarlo.
- **Documenta el contrato del hardware** en `api.md`: endpoint, método, headers,
  formato JSON exacto, frecuencia de envío y ejemplo de `curl`.

### 3) Calidad y verificación
- Que `npm run build` y `npm run lint` pasen sin errores.
- Maneja estados de carga, vacío y error en cada vista (sin pantallas en blanco ni
  crashes por datos nulos).
- No introduzcas datos ficticios: usa datos reales de Supabase o estados vacíos.
- Verifica con el flujo real: registra un usuario, empareja una pulsera, lanza el
  simulador y comprueba que el dashboard muestra la biometría en vivo.

## Variables de entorno necesarias
Confirma/documenta en el README:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (imprescindible para la ingesta de la pulsera)

## Entregables
1. Todas las rutas y flujos web funcionando, probados y sin enlaces rotos.
2. Pulsera conectable: emparejamiento + ingesta de biometría + visualización en vivo.
3. Simulador de pulsera y contrato de hardware documentado en `api.md`.
4. `build` y `lint` en verde.
5. Un resumen en el commit/PR de: qué estaba roto, qué se corrigió y cómo probarlo.

## Restricciones
- Mantén el stack y el diseño actuales; no migres a TypeScript ni cambies librerías
  sin necesidad.
- Respeta RLS y la separación de roles tutor/niño.
- No expongas claves ni `service_role` al cliente.
- Trabaja en la rama indicada, commits claros, y **no abras PR salvo que se pida**.
