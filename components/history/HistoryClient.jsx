"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { stressState } from "@/components/marketing/primitives";
import { IconArrowLeft, IconChart, IconActivity } from "@/components/marketing/icons";
import { getSessionHistory, CHILD_PROFILE, COMPLETED_EXERCISES } from "@/lib/mockData";

export default function HistoryClient() {
  const [tab, setTab] = useState("sessions"); // sessions | exercises
  const sessions = useMemo(() => getSessionHistory(), []);

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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map((s, i) => {
            const state = stressState(s.avgStress);
            return (
              <div key={i} style={{
                padding: "18px 22px", borderRadius: 16,
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                border: "1px solid var(--border)",
                display: "grid", gridTemplateColumns: "140px 1fr auto", alignItems: "center", gap: 20
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
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COMPLETED_EXERCISES.map((ex, i) => {
            const moodColors = { calm: "#5EDC9A", mild: "#F5D06F", anxious: "#F59E4C", stressed: "#F59E4C", moderate: "#F59E4C" };
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
