"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stressState, GradientText, AmbientOrbs, Card, Pill } from "@/components/marketing/primitives";
import {
  IconHome, IconChart, IconSettings, IconLogOut, IconArrowRight,
  IconSparkles, IconWind, IconGamepad, IconMusic, IconBook, IconHeart,
  IconChevronRight, IconActivity, IconSun, IconWatch,
  IconCalendar, IconWifi, IconWifiOff, IconRefresh, IconX, IconAlertTriangle,
} from "@/components/marketing/icons";
import { useAuth } from "@/hooks/useAuth";
import {
  CHILD_PROFILE, PARENT_PROFILE, getCurrentStress,
  generate24hHistory, getWeeklyData, TODAY_ACTIVITY, RECOMMENDATIONS,
  getStressKey
} from "@/lib/mockData";
import { useSimulation } from "@/lib/simulationContext";

// ─── Anillo de estrés ────────────────────────────────────────────────────────
const StressRing = ({ value, size = 260 }) => {
  const state = stressState(value);
  const r = size / 2 - 22;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="stressGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={state.hex}/>
            <stop offset="100%" stopColor={state.hex} stopOpacity="0.6"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r}
          stroke="url(#stressGrad)" strokeWidth="14" fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 12, borderRadius: "50%", background: `radial-gradient(circle, ${state.hex}22, transparent 70%)`, pointerEvents: "none", transition: "background 0.4s" }}/>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 8 }}>Nivel de calma</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 72, fontWeight: 500, lineHeight: 1, color: state.hex, letterSpacing: "-0.04em", transition: "color 0.4s" }}>{100 - value}</div>
        <div style={{ fontSize: 14, color: "var(--ink-muted)", marginTop: 6, fontWeight: 500 }}>{state.label}</div>
      </div>
    </div>
  );
};

