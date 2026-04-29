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
