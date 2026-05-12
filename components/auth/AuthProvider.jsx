"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  SIMULATION_ONLY,
  SIMULATION_PROFILE,
  SIMULATION_SESSION,
  SIMULATION_USER
} from "@/lib/simulationMode";

const simulationSupabase = {
  auth: {
    async signUp() {
      return { data: { session: SIMULATION_SESSION, user: SIMULATION_USER }, error: null };
    },
    async signInWithPassword() {
      return { data: { session: SIMULATION_SESSION, user: SIMULATION_USER }, error: null };
    },
    async signOut() {
      return { error: null };
    },
    async getSession() {
      return { data: { session: SIMULATION_SESSION }, error: null };
    },
    async getUser() {
      return { data: { user: SIMULATION_USER }, error: null };
    },
    onAuthStateChange(callback) {
      if (callback) {
        setTimeout(() => callback("INITIAL_SESSION", SIMULATION_SESSION), 0);
      }
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
  },
  from() {
    return {
      upsert(data) {
        return { data, error: null };
      },
      select() {
        return {
          eq() {
            return {
              maybeSingle() {
                return { data: SIMULATION_PROFILE, error: null };
              }
            };
          }
        };
      }
    };
  }
};

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const supabase = useMemo(
    () => (SIMULATION_ONLY ? simulationSupabase : createClient()),
    []
  );
  const [session, setSession] = useState(SIMULATION_ONLY ? SIMULATION_SESSION : null);
  const [loading, setLoading] = useState(!SIMULATION_ONLY);

  useEffect(() => {
    if (SIMULATION_ONLY) return;
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const value = SIMULATION_ONLY
    ? {
        supabase: simulationSupabase,
        session: SIMULATION_SESSION,
        user: SIMULATION_USER,
        loading: false
      }
    : {
        supabase,
        session,
        user: session?.user ?? null,
        loading
      };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
