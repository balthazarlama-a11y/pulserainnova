"use client";

/**
 * HORARIO — Calendario semanal editable por el cuidador.
 *
 * Cada actividad (día + hora + título) se guarda en `horario_actividades`
 * (Supabase, scopeado por persona vía RLS). A futuro se cruza con los datos
 * biométricos de la pulsera para anticipar momentos de mayor ansiedad.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconCalendar, IconClock, IconX, IconWatch } from "@/components/marketing/icons";
import { usePeople } from "@/lib/peopleContext";
import { useAuth } from "@/hooks/useAuth";

// dia: 0 = Lun … 6 = Dom
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const todayIdx = (new Date().getDay() + 6) % 7;

export default function ScheduleClient() {
  const router = useRouter();
  const { selectedPerson } = usePeople();
  const { supabase } = useAuth();
  const ninoId = selectedPerson?.id || null;

  const [activeDay, setActiveDay] = useState(todayIdx);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hora, setHora] = useState("");
  const [titulo, setTitulo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadActivities = useCallback(async () => {
    if (!ninoId) { setActivities([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("horario_actividades")
      .select("id, dia, hora, titulo")
      .eq("niño_id", ninoId)
      .order("hora", { ascending: true });
    if (error) setError(error.message);
    setActivities(data || []);
    setLoading(false);
  }, [supabase, ninoId]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  const dayActivities = activities
    .filter((a) => a.dia === activeDay)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const addActivity = async () => {
    if (!ninoId || !hora || !titulo.trim() || saving) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("horario_actividades").insert({
      "niño_id": ninoId,
      dia: activeDay,
      hora,
      titulo: titulo.trim(),
    });
    if (error) {
      setError(error.message);
    } else {
      setHora("");
      setTitulo("");
      await loadActivities();
    }
    setSaving(false);
  };

  const deleteActivity = async (id) => {
    setActivities((prev) => prev.filter((a) => a.id !== id)); // optimista
    const { error } = await supabase.from("horario_actividades").delete().eq("id", id);
    if (error) { setError(error.message); await loadActivities(); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative" }}>
      <button onClick={() => router.push("/dashboard")} style={{
        position: "fixed", top: 28, left: 28, zIndex: 10,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "8px 14px", cursor: "pointer",
        color: "var(--ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
      }}>
        <IconArrowLeft size={14}/> Volver
      </button>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "88px 24px 80px", position: "relative", zIndex: 2 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--brand)", marginBottom: 10, fontWeight: 700 }}>
            <IconCalendar size={12}/> Horario
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Semana{selectedPerson ? <> de <span className="text-brand font-bold">{selectedPerson.nombre}</span></> : ""}
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 14, margin: "0 0 4px" }}>
            Organiza las actividades de la semana para cruzarlas con los datos de la pulsera.
          </p>
        </div>

        {!selectedPerson ? (
          <div className="card" style={{ padding: "40px 24px", textAlign: "center", color: "var(--ink-dim)" }}>
            <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--ink-faint)" }}><IconWatch size={28}/></div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Sin persona vinculada</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Conecta una pulsera a una persona para configurar su horario.</div>
            <Link href="/pairing" style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>Conectar pulsera →</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {DAYS.map((day, idx) => {
                const isActive = idx === activeDay;
                const isToday = idx === todayIdx;
                const count = activities.filter((a) => a.dia === idx).length;
                return (
                  <button key={day} onClick={() => setActiveDay(idx)} style={{
                    flex: 1, padding: "10px 6px", borderRadius: 12,
                    background: isActive ? "rgb(var(--brand-rgb) / 0.15)" : "var(--surface)",
                    border: isActive ? "1px solid rgb(var(--brand-rgb) / 0.35)" : "1px solid var(--border)",
                    color: isActive ? "var(--brand)" : "var(--ink-dim)",
                    fontSize: 13, fontWeight: isActive ? 700 : 400, cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "Inter, sans-serif", position: "relative",
                  }}>
                    {day}
                    {isToday && <span style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "var(--brand)" }}/>}
                    {count > 0 && <span style={{ display: "block", fontSize: 10, marginTop: 2, opacity: 0.7 }}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Lista de actividades del día */}
            {loading ? (
              <div className="card" style={{ padding: "32px 24px", textAlign: "center", color: "var(--ink-dim)", fontSize: 13 }}>Cargando…</div>
            ) : dayActivities.length === 0 ? (
              <div className="card" style={{ padding: "36px 24px", textAlign: "center", color: "var(--ink-dim)" }}>
                <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--ink-faint)" }}><IconCalendar size={26}/></div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Sin actividades el {DAYS[activeDay].toLowerCase()}</div>
                <div style={{ fontSize: 13 }}>Agrega la primera abajo.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dayActivities.map((a) => (
                  <div key={a.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--brand)", fontWeight: 700, fontSize: 14, fontFamily: "Inter, sans-serif", minWidth: 64 }}>
                      <IconClock size={14}/> {a.hora.slice(0, 5)}
                    </div>
                    <div style={{ flex: 1, fontSize: 14, color: "var(--ink)" }}>{a.titulo}</div>
                    <button onClick={() => deleteActivity(a.id)} aria-label="Eliminar actividad" style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      color: "var(--ink-faint)", display: "inline-flex", padding: 4, borderRadius: 6,
                    }}>
                      <IconX size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario de alta */}
            <div className="card" style={{ marginTop: 18, padding: "16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={{
                background: "var(--surface-elevated, var(--surface))", border: "1px solid var(--border)",
                borderRadius: 10, padding: "10px 12px", color: "var(--ink)", fontSize: 14, colorScheme: "dark",
              }}/>
              <input type="text" value={titulo} placeholder="Actividad (ej. Colegio, Almuerzo, Terapia)"
                onChange={(e) => setTitulo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addActivity()}
                style={{
                  flex: 1, minWidth: 160, background: "var(--surface-elevated, var(--surface))",
                  border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px",
                  color: "var(--ink)", fontSize: 14,
                }}/>
              <button onClick={addActivity} disabled={!hora || !titulo.trim() || saving} style={{
                padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #5EDC9A, #7DD3B8)", color: "#06281a",
                fontWeight: 700, fontSize: 14, opacity: (!hora || !titulo.trim() || saving) ? 0.5 : 1,
              }}>
                {saving ? "Guardando…" : "+ Agregar"}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--danger, #ec5b6b)" }}>
                No se pudo guardar: {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
