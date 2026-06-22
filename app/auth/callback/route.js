import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  const supabase = createClient()

  // Flujo PKCE: el enlace trae un `code` que canjeamos por una sesión.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/sign-in?error=auth', request.url))
    }
  } else if (tokenHash && type) {
    // Flujo clásico de enlaces de correo (confirmación / recuperación).
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash
    })
    if (error) {
      return NextResponse.redirect(new URL('/sign-in?error=auth', request.url))
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
