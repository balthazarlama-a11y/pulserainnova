CalmBand (Next.js + Supabase)

Run locally
1. Install dependencies:
	npm install
2. Create .env.local:
	NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
	NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
	NVIDIA_API_KEY=your_nvidia_api_key
	NVIDIA_MODEL=meta/llama-3.2-3b-instruct
3. Start the dev server:
	npm run dev

NVIDIA recommendations
- La clave de NVIDIA se lee solo desde .env.local en el servidor, así que queda fija mientras no cambies ese archivo.
- Si la IA responde 401 o 403, la app te va a pedir una nueva clave y va a seguir mostrando recomendaciones guardadas.
- Después de cambiar NVIDIA_API_KEY, reiniciá el servidor para que Next.js vuelva a cargar las variables de entorno.

Supabase setup
- Apply the SQL in supabase/schema.sql to create the profiles table and RLS policies.

Routes
- / (home)
- /sign-in
- /sign-up
- /dashboard (protected)
