// Mock Supabase browser client — uses cookies for session persistence
// No real Supabase connection needed

const COOKIE_SESSION = "calmband-mock-session";
const COOKIE_USERS = "calmband-mock-users";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[2]));
  } catch {
    return null;
  }
}

function setCookie(name, value, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; path=/; expires=${expires}; SameSite=Lax`;
}

function deleteCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function generateId() {
  return "mock-uuid-" + Math.random().toString(36).substring(2, 10);
}

function buildSession(user) {
  return {
    access_token: "mock-token-" + user.id,
    refresh_token: "mock-refresh-" + user.id,
    user
  };
}

function createMockClient() {
  const auth = {
    async signUp({ email, password, options }) {
      if (!email || !password || password.length < 6) {
        return {
          data: { session: null, user: null },
          error: { message: "Password must be at least 6 characters." }
        };
      }

      // Load existing users
      const users = getCookie(COOKIE_USERS) || [];
      const existing = users.find((u) => u.email === email);
      if (existing) {
        return {
          data: { session: null, user: null },
          error: { message: "User already registered." }
        };
      }

      const user = {
        id: generateId(),
        email,
        user_metadata: {
          display_name: options?.data?.display_name || email.split("@")[0]
        },
        created_at: new Date().toISOString()
      };

      // Save user to users list
      users.push({ ...user, _password: password });
      setCookie(COOKIE_USERS, users);

      // Create session
      const session = buildSession(user);
      setCookie(COOKIE_SESSION, session);

      return { data: { session, user }, error: null };
    },

    async signInWithPassword({ email, password }) {
      const users = getCookie(COOKIE_USERS) || [];
      const found = users.find((u) => u.email === email);

      if (users.length === 0) {
        // Demo mode — accept any credentials
        const user = {
          id: generateId(),
          email,
          user_metadata: { display_name: email.split("@")[0] },
          created_at: new Date().toISOString()
        };
        const session = buildSession(user);
        setCookie(COOKIE_SESSION, session);
        return { data: { session, user }, error: null };
      }

      if (!found) {
        return {
          data: { session: null, user: null },
          error: { message: "Invalid login credentials." }
        };
      }

      if (found._password !== password) {
        return {
          data: { session: null, user: null },
          error: { message: "Invalid login credentials." }
        };
      }

      const { _password, ...user } = found;
      const session = buildSession(user);
      setCookie(COOKIE_SESSION, session);
      return { data: { session, user }, error: null };
    },

    async signOut() {
      deleteCookie(COOKIE_SESSION);
      return { error: null };
    },

    async getSession() {
      const session = getCookie(COOKIE_SESSION);
      return { data: { session: session || null }, error: null };
    },

    async getUser() {
      const session = getCookie(COOKIE_SESSION);
      if (session?.user) {
        return { data: { user: session.user }, error: null };
      }
      return { data: { user: null }, error: { message: "not_authenticated" } };
    },

    onAuthStateChange(callback) {
      // Fire once with current state
      const session = getCookie(COOKIE_SESSION);
      setTimeout(() => callback("INITIAL_SESSION", session || null), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },

    async resend() {
      return { data: {}, error: null };
    }
  };

  // Mock table operations
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
                const session = getCookie(COOKIE_SESSION);
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

export function createClient() {
  return createMockClient();
}
