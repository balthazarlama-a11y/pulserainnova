"use client";

import { useSimulation } from "@/lib/simulationContext";

export default function SimulationFAB() {
  const { active, playing, panelOpen, setPanelOpen, startSimulation, togglePlay, getTimeLabel } = useSimulation();

  const handleClick = () => {
    if (!active) {
      startSimulation();
    } else if (panelOpen) {
      togglePlay();
    } else {
      setPanelOpen(true);
    }
  };

  const label = active ? getTimeLabel() : "Simular";

  return (
    <>
      <button
        onClick={handleClick}
        title={active ? getTimeLabel() : "Simular semana"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9998,
          width: active ? "auto" : 56,
          height: 56,
          minWidth: 56,
          padding: active ? "0 20px 0 16px" : 0,
          borderRadius: 28,
          background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)",
          border: "none",
          color: "#0D0824",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          boxShadow: active
            ? "0 8px 32px -8px rgba(184,164,255,0.7)"
            : "0 8px 32px -8px rgba(184,164,255,0.5)",
          transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Play/Pause icon */}
        {active && playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        )}
        {active && (
          <span style={{ fontSize: 12, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
            {label}
          </span>
        )}
      </button>

      {/* Pulsing ring when active */}
      {active && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 9997,
            width: active ? 72 : 72,
            height: 72,
            borderRadius: 36,
            border: "2px solid rgba(184,164,255,0.5)",
            pointerEvents: "none",
            animation: playing ? "simPulse 2s ease-in-out infinite" : "none",
            opacity: playing ? 1 : 0.4,
            transition: "opacity 0.3s",
          }}
        />
      )}

      <style>{`
        @keyframes simPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.25); opacity: 0; }
        }
      `}</style>
    </>
  );
}
