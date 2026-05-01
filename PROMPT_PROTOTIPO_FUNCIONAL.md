# Prompt: Hacer CalmBand 100% funcional como prototipo (sin Supabase real)

## Contexto del proyecto

CalmBand es una app Next.js 14 (App Router) para monitorear el estrés infantil mediante una pulsera wearable. El proyecto ya tiene toda la UI construida (dashboard padre, vista infantil con juegos de respiración, historial, emparejamiento de pulsera) pero **no funciona** porque la autenticación depende de Supabase con credenciales placeholder en `.env.local`.

**Tech stack:** Next.js 14.2.5, React 18.2.0, Tailwind CSS 3.4.4, @supabase/ssr 0.3.0, @supabase/supabase-js 2.45.0

## El problema

El archivo `.env.local` tiene credenciales placeholder (`https://placeholder.supabase.co`), por lo que:
- El registro (`/sign-up`) falla al llamar `supabase.auth.signUp()`
- El login (`/sign-in`) falla al llamar `supabase.auth.signInWithPassword()`
- El middleware (`middleware.js`) llama a `updateSession()` que intenta conectar con Supabase → falla → redirige siempre a `/sign-in`
- El dashboard (`app/(app)/dashboard/page.jsx`) es un Server Component que llama `supabase.auth.getUser()` directo → falla → redirige a `/sign-in`
- El Navbar usa `supabase.auth.signOut()` para cerrar sesión

## Qué necesito

Reemplazar TODA la dependencia de Supabase con un **sistema de autenticación simulado (mock)** que use cookies para mantener sesión. El prototipo debe funcionar 100% sin conexión a ningún backend externo. Los datos de la pulsera ya están simulados en `lib/mockData.js`.

## Archivos a modificar (con sus rutas exactas y qué hace cada uno)

### 1. `lib/supabase/browser.js` (líneas 1-8)
- **Actualmente:** Crea un Supabase browser client con `createBrowserClient()`
- **Cambiar a:** Exportar un mock client que simule la API de Supabase Auth:
  - `auth.signUp({ email, password, options })` → Guardar usuario en cookie, retornar `{ data: { session, user }, error: null }`
  - `auth.signInWithPassword({ email, password })` → Verificar contra usuarios guardados en cookie/memoria, retornar session
  - `auth.signOut()` → Limpiar cookie de sesión
  - `auth.getSession()` → Leer cookie y retornar session si existe
  - `auth.getUser()` → Similar a getSession pero retorna { data: { user } }
  - `auth.onAuthStateChange(callback)` → Retornar un subscription mock (no necesita hacer nada real)
  - `auth.resend()` → Retornar éxito silencioso
  - `from("profiles").upsert()` / `.select().eq().maybeSingle()` → Mock de operaciones de tabla
- **Importante:** Usar cookies (`document.cookie`) para persistir la sesión, NO localStorage. El mock user debe tener estructura: `{ id: "mock-uuid-xxx", email: "...", user_metadata: { display_name: "..." } }`

### 2. `lib/supabase/server.js` (líneas 1-29)
- **Actualmente:** Crea un Supabase server client con `createServerClient()` usando `cookies()` de Next.js
- **Cambiar a:** Exportar un mock server client que lea la cookie de sesión mock con `cookies()` de `next/headers`
  - `auth.getUser()` → Leer la cookie mock, parsearla, retornar `{ data: { user }, error: null }` o `{ data: { user: null }, error: "not_authenticated" }`
  - `from("profiles").select().eq().maybeSingle()` → Retornar datos mock del perfil

### 3. `lib/supabase/middleware.js` (líneas 1-39)
- **Actualmente:** `updateSession()` crea un server client y llama `supabase.auth.getUser()`
- **Cambiar a:** Leer directamente la cookie mock del request, parsearla, y retornar `{ response, user }`. Si la cookie existe y es JSON válido → user existe. Si no → user es null.

### 4. `components/auth/AuthProvider.jsx` (líneas 1-46)
- **Actualmente:** Crea Supabase browser client, llama `getSession()` y escucha `onAuthStateChange`
- **Cambiar a:** Usar el mock browser client. La lógica del useEffect debería funcionar igual si el mock client implementa la misma interfaz.

### 5. `components/auth/AuthForm.jsx` (líneas 1-257)
- **Actualmente:** Llama a `supabase.auth.signUp()` y `supabase.auth.signInWithPassword()`, luego upsert en tabla profiles
- **Cambiar a:** Usar el mock client (mismo código debería funcionar si el mock tiene la misma interfaz). Asegurarse de que:
  - Sign-up: Guarde el usuario en la cookie y retorne sesión inmediatamente (no hay confirmación de email)
  - Sign-in: Verifique email/password contra lo guardado y retorne sesión
  - El redirect con `window.location.assign("/dashboard")` siga funcionando

