// Mock Supabase server client — reads session from cookies (next/headers)
// No real Supabase connection needed

import { cookies } from "next/headers";

const COOKIE_SESSION = "calmband-mock-session";

function parseSessionCookie(cookieStore) {
  try {
    const raw = cookieStore.get(COOKIE_SESSION)?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function createClient() {
  const cookieStore = cookies();
  const session = parseSessionCookie(cookieStore);

  const auth = {
    async getUser() {
      if (session?.user) {
        return { data: { user: session.user }, error: null };
      }
      return { data: { user: null }, error: { message: "not_authenticated" } };
    },

    async getSession() {
      return { data: { session: session || null }, error: null };
    }
  };

  function from(table) {
    return {
      upsert(data) {
        return { data, error: null };
      },
      select(columns) {
        return {
          eq(column, value) {
            return {
              maybeSingle() {
                if (session?.user) {
                  return {
                    data: {
                      id: session.user.id,
                      email: session.user.email,
                      display_name:
                        session.user.user_metadata?.display_name || null,
                      updated_at: session.user.created_at
                    },
                    error: null
                  };
                }
                return { data: null, error: null };
              }
            };
          }
        };
      }
    };
  }

  return { auth, from };
}
