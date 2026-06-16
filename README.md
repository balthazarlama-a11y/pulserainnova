CalmBand (Next.js + Supabase)

Run locally
1. Install dependencies:
	npm install
2. Create .env.local:
	NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
	NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
3. Start the dev server:
	npm run dev

Supabase setup
- Apply the SQL in supabase/schema.sql to create the profiles table and RLS policies.

Routes
- / (home)
- /sign-in
- /sign-up
- /dashboard (protected)
- /pairing (protected) — vincula pulsera + persona + red WiFi

API
- POST /api/pairing — vincula la pulsera; cifra y recuerda la contraseña WiFi (auto-reconexión).
- GET|POST /api/provision — la pulsera se aprovisiona sola por su MAC: recibe su niño asignado
  y su red WiFi recordada (SSID + contraseña descifrada) para reconectarse sin acción manual.
- POST /api/biometria — la pulsera envía lecturas (por niño_id o por mac) y marca su heartbeat.

Conexión automática (sin pasos manuales)
1. Emparejamiento (una sola vez): el tutor vincula la pulsera y la red WiFi. La contraseña se
   guarda cifrada (AES-256-GCM, lib/wifiCrypto.js) para "recordar" la red.
2. Al entrar al colegio: la pulsera llama a /api/provision con su MAC, obtiene la red recordada
   y se reconecta sola. Marca su estado como "online".
3. El tutor abre la app: el dashboard carga la última lectura + dispositivo y se suscribe por
   realtime a sesiones_biometria y dispositivos, mostrando los datos en vivo automáticamente.

Variables de entorno opcionales
- WIFI_ENCRYPTION_KEY — secreto para cifrar las contraseñas WiFi (recomendado en producción).
- SUPABASE_SERVICE_ROLE_KEY — usado por /api/provision y /api/biometria (el hardware no tiene sesión).
