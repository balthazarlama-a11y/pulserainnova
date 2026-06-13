"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { stressState } from "@/components/marketing/primitives";
import { IconArrowLeft, IconChart, IconActivity, IconWatch } from "@/components/marketing/icons";
import { useAuth } from "@/hooks/useAuth";
import { usePeople } from "@/lib/peopleContext";
import { fetchSessionHistory, fetchCompletedExercises, fetchDayDetail } from "@/lib/biometria";
import { SEMANTIC_COLORS } from "@/lib/utils";

const EmptyState = ({ icon, title, desc }) => (
  <div className="card" style={{ padding: "40px 24px", textAlign: "center", color: "var(--ink-dim)" }}>
    <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--ink-faint)" }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 13 }}>{desc}</div>
  </div>
);

export default function HistoryClient() {
  const { supabase } = useAuth();
  const { selectedPerson } = usePeople();
  const ninoId = selectedPerson?.id || null;

  const [tab, setTab] = useState("sessions");
  const [period, setPeriod] = useState("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [detailHours, setDetailHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ninoId) { setSessions([]); setExercises([]); setLoading(false); return; }
    let active = true;
    setLoading(true);
    Promise.all([
      fetchSessionHistory(supabase, ninoId, 30),
      fetchCompletedExercises(supabase, ninoId),
    ]).then(([s, e]) => {
      if (!active) return;
      setSessions(s);
      setExercises(e);
      setLoading(false);
    });
    return () => { active = false; };
  }, [supabase, ninoId]);

  useEffect(() => {
    if (!ninoId || !selectedSession) { setDetailHours([]); return; }
    let active = true;
    fetchDayDetail(supabase, ninoId, selectedSession.date).then((d) => {
      if (active) setDetailHours(d);
    });
    return () => { active = false; };
  }, [supabase, ninoId, selectedSession]);

  const filteredSessions = useMemo(() => {
    const now = new Date();
    const startOfRange = (days) => {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - days);
      return d;
    };
    const weekStart = startOfRange(6);
    const monthStart = startOfRange(29);

    return sessions.filter((s) => {
      const d = new Date(`${s.date}T00:00:00`);
      if (period === "week") return d >= weekStart;
      if (period === "month") return d >= monthStart;
      if (period === "custom") {
        if (customStart && d < new Date(`${customStart}T00:00:00`)) return false;
        if (customEnd && d > new Date(`${customEnd}T23:59:59`)) return false;
        return true;
      }
      return true;
    });
  }, [sessions, period, customStart, customEnd]);

  const detailSummary = useMemo(() => {
    const vals = detailHours.map(h => h.stress).filter(v => Number.isFinite(v));
    return {
      avgStress: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : "—",
      peakStress: vals.length ? Math.max(...vals) : "—",
      readings: vals.length,
    };
  }, [detailHours]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Link href="/dashboard" style={{
          background: "var(--surface-elevated)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "8px 14px", cursor: "pointer",
          color: "var(--ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, textDecoration: "none"
        }}>
          <IconArrowLeft size={14}/> Dashboard
        </Link>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Historial{selectedPerson ? ` de ${selectedPerson.nombre}` : ""}
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 13, margin: "4px 0 0" }}>Últimos 30 días de monitoreo</p>
        </div>
      </div>

      {!selectedPerson ? (
        <EmptyState icon={<IconWatch size={28}/>} title="Sin persona vinculada"
          desc="Conecta una pulsera a una persona para ver su historial." />
      ) : (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
            {[
              { key: "sessions", label: "Sesiones", icon: <IconChart size={14}/> },
              { key: "exercises", label: "Ejercicios", icon: <IconActivity size={14}/> },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "8px 16px", fontSize: 13, borderRadius: 10,
                background: tab === t.key ? "rgb(var(--brand-rgb) / 0.15)" : "var(--surface)",
                border: `1px solid ${tab === t.key ? "rgb(var(--brand-rgb) / 0.3)" : "var(--border)"}`,
                color: tab === t.key ? "var(--brand)" : "var(--ink-muted)",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif"
              }}>{t.icon} {t.label}</button>
            ))}
          </div>

          {tab === "sessions" ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {[
                  { key: "week", label: "Esta semana" },
                  { key: "month", label: "Este mes" },
                  { key: "custom", label: "Personalizado" },
                ].map((item) => (
                  <button key={item.key} onClick={() => setPeriod(item.key)} style={{
                    padding: "8px 14px", fontSize: 12, borderRadius: 999,
                    background: period === item.key ? "rgb(var(--brand-rgb) / 0.16)" : "var(--surface)",
                    border: `1px solid ${period === item.key ? "rgb(var(--brand-rgb) / 0.35)" : "var(--border)"}`,
                    color: period === item.key ? "var(--brand)" : "var(--ink-muted)",
                    cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}>{item.label}</button>
                ))}

                {period === "custom" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)", fontSize: 12 }}/>
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)", fontSize: 12 }}/>
                  </div>
                )}
              </div>

              {loading ? (
                <EmptyState icon={<IconChart size={28}/>} title="Cargando…" desc="Obteniendo sesiones." />
              ) : filteredSessions.length === 0 ? (
                <EmptyState icon={<IconChart size={28}/>} title="Sin sesiones en este periodo"
                  desc="Cuando la pulsera envíe lecturas, aparecerán aquí agrupadas por día." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredSessions.map((s, i) => {
                    const state = stressState(s.avgStress);
                    return (
                      <button key={i} onClick={() => setSelectedSession(s)} className="history-row card hover:-translate-y-0.5 transition-all" style={{
                        padding: "18px 22px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)",
                        display: "grid", gridTemplateColumns: "140px 1fr auto", alignItems: "center", gap: 20, cursor: "pointer", textAlign: "left"
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.dateFormatted}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{s.count} lecturas</div>
                        </div>
                        <div style={{ display: "flex", gap: 24 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Estrés promedio</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 100, height: 6, borderRadius: 3, background: "var(--surface-elevated)", overflow: "hidden" }}>
                                <div style={{ width: `${s.avgStress}%`, height: "100%", borderRadius: 3, background: state.hex, transition: "width 0.3s" }}/>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 600, color: state.hex }}>{s.avgStress}</span>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>BPM prom.</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{s.avgBpm || "—"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Pico</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{s.peakStress}</div>
                          </div>
                        </div>
                        <div style={{ padding: "6px 12px", borderRadius: 999, background: `${state.hex}18`, border: `1px solid ${state.hex}40`, fontSize: 12, fontWeight: 500, color: state.hex }}>
                          {state.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSession && (
                <div style={{ marginTop: 18, padding: 18, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 4 }}>Detalle hora a hora</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedSession.dateFormatted}</div>
                    </div>
                    <button onClick={() => setSelectedSession(null)} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--ink-muted)", cursor: "pointer", fontSize: 12 }}>
                      Cerrar
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 3, alignItems: "end", height: 110, marginBottom: 12 }}>
                    {detailHours.map((h) => {
                      const has = Number.isFinite(h.stress);
                      const s = stressState(has ? h.stress : 0);
                      return (
                        <div key={h.hour} title={`${String(h.hour).padStart(2, "0")}:00 · ${has ? h.stress : "sin dato"}`}
                          style={{ height: `${has ? Math.max(6, h.stress) : 4}%`, borderRadius: 4, background: has ? s.hex : "var(--surface-strong)", opacity: has ? 0.8 : 0.4 }}/>
                      );
                    })}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                    {[
                      { label: "Estrés promedio", value: detailSummary.avgStress },
                      { label: "Pico del día", value: detailSummary.peakStress },
                      { label: "BPM promedio", value: selectedSession.avgBpm || "—" },
                      { label: "Lecturas", value: detailSummary.readings },
                    ].map((m, i) => (
                      <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <style>{`@media (max-width: 900px) { .history-row { grid-template-columns: 1fr !important; gap: 12px !important; } }`}</style>
            </>
          ) : (
            loading ? (
              <EmptyState icon={<IconActivity size={28}/>} title="Cargando…" desc="Obteniendo ejercicios." />
            ) : exercises.length === 0 ? (
              <EmptyState icon={<IconActivity size={28}/>} title="Sin ejercicios registrados"
                desc="Los ejercicios de respiración completados aparecerán aquí." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {exercises.map((ex, i) => (
                  <div key={i} className="card" style={{ padding: "18px 22px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgb(var(--brand-rgb) / 0.12)", border: "1px solid rgb(var(--brand-rgb) / 0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
                      <IconActivity size={20}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{ex.type}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{ex.date} · {ex.duration}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: ex.completado ? SEMANTIC_COLORS.calm : "var(--ink-faint)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: ex.completado ? SEMANTIC_COLORS.calm : "var(--ink-faint)" }}/>
                      {ex.completado ? "Completado" : "Incompleto"}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
