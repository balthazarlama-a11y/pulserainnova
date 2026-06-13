"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId) => {
      if (!userId) {
        if (isMounted) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (isMounted) setProfile(data);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id).then(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        if (nextSession?.user) {
          fetchProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const value = {
    supabase,
    session,
    user: session?.user ?? null,
    profile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
