import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/dashboard"];
const AUTH_PATHS = ["/sign-in", "/sign-up"];

export async function middleware(request) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (PROTECTED_PATHS.some((route) => path.startsWith(route)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (AUTH_PATHS.some((route) => path.startsWith(route)) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in",
    "/sign-up",
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
