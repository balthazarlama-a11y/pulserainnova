// Mock middleware helper — reads session cookie from the request
// No real Supabase connection needed

import { NextResponse } from "next/server";

const COOKIE_SESSION = "calmband-mock-session";

export async function updateSession(request) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  let user = null;

  try {
    const raw = request.cookies.get(COOKIE_SESSION)?.value;
    if (raw) {
      const session = JSON.parse(decodeURIComponent(raw));
      user = session?.user || null;
    }
  } catch {
    user = null;
  }

  return { response, user };
}