### 6. `middleware.js` (líneas 1-36)
- **No necesita cambios** si `lib/supabase/middleware.js` retorna correctamente `{ response, user }`

### 7. `app/(app)/dashboard/page.jsx` (líneas 1-24)
- **Actualmente:** Server Component que llama `supabase.auth.getUser()` y `supabase.from("profiles").select()`
- **Cambiar a:** Usar el mock server client. Si el mock implementa la misma interfaz, no necesita cambios en este archivo.

### 8. `app/auth/callback/route.js` (líneas 1-40)
- **Cambiar a:** Simplemente redirigir a `/dashboard` sin intentar intercambiar código. O dejarlo como fallback que siempre redirige.

### 9. `components/layout/Navbar.jsx` (líneas 1-80)
- **Actualmente:** Llama `supabase.auth.signOut()`
- **No necesita cambios** si el mock client implementa `signOut()` correctamente (limpiar cookie)

## Reglas del mock auth

1. **Almacenamiento:** Usar una cookie llamada `calmband-mock-session` con el JSON del usuario
2. **Registro:** Cualquier email/password válido (password >= 6 chars) se registra exitosamente. Guardar en la cookie `calmband-mock-users` una lista de usuarios registrados
3. **Login:** Verificar que el email existe en la lista de usuarios mock Y que el password coincide. Si no hay usuarios registrados, aceptar cualquier credencial (modo demo)
4. **Sesión:** Persistir con cookie `calmband-mock-session` que contenga `{ user: { id, email, user_metadata } }`
5. **Logout:** Eliminar la cookie `calmband-mock-session`
6. **No usar localStorage** — las cookies funcionan tanto en cliente como en server/middleware
7. **El mock user debe tener esta estructura:**
```json
{
  "id": "mock-uuid-001",
  "email": "usuario@ejemplo.com",
  "user_metadata": {
    "display_name": "Carolina"
  },
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

## Estructura de la sesión mock
```json
{
  "access_token": "mock-token-xxx",
  "refresh_token": "mock-refresh-xxx",
  "user": { ... }
}
```

## Datos simulados de la pulsera

Ya existen en `lib/mockData.js` y los componentes ya los usan. No necesitan cambios. Incluyen:
- Perfil de niña (Sofía, 8 años)
- Nivel de estrés en tiempo real (varía por hora del día)
- Historial 24h de estrés y BPM
- Datos semanales
- Timeline de actividades del día
- Recomendaciones por nivel de estrés
- Ejercicios completados
- Historial de sesiones (14 días)

## Resultado esperado

Después de aplicar los cambios:
1. Ir a `/sign-up` → Llenar formulario → Click "Create account" → Redirige a `/dashboard` ✅
2. Ir a `/sign-in` → Llenar formulario → Click "Sign in" → Redirige a `/dashboard` ✅
3. Dashboard muestra datos mock de Sofía con nivel de estrés, gráficas, recomendaciones ✅
4. Navegación funciona: Dashboard, Vista Infantil, Historial, Pulsera ✅
5. Click "Salir" → Redirige a `/sign-in` ✅
6. Rutas protegidas redirigen a `/sign-in` si no hay sesión ✅
7. Rutas de auth (`/sign-in`, `/sign-up`) redirigen a `/dashboard` si ya hay sesión ✅
8. La app se puede ejecutar con `npm run dev` sin ningún servicio externo ✅

## Lo que NO debe cambiar

- Toda la UI (estilos, componentes, animaciones, juegos, gráficas)
- La estructura de archivos y carpetas
- El sistema de rutas (App Router con route groups)
- Los datos mock de `lib/mockData.js`
- El `package.json` (no agregar dependencias nuevas)
- Los componentes del dashboard, kids, history, pairing

## Notas técnicas importantes

- Next.js 14 usa App Router con Server Components por defecto
- `app/(app)/dashboard/page.jsx` es un **Server Component** (async function) — necesita el mock server client
- `components/auth/AuthForm.jsx` y `components/auth/AuthProvider.jsx` son **Client Components** ("use client") — necesitan el mock browser client
- `middleware.js` corre en Edge Runtime — la cookie debe ser legible desde `request.cookies`
- El mock debe ser lo más simple posible — es un prototipo, no producción