// ─── Gráfico 24h ─────────────────────────────────────────────────────────────
const StressChart = ({ stress, hourlyData }) => {
  const w = 640, h = 180;
  const points = useMemo(() => {
    if (hourlyData && hourlyData.length === 24) return hourlyData.map(hd => {
      const val = hd.avgStress ?? hd.stressLevel ?? hd.stress;
      return val != null ? val : 0;
    });
    const arr = [];
    for (let i = 0; i < 24; i++) {
      const wobble = Math.sin(i * 0.6 + stress * 0.05) * 10 + Math.sin(i * 1.3) * 5;
      const schoolBump = (i >= 8 && i <= 14) ? 10 : 0;
      arr.push(Math.max(5, Math.min(95, stress + wobble + schoolBump - 10)));
    }
    return arr;
  }, [stress, hourlyData]);

  const xFor = i => 20 + (i / 23) * (w - 40);
  const yFor = v => h - 20 - (v / 100) * (h - 40);
  const d = points.map((v, i) => (i ? "L" : "M") + xFor(i) + " " + yFor(v)).join(" ");
  const dFill = d + ` L ${xFor(23)} ${h-20} L ${xFor(0)} ${h-20} Z`;
  const state = stressState(stress);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={state.hex} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={state.hex} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1="20" x2={w-20} y1={20 + g*(h-40)} y2={20 + g*(h-40)} stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4"/>
        ))}
        <path d={dFill} fill="url(#chartFill)"/>
        <path d={d} stroke={state.hex} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={xFor(23)} cy={yFor(points[23])} r="5" fill={state.hex}/>
        <circle cx={xFor(23)} cy={yFor(points[23])} r="10" fill={state.hex} opacity="0.25"/>
        {[0, 6, 12, 18, 23].map(i => (
          <text key={i} x={xFor(i)} y={h - 4} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)" fontFamily="Inter">
            {i === 23 ? "Ahora" : `${i.toString().padStart(2,"0")}:00`}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ─── Barras semanales ─────────────────────────────────────────────────────────
const WeekBars = ({ stress, weeklyOverride }) => {
  const defaultWeekly = useMemo(() => getWeeklyData(), []);
  const weekly = weeklyOverride || defaultWeekly;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
      {weekly.map((d, i) => {
        const s = stressState(d.avgStress);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: "100%", height: `${d.avgStress}%`, borderRadius: 8,
              background: `linear-gradient(180deg, ${s.hex}, ${s.hex}77)`,
              boxShadow: d.isToday ? `0 0 16px ${s.hex}66` : "none",
              border: d.isToday ? `1px solid ${s.hex}` : "none",
              transition: "height 0.6s, background 0.3s"
            }}/>
            <div style={{ fontSize: 11, color: d.isToday ? s.hex : "var(--ink-faint)", fontWeight: d.isToday ? 600 : 400 }}>{d.day}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Modal de recomendación ───────────────────────────────────────────────────
const RecModal = ({ rec, state, onClose }) => {
  if (!rec) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 10001,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          animation: "simFadeIn 0.2s ease-out",
        }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 10002,
        transform: "translate(-50%,-50%)",
        width: "min(480px, calc(100vw - 40px))",
        background: "rgba(13,10,36,0.98)",
        border: `1px solid ${state.hex}40`,
        borderRadius: 20,
        padding: 28,
        boxShadow: `0 24px 80px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)`,
        animation: "recModalIn 0.25s cubic-bezier(.2,1.2,.4,1)",
      }}>
        {/* Cabecera del modal */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${state.hex}33, ${state.hex}10)`,
              border: `1px solid ${state.hex}40`, color: state.hex,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {{
                wind: <IconWind size={20}/>, gamepad: <IconGamepad size={20}/>,
                music: <IconMusic size={20}/>, book: <IconBook size={20}/>,
                heart: <IconHeart size={20}/>
              }[rec.icon] || <IconSparkles size={20}/>}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{rec.title}</div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, color: state.hex,
                background: `${state.hex}15`, borderRadius: 99, padding: "2px 10px",
              }}>{rec.duration}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
            color: "var(--ink-dim)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><IconX size={14}/></button>
        </div>

        {/* Descripción corta */}
        <div style={{
          padding: "12px 14px", borderRadius: 10, marginBottom: 16,
          background: `${state.hex}0D`, border: `1px solid ${state.hex}25`,
          fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.5,
        }}>{rec.detail}</div>

        {/* Explicación profunda */}
        <div style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.7 }}>
          {rec.deepExplanation}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 22, width: "100%", padding: "12px",
            borderRadius: 12, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${state.hex}, ${state.hex}bb)`,
            color: "#0D0824", fontWeight: 600, fontSize: 14,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Entendido
        </button>
      </div>
      <style>{`
        @keyframes recModalIn {
          from { opacity:0; transform:translate(-50%,-48%) scale(0.95); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
        @keyframes simFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};

// ─── Panel de recomendaciones IA ──────────────────────────────────────────────
const RecommendationPanel = ({ stress, bpm, bpmResting }) => {
  const [recs, setRecs]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [isAI, setIsAI]               = useState(false);
  const [aiError, setAiError]         = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);

  const state     = stressState(stress);
  const stressKey = getStressKey(stress);

  // Refs para capturar los valores más recientes sin hacerlos dependencias del callback.
  // Esto evita que fetchRecs se recree (y la IA se llame) en cada tick de simulación.
  const stressRef    = useRef(stress);
  const bpmRef       = useRef(bpm);
  const lastFetchRef = useRef(0); // timestamp del último request exitoso
  stressRef.current  = stress;
  bpmRef.current     = bpm;

  const COOLDOWN_MS = 15_000; // mínimo 15s entre requests automáticos

  const phaseLabel = {
    calm:     { text: "Estado tranquilo",              color: "#A8E6CF" },
    mild:     { text: "Pre-episodio · Prevención",     color: "#F5D06F" },
    moderate: { text: "Ansiedad moderada · Intervenir",color: "#FFB4A2" },
    high:     { text: "Durante el episodio · Crisis",  color: "#EC5B6B" },
  }[stressKey];

  // fetchRecs solo depende de stressKey y bpmResting — no de stress/bpm directamente.
  // Además aplica un cooldown de 15s para no spam requests durante la simulación.
  const fetchRecs = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < COOLDOWN_MS) return;

    setLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stress:     stressRef.current,            // valor actual via ref
          bpm:        bpmRef.current ?? 80,
          bpmResting: bpmResting ?? CHILD_PROFILE.bpmResting,
          stressKey,
          childName:  CHILD_PROFILE.name,
          childAge:   CHILD_PROFILE.age,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.fallback) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setRecs(data.recommendations);
      setIsAI(true);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.warn("[RecommendationPanel] Fallback local:", err.message);
      setAiError(err.message);
      setRecs(RECOMMENDATIONS[stressKey] || RECOMMENDATIONS.mild);
      setIsAI(false);
    } finally {
      setLoading(false);
    }
  }, [stressKey, bpmResting]); // ← solo cambia cuando cambia la categoría de ansiedad

  // Llamar a la IA cuando cambia la categoría (calm/mild/moderate/high)
  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const iconMap = {
    wind: <IconWind size={18}/>, gamepad: <IconGamepad size={18}/>,
    music: <IconMusic size={18}/>, book: <IconBook size={18}/>,
    heart: <IconHeart size={18}/>
  };

  return (
    <>
      <Card style={{ padding: 26, height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(184,164,255,0.9)", marginBottom: 6 }}>
              <IconSparkles size={12}/> Recomendación IA
            </div>
            <h3 style={{ margin: "0 0 6px", fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Para este momento</h3>
            {/* Fila de badges: fase + fuente de datos */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 11, fontWeight: 600, letterSpacing: 0.4,
                color: phaseLabel.color,
                background: `${phaseLabel.color}18`,
                border: `1px solid ${phaseLabel.color}35`,
                borderRadius: 99, padding: "3px 10px",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: phaseLabel.color }}/>
                {phaseLabel.text}
              </div>
              {/* Badge: IA real vs. fallback local */}
              {!loading && recs && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                  color:      isAI ? "#76b900" : "#ff6b6b",
                  background: isAI ? "rgba(118,185,0,0.10)" : "rgba(255,107,107,0.10)",
                  border:     `1px solid ${isAI ? "rgba(118,185,0,0.30)" : "rgba(255,107,107,0.30)"}`,
                  borderRadius: 99, padding: "3px 9px",
                  textTransform: "uppercase",
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: isAI ? "#76b900" : "#ff6b6b",
                    animation: isAI ? "simPulseSmall 2s ease-in-out infinite" : "none",
                  }}/>
                  {isAI ? "NVIDIA NIM · en vivo" : "Sin conexión"}
                </div>
              )}
            </div>
          </div>
          {/* Botón actualizar */}
          <button onClick={() => fetchRecs(true)} disabled={loading} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "6px 10px", color: "var(--ink-muted)", cursor: "pointer", fontSize: 12,
            display: "inline-flex", alignItems: "center", gap: 6,
            opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
          }}>
            {loading
              ? <span style={{ width: 10, height: 10, border: "1.5px solid rgba(255,255,255,0.2)", borderTopColor: "#B8A4FF", borderRadius: 5, animation: "spin-slow 0.8s linear infinite", display: "inline-block" }}/>
              : <IconRefresh size={12}/>
            }
            {loading ? "Consultando IA…" : "Actualizar"}
          </button>
        </div>

        {/* Banner de error (solo si falló la IA y se usa fallback) */}
        {aiError && !loading && (
          <div style={{
            marginBottom: 12, padding: "8px 12px", borderRadius: 8,
            background: "rgba(236,91,107,0.08)", border: "1px solid rgba(236,91,107,0.22)",
            fontSize: 11, color: "#EC5B6B", display: "flex", alignItems: "center", gap: 6,
          }}>
            <IconAlertTriangle size={11}/>
            IA no disponible · usando datos locales.{" "}
            <span style={{ color: "rgba(236,91,107,0.6)", fontStyle: "italic" }}>
              ({aiError.length > 60 ? aiError.slice(0, 60) + "…" : aiError})
            </span>
          </div>
        )}

        {loading && !recs ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ height: 72, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))", backgroundSize: "200% 100%", animation: "sheen 1.8s linear infinite" }}/>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(recs || []).map((r, i) => (
              <div
                key={i}
                onClick={() => setSelectedRec(r)}
                style={{
                  padding: 14, borderRadius: 12,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${state.hex}10`;
                  e.currentTarget.style.borderColor = `${state.hex}40`;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${state.hex}33, ${state.hex}10)`,
                  border: `1px solid ${state.hex}40`, color: state.hex,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{iconMap[r.icon] || <IconSparkles size={18}/>}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.4 }}>{r.detail}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{r.duration}</div>
                <IconChevronRight size={14} style={{ color: "var(--ink-faint)", flexShrink: 0 }}/>
              </div>
            ))}
            <div style={{ fontSize: 11, color: "var(--ink-faint)", textAlign: "center", marginTop: 4 }}>
              Toca una tarjeta para ver la explicación completa
            </div>
          </div>
        )}
      </Card>

      <RecModal rec={selectedRec} state={state} onClose={() => setSelectedRec(null)}/>
    </>
  );
};

// ─── Tarjeta de estadística ───────────────────────────────────────────────────
const Stat = ({ label, value, sub, accent, action, onAction }) => (
  <div style={{ padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)" }}>
    <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1, color: accent || "var(--ink)" }}>{value}</div>
    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>{sub}</div>
    {action && (
      <button
        onClick={onAction}
        style={{
          marginTop: 8, fontSize: 11, color: accent || "#B8A4FF",
          background: "transparent", border: `1px solid ${accent || "#B8A4FF"}40`,
          borderRadius: 6, padding: "3px 8px", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 4,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <IconRefresh size={10}/> {action}
      </button>
    )}
  </div>
);

// ─── Tarjeta del hub de navegación ───────────────────────────────────────────
const HubCard = ({ href, icon, title, desc, accent }) => (
  <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
    <Card hover style={{ padding: 22, height: "100%", cursor: "pointer" }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `linear-gradient(135deg, ${accent}40, ${accent}10)`,
        border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center",
        color: accent, marginBottom: 16
      }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", letterSpacing: -0.2 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-dim)", margin: 0, lineHeight: 1.4 }}>{desc}</p>
    </Card>
  </Link>
);

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardClient({ user, profile }) {
  const router = useRouter();
  const { supabase } = useAuth();
  const sim = useSimulation();
  const [baseStress, setBaseStress] = useState(35);
  const [baseHourlyData, setBaseHourlyData] = useState(null);
  const [baseBpm, setBaseBpm] = useState(72);
  // WiFi status simulado: en producción vendría de la pulsera
  const [wifiStatus] = useState("online"); // "online" | "offline"

  useEffect(() => {
    setBaseStress(getCurrentStress());
    setBaseHourlyData(generate24hHistory());
  }, []);

  // Usar datos de simulación cuando está activo
  const simData = sim.active ? sim.getCurrentSimData() : null;
  const stress = sim.active ? simData.stress : baseStress;
  const simHourly = sim.active ? sim.getProgressiveHourlyData() : null;
  const hourlyData = simHourly
    ? simHourly.map(h => ({ ...h, avgStress: h.stress, stressLevel: h.stress }))
    : baseHourlyData;
  const simWeekly = sim.active ? sim.getSimWeeklyData() : null;
  const simEvents = sim.active ? sim.getVisibleEvents() : null;

  const state = stressState(stress);
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 19 ? "Buenas tardes" : "Buenas noches";
  const parentName = profile?.display_name || PARENT_PROFILE.name;
  const avgBpm = sim.active ? (simData?.bpm || 72) : baseBpm + Math.floor(stress / 5);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  // Simula un reseteo del ritmo cardíaco basal (ej. después de hacer deporte)
  const handleResetBaseBpm = () => {
    const newBase = Math.round(65 + Math.random() * 12); // 65–77 lpm
    setBaseBpm(newBase);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-2)", color: "var(--ink)", position: "relative" }}>
      <AmbientOrbs/>

      {/* Barra lateral */}
      <aside className="dashboard-sidebar" style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 76, zIndex: 5,
        borderRight: "1px solid var(--border)", background: "rgba(10,10,26,0.7)",
        backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0"
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)", marginBottom: 32 }}/>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {[
            { i: <IconHome size={18}/>,     active: true,  label: "Inicio",    href: "/dashboard" },
            { i: <IconChart size={18}/>,    active: false, label: "Historial", href: "/history" },
            { i: <IconWatch size={18}/>,    active: false, label: "Conexión",  href: "/pairing" },
            { i: <IconCalendar size={18}/>, active: false, label: "Horario",   href: "/schedule" },
            { i: <IconSettings size={18}/>, active: false, label: "Ajustes",   href: "/settings" },
          ].map((x, k) => (
            <Link key={k} href={x.href} title={x.label} style={{
              width: 44, height: 44, borderRadius: 12,
              background: x.active ? "rgba(184,164,255,0.15)" : "transparent",
              border: x.active ? "1px solid rgba(184,164,255,0.25)" : "1px solid transparent",
              color: x.active ? "#B8A4FF" : "var(--ink-dim)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", textDecoration: "none"
            }}>{x.i}</Link>
          ))}
        </div>
        <button onClick={handleSignOut} title="Salir" style={{
          width: 44, height: 44, borderRadius: 12,
          background: "transparent", border: "1px solid transparent",
          color: "var(--ink-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}><IconLogOut size={18}/></button>
      </aside>

      {/* Contenido principal */}
      <main className="dashboard-main" style={{ marginLeft: 76, padding: "32px 40px 80px", position: "relative", zIndex: 2, maxWidth: 1440 }}>

        {/* Barra superior */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 4 }}>{greeting}, {parentName}</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>
              Así está <GradientText>{CHILD_PROFILE.name}</GradientText> hoy
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Indicador de pulsera */}
            <Pill dot={state.hex}>
              {sim.active ? `Simulando · ${sim.getTimeLabel()}` : "Pulsera conectada"}
            </Pill>
            {/* Badge WiFi */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, padding: "5px 12px",
              borderRadius: 99,
              background: wifiStatus === "online" ? "rgba(94,220,154,0.12)" : "rgba(236,91,107,0.12)",
              border: `1px solid ${wifiStatus === "online" ? "rgba(94,220,154,0.35)" : "rgba(236,91,107,0.35)"}`,
              color: wifiStatus === "online" ? "#5EDC9A" : "#EC5B6B",
            }}>
              {wifiStatus === "online" ? <IconWifi size={12}/> : <IconWifiOff size={12}/>}
              {wifiStatus === "online" ? "WiFi conectada" : "Sin conexión"}
            </span>
            <Link href="/kids" style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
              background: "rgba(184,164,255,0.12)", color: "#D4C5FF",
              border: "1px solid rgba(184,164,255,0.25)", borderRadius: 10,
              fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "none"
            }}>
              Abrir vista de {CHILD_PROFILE.name} <IconArrowRight size={12}/>
            </Link>
            <div style={{
              width: 38, height: 38, borderRadius: 19,
              background: CHILD_PROFILE.avatarGradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 600, color: "#2A0E16", fontSize: 14
            }}>{CHILD_PROFILE.avatar}</div>
          </div>
        </div>

        {/* Fila 1: anillo + recomendaciones */}
        <div className="dashboard-row" style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, marginBottom: 24 }}>
          <Card style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <StressRing value={stress} size={260}/>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px 10px 12px",
              borderRadius: 999, background: `${state.hex}18`, border: `1px solid ${state.hex}40`,
              color: state.hex, fontSize: 13, fontWeight: 500, transition: "all 0.3s"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: state.hex, boxShadow: `0 0 8px ${state.hex}` }}/>
              {state.key === "calm"     && "Tranquilo · puede concentrarse"}
              {state.key === "mild"     && "Un poco inquieto · observar"}
              {state.key === "moderate" && "Estresado · necesita apoyo"}
              {state.key === "high"     && "Muy ansioso · intervenir ya"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>
              Basado en HRV y ritmo cardíaco de los últimos 10 minutos.
              La pulsera se prende una luz cuando detecta un nivel de estrés elevado.
            </div>
          </Card>
          <RecommendationPanel
            stress={stress}
            bpm={avgBpm}
            bpmResting={CHILD_PROFILE.bpmResting}
          />
        </div>

        {/* Fila 2: gráfico 24h */}
        <Card style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 4 }}>Últimas 24 horas</div>
              <h3 style={{ margin: 0, fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Línea del día</h3>
            </div>
          </div>
          <StressChart stress={stress} hourlyData={hourlyData}/>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
            <Stat label="Promedio hoy" value={`${Math.round(100 - stress * 0.95)}`} sub="nivel de calma" accent={state.hex}/>
            <Stat
              label="Ritmo cardíaco"
              value={`${avgBpm}`}
              sub="lpm promedio"
              accent="#EC5B6B"
              action="Actualizar pulsos base"
              onAction={handleResetBaseBpm}
            />
            <Stat label="Sueño" value={sim.active ? sim.weekData[sim.currentDay]?.summary.sleepHours : "8h 20m"} sub="anoche"/>
          </div>
        </Card>

        {/* Fila 3: semana + actividad */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, marginBottom: 24 }}>
          <Card style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 4 }}>Esta semana</div>
                <h3 style={{ margin: 0, fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Patrón semanal</h3>
              </div>
              <Pill>{state.label}</Pill>
            </div>
            <WeekBars stress={stress} weeklyOverride={simWeekly}/>
            <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--ink)" }}>Observación:</strong> los martes muestran picos más altos, coinciden con clases de matemáticas.
            </div>
          </Card>

          <Card style={{ padding: 28 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 4 }}>Actividad</div>
            <h3 style={{ margin: "0 0 18px", fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Hoy</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(simEvents || TODAY_ACTIVITY).map((x, i) => {
                const iconMap = {
                  sun: <IconSun size={14}/>, activity: <IconActivity size={14}/>,
                  wind: <IconWind size={14}/>, heart: <IconHeart size={14}/>, gamepad: <IconGamepad size={14}/>,
                  book: <IconBook size={14}/>, music: <IconMusic size={14}/>
                };
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, animation: sim.active ? "heroTextIn 0.4s" : "none" }}>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums", width: 44 }}>{x.time}</div>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${x.color}20`, border: `1px solid ${x.color}40`, color: x.color,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>{iconMap[x.icon] || <IconHeart size={14}/>}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-muted)", flex: 1 }}>{x.event}</div>
                  </div>
                );
              })}
              {sim.active && simEvents && simEvents.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic" }}>Esperando eventos...</div>
              )}
            </div>
          </Card>
        </div>

        {/* Fila 4: Hub de navegación */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <HubCard href="/kids"     icon={<IconHeart size={22}/>}    title={`Vista de ${CHILD_PROFILE.name}`} desc="Personaje animado, ejercicios de respiración y minijuegos." accent="#B8A4FF"/>
          <HubCard href="/pairing"  icon={<IconWatch size={22}/>}    title="Conexión"  desc="Busca y vincula un dispositivo CalmBand." accent="#A8E6CF"/>
          <HubCard href="/schedule" icon={<IconCalendar size={22}/>} title="Horario"   desc="Calendario diario de Simón con actividades del colegio." accent="#F5D06F"/>
          <HubCard href="/history"  icon={<IconChart size={22}/>}    title="Historial" desc="Sesiones pasadas, tendencias y ejercicios completados." accent="#FFB4A2"/>
        </div>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-main { margin-left: 0 !important; padding: 20px 16px 60px !important; }
          .dashboard-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .dashboard-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
