import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // Mock callback — no code exchange needed, just redirect
  return NextResponse.redirect(new URL(next, request.url))
}
