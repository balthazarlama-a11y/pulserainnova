"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/marketing/primitives";
import { IconArrowLeft, IconSettings, IconUser, IconSun, IconMoon, IconSliders, IconCheck } from "@/components/marketing/icons";
import { CHILD_PROFILE, PARENT_PROFILE } from "@/lib/mockData";

export default function SettingsClient() {
  const router = useRouter();

  // ── Ajuste de ritmo cardíaco base ──────────────────────────────────────────
  const [baseBpm, setBaseBpm] = useState(CHILD_PROFILE.bpmResting);
  const [bpmSaved, setBpmSaved] = useState(false);

  const saveBpm = () => {
    setBpmSaved(true);
    setTimeout(() => setBpmSaved(false), 2000);
  };

  // ── Modo claro/oscuro ──────────────────────────────────────────────────────
  // Inicializa desde el data-theme actual (lo seteó el script anti-flicker del layout).
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setDarkMode(document.documentElement.getAttribute("data-theme") !== "light");
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    const theme = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("calmband-theme", theme); } catch {}
  };

  // ── Datos del usuario ──────────────────────────────────────────────────────
  const [childName, setChildName] = useState(CHILD_PROFILE.name);
  const [childAge, setChildAge]   = useState(CHILD_PROFILE.age);
  const [parentName, setParentName] = useState(PARENT_PROFILE.name);
  const [profileSaved, setProfileSaved] = useState(false);

  const saveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2200);
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid var(--border)", background: "var(--surface)",
    color: "var(--ink)", fontSize: 14, fontFamily: "Inter, sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase",
    color: "var(--ink-dim)", marginBottom: 6, display: "block",
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

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "88px 24px 80px", position: "relative", zIndex: 2 }}>

        {/* Encabezado */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--brand)", marginBottom: 10, fontWeight: 700 }}>
            Configuración
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Ajustes
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 14, margin: 0 }}>
            Personaliza CalmBand para {CHILD_PROFILE.name}.
          </p>
        </div>

        {/* ── Sección 1: Ritmo cardíaco base ── */}
        <Card style={{ padding: 26, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgb(var(--danger-rgb) / 0.12)", border: "1px solid rgb(var(--danger-rgb) / 0.25)",
              color: "#EC5B6B", display: "flex", alignItems: "center", justifyContent: "center",
            }}><IconSliders size={16}/></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Ritmo cardíaco base</div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>Frecuencia en reposo de {CHILD_PROFILE.name}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <input
              type="range"
              min={55} max={100} value={baseBpm}
              onChange={e => { setBaseBpm(Number(e.target.value)); setBpmSaved(false); }}
              style={{ flex: 1, accentColor: "#EC5B6B", cursor: "pointer" }}
            />
            <div style={{
              minWidth: 64, textAlign: "center", padding: "8px 12px", borderRadius: 10,
              background: "rgb(var(--danger-rgb) / 0.1)", border: "1px solid rgb(var(--danger-rgb) / 0.25)",
              fontSize: 20, fontWeight: 700, color: "#EC5B6B",
            }}>{baseBpm}</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 6 }}>
            lpm · Rango normal para niños: 70–100 lpm
          </div>

          <button
            onClick={saveBpm}
            style={{
              marginTop: 16, padding: "9px 20px", borderRadius: 10,
              background: bpmSaved ? "rgb(var(--calm-rgb) / 0.2)" : "rgb(var(--danger-rgb) / 0.15)",
              border: `1px solid ${bpmSaved ? "rgb(var(--calm-rgb) / 0.4)" : "rgb(var(--danger-rgb) / 0.3)"}`,
              color: bpmSaved ? "#5EDC9A" : "#EC5B6B",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", transition: "all 0.3s",
            }}
          >
            {bpmSaved ? <><IconCheck size={14}/> Guardado</> : "Guardar ritmo base"}
          </button>
        </Card>

        {/* ── Sección 2: Modo Claro / Oscuro ── */}
        <Card style={{ padding: 26, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(245,208,111,0.12)", border: "1px solid rgba(245,208,111,0.25)",
                color: "#F5D06F", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {darkMode ? <IconMoon size={16}/> : <IconSun size={16}/>}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Apariencia</div>
                <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>
                  Actualmente en modo {darkMode ? "oscuro" : "claro"}
                </div>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={toggleDarkMode}
              style={{
                width: 52, height: 28, borderRadius: 14, cursor: "pointer",
                border: "1px solid var(--border)",
                background: darkMode ? "var(--brand)" : "var(--surface-strong)",
                position: "relative", transition: "background 0.3s",
              }}
            >
              <div style={{
                position: "absolute", top: 3,
                left: darkMode ? 26 : 3,
                width: 20, height: 20, borderRadius: 10,
                background: "#fff",
                transition: "left 0.25s cubic-bezier(.4,0,.2,1)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {darkMode
                  ? <IconMoon size={10} style={{ color: "var(--brand)" }}/>
                  : <IconSun size={10} style={{ color: "var(--attention)" }}/>
                }
              </div>
            </button>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--ink-faint)" }}>
            Puedes cambiar a modo oscuro para situaciones de baja luminosidad.
          </div>
        </Card>

        {/* ── Sección 3: Datos del usuario ── */}
        <Card style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(184,164,255,0.12)", border: "1px solid rgba(184,164,255,0.25)",
              color: "#B8A4FF", display: "flex", alignItems: "center", justifyContent: "center",
            }}><IconUser size={16}/></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Datos del perfil</div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>Información del niño y del cuidador</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Nombre del niño</label>
              <input
                style={inputStyle}
                value={childName}
                onChange={e => { setChildName(e.target.value); setProfileSaved(false); }}
              />
            </div>
            <div>
              <label style={labelStyle}>Edad</label>
              <input
                style={inputStyle}
                type="number" min={4} max={18}
                value={childAge}
                onChange={e => { setChildAge(Number(e.target.value)); setProfileSaved(false); }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Nombre del cuidador</label>
            <input
              style={inputStyle}
              value={parentName}
              onChange={e => { setParentName(e.target.value); setProfileSaved(false); }}
            />
          </div>

          <button
            onClick={saveProfile}
            style={{
              padding: "10px 22px", borderRadius: 10,
              background: profileSaved
                ? "var(--calm)"
                : "var(--surface)",
              border: `1px solid ${profileSaved ? "var(--calm)" : "var(--border-strong)"}`,
              color: profileSaved ? "#FFFFFF" : "var(--ink)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", transition: "all 0.3s",
            }}
          >
            {profileSaved ? <><IconCheck size={14}/> Guardado correctamente</> : "Guardar cambios"}
          </button>
        </Card>
      </div>
    </div>
  );
}
