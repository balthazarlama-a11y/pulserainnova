"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSimulation } from "@/lib/simulationContext";

export default function SimulationFAB() {
  const {
    active, playing, panelOpen, setPanelOpen,
    startSimulation, triggerStressEvent, togglePlay, stopSimulation, getTimeLabel,
  } = useSimulation();
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsCompact(media.matches);
    update();
    media.addEventListener("change", update);

    const handleImmersive = (e) => setIsHidden(e.detail);
    window.addEventListener("immersive-mode-change", handleImmersive);

    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("immersive-mode-change", handleImmersive);
    };
  }, []);

  if (isHidden) return null;

  const handleMainClick = () => {
    if (!active) {
      startSimulation();
    } else if (panelOpen) {
      togglePlay();
    } else {
      setPanelOpen(true);
    }
  };

  const label = active ? getTimeLabel() : "Simular semana";
  const isDashboard = pathname === "/dashboard";
  const mainBottom = isDashboard && !isCompact ? 104 : 24;
  const secondaryBottom = mainBottom + 64;

  return (
    <>
      {/* Botón secundario: Simular momento de estrés */}
      <button
        onClick={triggerStressEvent}
        title="Simular episodio de ansiedad"
        className="simulation-fab-secondary"
        style={{
          position: "fixed",
          bottom: secondaryBottom,
          right: 24,
          zIndex: 9997,
          height: 44,
          padding: "0 16px",
          borderRadius: 22,
          background: "rgba(236,91,107,0.12)",
          border: "1px solid rgba(236,91,107,0.4)",
          color: "#EC5B6B",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          boxShadow: "0 4px 20px -4px rgba(236,91,107,0.35)",
          transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Simular ansiedad
      </button>

      {/* Botón principal: Simulación de semana */}
      <button
        onClick={handleMainClick}
        title={active ? getTimeLabel() : "Simulación de semana"}
        className="simulation-fab"
        style={{
          position: "fixed",
          bottom: mainBottom,
          right: 24,
          zIndex: 9998,
          width: "auto",
          height: 56,
          minWidth: 56,
          padding: "0 20px 0 16px",
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
        <span style={{ fontSize: 12, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
          {label}
        </span>
      </button>

      {/* Anillo pulsante cuando está activo */}
      {active && (
        <div
          className="simulation-fab-ring"
          style={{
            position: "fixed",
            bottom: mainBottom - 8,
            right: 16,
            zIndex: 9996,
            width: 72,
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
