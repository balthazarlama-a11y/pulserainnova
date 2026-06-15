import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/dashboard", "/kids", "/pairing", "/history", "/onboarding", "/settings"];
const AUTH_PATHS = ["/sign-in", "/sign-up"];

export async function middleware(request) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Redirige preservando las cookies de sesión refrescadas por updateSession.
  const redirectTo = (pathname) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (PROTECTED_PATHS.some((route) => path.startsWith(route)) && !user) {
    return redirectTo("/sign-in");
  }

  if (user) {
    const rol = user.user_metadata?.rol || 'tutor';

    // Redirigir fuera de las rutas de auth según el rol
    if (AUTH_PATHS.some((route) => path.startsWith(route))) {
      return redirectTo(rol === 'niño' ? '/kids' : '/dashboard');
    }

    // Restricciones estrictas para el rol 'niño'
    if (rol === 'niño' && !path.startsWith('/kids')) {
      return redirectTo('/kids');
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/kids/:path*",
    "/pairing/:path*",
    "/history/:path*",
    "/sign-in",
    "/sign-up",
    // Excluimos /api (la pulsera ingiere sin sesión y no debe pagar el coste de
    // getUser) y los assets estáticos. El resto pasa por la comprobación de auth.
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ]
};
