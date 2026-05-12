"use client";

import { useRef, useCallback } from "react";
import { useSimulation } from "@/lib/simulationContext";
import { stressState } from "@/components/marketing/primitives";
import { IconX } from "@/components/marketing/icons";
import { normalizeAccent, SEMANTIC_COLORS } from "@/lib/utils";

const SPEEDS = [1, 2, 5, 10];
const BAR_START_HOUR = 6;
const BAR_END_HOUR = 23;
const BAR_RANGE_HOURS = BAR_END_HOUR - BAR_START_HOUR;

export default function SimulationPanel() {
  const {
    active, playing, speed, currentDay, currentHour, currentMinute,
    panelOpen, weekData, latestEvent,
    setPanelOpen, setSpeed, togglePlay, jumpToDay, jumpToHour,
    stopSimulation, getCurrentSimData, getTimeLabel,
  } = useSimulation();

  const progressRef = useRef(null);

  const handleProgressClick = useCallback((e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const hour = BAR_START_HOUR + pct * BAR_RANGE_HOURS;
    jumpToHour(hour);
  }, [jumpToHour]);

  if (!active || !panelOpen) return null;

  const dayData = weekData[currentDay];
  const simData = getCurrentSimData();
  const state = stressState(simData.stress);
  const currentTimeDecimal = currentHour + currentMinute / 60;
  const progressPct = Math.max(
    0,
    Math.min(100, ((currentTimeDecimal - BAR_START_HOUR) / BAR_RANGE_HOURS) * 100)
  );

  const nextEvent = dayData?.events.find((evt) => evt.hour > currentTimeDecimal);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          animation: "simFadeIn 0.3s ease-out",
        }}
        onClick={() => setPanelOpen(false)}
      />

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          background: "rgba(10, 10, 26, 0.97)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px 24px 0 0",
          padding: "24px 28px 28px",
          maxHeight: "70vh",
          overflowY: "auto",
          animation: "simSlideUp 0.35s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>🎬</div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Simulación de Semana</h3>
              <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>Datos realistas · Simón, 10 años</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={stopSimulation}
              style={{
                padding: "6px 14px", borderRadius: 8,
                background: "rgb(var(--danger-rgb) / 0.15)", border: "1px solid rgb(var(--danger-rgb) / 0.3)",
                color: "#EC5B6B", fontSize: 12, fontWeight: 500, cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >Detener</button>
            <button
              onClick={() => setPanelOpen(false)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--surface-elevated)", border: "1px solid var(--border)",
                color: "var(--ink-dim)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            ><IconX size={14} /></button>
          </div>
        </div>

        {/* Day tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto" }}>
          {weekData.map((d, i) => {
            const isActive = i === currentDay;
            const dayState = stressState(d.summary.peakStress);
            return (
              <button
                key={i}
                onClick={() => jumpToDay(i)}
                style={{
                  padding: "8px 14px", borderRadius: 10,
                  background: isActive ? `${dayState.hex}22` : "var(--surface)",
                  border: isActive ? `1px solid ${dayState.hex}50` : "1px solid var(--border)",
                  color: isActive ? dayState.hex : "var(--ink-dim)",
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: "pointer", transition: "all 0.2s",
                  fontFamily: "Inter, sans-serif", whiteSpace: "nowrap",
                  flex: "0 0 auto",
                }}
              >
                {d.dayShort}
              </button>
            );
          })}
        </div>

        {/* Day narrative */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500,
            color: "var(--ink)", letterSpacing: -0.3, marginBottom: 4,
          }}>
            {dayData.day}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-dim)", fontStyle: "italic" }}>
            &ldquo;{dayData.narrative}&rdquo;
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            style={{
              position: "relative",
              height: 8,
              borderRadius: 4,
              background: "var(--surface-elevated)",
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: `${progressPct}%`,
              borderRadius: 4,
              background: `linear-gradient(90deg, ${state.hex}, ${state.hex}aa)`,
              transition: "width 0.3s linear",
            }} />
            {/* Event markers */}
            {dayData.events.map((evt, i) => {
              const markerColor = normalizeAccent(evt.color);
              const markerPct = Math.max(
                0,
                Math.min(100, ((evt.hour - BAR_START_HOUR) / BAR_RANGE_HOURS) * 100)
              );
              return (
                <div
                  key={i}
                  title={`${evt.time} — ${evt.event}`}
                  style={{
                    position: "absolute",
                    left: `${markerPct}%`,
                    top: -2,
                    width: 4,
                    height: 12,
                    borderRadius: 2,
                    background: markerColor,
                    opacity: currentTimeDecimal >= evt.hour ? 1 : 0.3,
                    transform: "translateX(-2px)",
                    transition: "opacity 0.3s",
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>06:00</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: state.hex, fontVariantNumeric: "tabular-nums" }}>
              {getTimeLabel()}
            </span>
            <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>23:00</span>
          </div>
        </div>

        {/* Live metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{
            padding: 14, borderRadius: 12,
            background: `${state.hex}10`, border: `1px solid ${state.hex}30`,
            textAlign: "center", transition: "all 0.4s",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: state.hex, lineHeight: 1, fontVariantNumeric: "tabular-nums", transition: "color 0.4s" }}>
              {simData.stress}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>estrés</div>
          </div>
          <div style={{
            padding: 14, borderRadius: 12,
            background: `${SEMANTIC_COLORS.brand}18`, border: `1px solid ${SEMANTIC_COLORS.brand}35`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: SEMANTIC_COLORS.brand, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {simData.bpm}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>lpm</div>
          </div>
          <div style={{
            padding: 14, borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: state.hex, marginBottom: 2, transition: "color 0.4s" }}>
              {state.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>estado</div>
          </div>
        </div>

        {/* Next event / latest event */}
        {(latestEvent || nextEvent) && (
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: "var(--surface)", border: "1px solid var(--border)",
            fontSize: 13, color: "var(--ink-muted)", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {latestEvent ? (
              <>
                <div style={{
                  width: 8, height: 8, borderRadius: 4,
                  background: normalizeAccent(latestEvent.color),
                  boxShadow: `0 0 8px ${normalizeAccent(latestEvent.color)}`,
                  animation: "simPulseSmall 1.5s ease-in-out infinite",
                }} />
                <span><strong style={{ color: "var(--ink)" }}>Ahora:</strong> {latestEvent.event}</span>
              </>
            ) : nextEvent ? (
              <>
                <span style={{ color: "var(--ink-faint)" }}>⏭</span>
                <span>Próximo: <strong style={{ color: "var(--ink)" }}>{nextEvent.time}</strong> — {nextEvent.event}</span>
              </>
            ) : null}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Prev day */}
            <button
              onClick={() => currentDay > 0 && jumpToDay(currentDay - 1)}
              disabled={currentDay === 0}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--surface)", border: "1px solid var(--border)",
                color: currentDay === 0 ? "var(--ink-faint)" : "var(--ink-muted)",
                cursor: currentDay === 0 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontFamily: "Inter, sans-serif",
              }}
            >◀</button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              style={{
                width: 48, height: 48, borderRadius: 14,
                background: playing
                  ? "linear-gradient(135deg, #B8A4FF, #8B7FD8)"
                  : "rgb(var(--brand-rgb) / 0.15)",
                border: playing
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid rgb(var(--brand-rgb) / 0.4)",
                color: playing ? "#0D0824" : "#B8A4FF",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: playing ? "0 4px 20px -4px rgba(184,164,255,0.5)" : "none",
                transition: "all 0.2s",
              }}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="7,4 21,12 7,20" />
                </svg>
              )}
            </button>

            {/* Next day */}
            <button
              onClick={() => currentDay < 6 && jumpToDay(currentDay + 1)}
              disabled={currentDay === 6}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--surface)", border: "1px solid var(--border)",
                color: currentDay === 6 ? "var(--ink-faint)" : "var(--ink-muted)",
                cursor: currentDay === 6 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontFamily: "Inter, sans-serif",
              }}
            >▶</button>
          </div>

          {/* Speed selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--ink-faint)", marginRight: 4 }}>Velocidad</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  padding: "5px 10px", borderRadius: 8,
                  background: speed === s ? "rgb(var(--brand-rgb) / 0.2)" : "var(--surface)",
                  border: speed === s ? "1px solid rgb(var(--brand-rgb) / 0.4)" : "1px solid var(--border)",
                  color: speed === s ? "#D4C5FF" : "var(--ink-dim)",
                  fontSize: 12, fontWeight: speed === s ? 600 : 400,
                  cursor: "pointer", transition: "all 0.2s",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Day summary */}
        <div style={{
          marginTop: 16, padding: 14, borderRadius: 12,
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
        }}>
          {[
            { label: "Prom. ansiedad", value: dayData.summary.avgStress, accent: stressState(dayData.summary.avgStress).hex },
            { label: "Pico ansiedad", value: dayData.summary.peakStress, accent: stressState(dayData.summary.peakStress).hex },
            { label: "Ejercicios", value: dayData.summary.exercisesCount, accent: "#B8A4FF" },
            { label: "Sueño", value: dayData.summary.sleepHours, accent: "#A8E6CF" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: item.accent, fontVariantNumeric: "tabular-nums" }}>{item.value}</div>
              <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes simSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes simFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes simPulseSmall {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
