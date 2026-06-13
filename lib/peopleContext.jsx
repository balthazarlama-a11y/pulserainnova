"use client";

// Contexto de "personas" (tabla `niños`) del tutor autenticado.
// Reemplaza al CHILD_PROFILE hardcodeado: expone la lista real, la persona
// seleccionada (persistida en localStorage) y utilidades para crear/refrescar.

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "calmband-selected-person";

const PeopleContext = createContext(null);

export function PeopleProvider({ children }) {
  const { supabase, user, loading: authLoading } = useAuth();
  const [people, setPeople] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshPeople = useCallback(async () => {
    if (!user) {
      setPeople([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    const { data } = await supabase
      .from("niños")
      .select("*")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: true });
    const list = data || [];
    setPeople(list);
    setLoading(false);
    return list;
  }, [supabase, user]);

  // Carga inicial cuando hay usuario.
  useEffect(() => {
    if (authLoading) return;
    refreshPeople();
  }, [authLoading, refreshPeople]);

  // Restaura la selección guardada.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelectedId(saved);
    } catch {}
  }, []);

  // Mantiene una selección válida: si la guardada ya no existe, usa la primera.
  useEffect(() => {
    if (!people.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current && people.some((p) => p.id === current)) return current;
      return people[0].id;
    });
  }, [people]);

  const selectPerson = useCallback((id) => {
    setSelectedId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  }, []);

  const selectedPerson = useMemo(
    () => people.find((p) => p.id === selectedId) || null,
    [people, selectedId]
  );

  const value = useMemo(
    () => ({ people, selectedPerson, selectedId, selectPerson, refreshPeople, loading }),
    [people, selectedPerson, selectedId, selectPerson, refreshPeople, loading]
  );

  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export function usePeople() {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error("usePeople must be used within PeopleProvider");
  return ctx;
}
