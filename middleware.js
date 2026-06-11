import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SIMULATION_ONLY } from "@/lib/simulationMode";

const PROTECTED_PATHS = ["/dashboard", "/kids", "/pairing", "/history", "/onboarding", "/settings"];
const AUTH_PATHS = ["/sign-in", "/sign-up"];

export async function middleware(request) {
  if (SIMULATION_ONLY) {
    return NextResponse.next();
  }
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (PROTECTED_PATHS.some((route) => path.startsWith(route)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (user) {
    const rol = user.user_metadata?.rol || 'tutor';

    // Redirigir fuera de las rutas de auth según el rol
    if (AUTH_PATHS.some((route) => path.startsWith(route))) {
      const url = request.nextUrl.clone();
      url.pathname = rol === 'niño' ? '/kids' : '/dashboard';
      return NextResponse.redirect(url);
    }

    // Restricciones estrictas para el rol 'niño'
    if (rol === 'niño' && !path.startsWith('/kids')) {
      const url = request.nextUrl.clone();
      url.pathname = '/kids';
      return NextResponse.redirect(url);
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
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
