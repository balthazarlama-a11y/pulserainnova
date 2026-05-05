"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { stressState } from "@/components/marketing/primitives";
import { IconArrowLeft, IconChart, IconActivity } from "@/components/marketing/icons";
import { getSessionHistory, CHILD_PROFILE, COMPLETED_EXERCISES } from "@/lib/mockData";
import { SIMULATION_WEEK } from "@/lib/simulationData";
import { SEMANTIC_COLORS } from "@/lib/utils";

export default function HistoryClient() {
  const [tab, setTab] = useState("sessions"); // sessions | exercises
  const [period, setPeriod] = useState("week"); // week | month | custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const sessions = useMemo(() => getSessionHistory(), []);

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
        if (customStart) {
          const start = new Date(`${customStart}T00:00:00`);
          if (d < start) return false;
        }
        if (customEnd) {
          const end = new Date(`${customEnd}T23:59:59`);
          if (d > end) return false;
        }
        return true;
      }
      return true;
    });
  }, [sessions, period, customStart, customEnd]);

  const detailDay = useMemo(() => {
    if (!selectedSession) return null;
    const date = new Date(`${selectedSession.date}T00:00:00`);
    const dayIndex = (date.getDay() + 6) % 7; // Monday = 0
    return SIMULATION_WEEK[dayIndex] || null;
  }, [selectedSession]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Link href="/dashboard" style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "8px 14px", cursor: "pointer",
          color: "var(--ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, textDecoration: "none"
        }}>
          <IconArrowLeft size={14}/> Dashboard
        </Link>
        <div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>
            Historial de {CHILD_PROFILE.name}
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 13, margin: "4px 0 0" }}>Últimos 14 días de monitoreo</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {[
          { key: "sessions", label: "Sesiones", icon: <IconChart size={14}/> },
          { key: "exercises", label: "Ejercicios", icon: <IconActivity size={14}/> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 16px", fontSize: 13, borderRadius: 10,
            background: tab === t.key ? "rgba(184,164,255,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${tab === t.key ? "rgba(184,164,255,0.3)" : "var(--border)"}`,
            color: tab === t.key ? "#D4C5FF" : "var(--ink-muted)",
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
              <button
                key={item.key}
                onClick={() => setPeriod(item.key)}
                style={{
                  padding: "8px 14px", fontSize: 12, borderRadius: 999,
                  background: period === item.key ? "rgba(184,164,255,0.16)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${period === item.key ? "rgba(184,164,255,0.35)" : "var(--border)"}`,
                  color: period === item.key ? "#D4C5FF" : "var(--ink-muted)",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}
              >
                {item.label}
              </button>
            ))}

            {period === "custom" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{
                    padding: "6px 10px", borderRadius: 8,
                    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                    color: "var(--ink)", fontSize: 12
                  }}
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{
                    padding: "6px 10px", borderRadius: 8,
                    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                    color: "var(--ink)", fontSize: 12
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredSessions.map((s, i) => {
            const state = stressState(s.avgStress);
            return (
              <button key={i} onClick={() => setSelectedSession(s)} className="history-row" style={{
                padding: "18px 22px", borderRadius: 16,
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                border: "1px solid var(--border)",
                display: "grid", gridTemplateColumns: "140px 1fr auto", alignItems: "center", gap: 20,
                cursor: "pointer", textAlign: "left"
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.dateFormatted}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{s.duration}</div>
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Estrés promedio</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 100, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${s.avgStress}%`, height: "100%", borderRadius: 3, background: state.hex, transition: "width 0.3s" }}/>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: state.hex }}>{s.avgStress}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>BPM prom.</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.avgBpm}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Ejercicios</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.exercisesCompleted}</div>
                  </div>
                </div>
                <div style={{
                  padding: "6px 12px", borderRadius: 999,
                  background: `${state.hex}18`, border: `1px solid ${state.hex}40`,
                  fontSize: 12, fontWeight: 500, color: state.hex
                }}>{state.label}</div>
              </button>
            );
          })}
          </div>

          {selectedSession && detailDay && (
            <div style={{
              marginTop: 18, padding: 18, borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 4 }}>
                    Detalle hora a hora
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {detailDay.day} · {selectedSession.dateFormatted}
                  </div>
                </div>
                <button onClick={() => setSelectedSession(null)} style={{
                  padding: "6px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                  color: "var(--ink-muted)", cursor: "pointer", fontSize: 12
                }}>Cerrar</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 3, alignItems: "end", height: 110, marginBottom: 12 }}>
                {detailDay.hourlyData.map((h) => {
                  const s = stressState(h.stress);
                  return (
                    <div
                      key={h.hour}
                      title={`${String(h.hour).padStart(2, "0")}:00 · ${h.stress}`}
                      style={{
                        height: `${Math.max(6, h.stress)}%`,
                        borderRadius: 4,
                        background: s.hex,
                        opacity: 0.8
                      }}
                    />
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 4 }}>Estrés promedio</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{detailDay.summary.avgStress}</div>
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 4 }}>Pico del día</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{detailDay.summary.peakStress}</div>
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 4 }}>BPM promedio</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{detailDay.summary.avgBpm}</div>
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 4 }}>Ejercicios</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{detailDay.summary.exercisesCount}</div>
                </div>
              </div>
            </div>
          )}

          <style>{`
            @media (max-width: 900px) {
              .history-row { grid-template-columns: 1fr !important; gap: 12px !important; }
            }
          `}</style>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COMPLETED_EXERCISES.map((ex, i) => {
            const moodColors = {
              calm: SEMANTIC_COLORS.calm,
              mild: SEMANTIC_COLORS.attention,
              anxious: SEMANTIC_COLORS.danger,
              stressed: SEMANTIC_COLORS.danger,
              moderate: SEMANTIC_COLORS.danger,
            };
            return (
              <div key={i} style={{
                padding: "18px 22px", borderRadius: 16,
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                border: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 20
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(184,164,255,0.12)", border: "1px solid rgba(184,164,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#B8A4FF" }}>
                  <IconActivity size={20}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{ex.type}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{ex.date} · {ex.duration}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: moodColors[ex.mood_before] || "#F59E4C" }}/>
                  <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>→</span>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: moodColors[ex.mood_after] || "#5EDC9A" }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
