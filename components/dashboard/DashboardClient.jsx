"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stressState, GradientText, AmbientOrbs, Pill } from "@/components/marketing/primitives";
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
import { SIMULATION_ONLY } from "@/lib/simulationMode";
import { normalizeAccent, SEMANTIC_COLORS } from "@/lib/utils";

// Iconos por clave para recomendaciones y actividad. Definidos a nivel de módulo
// para no reconstruir los elementos en cada render.
const REC_MODAL_ICONS = {
  wind: <IconWind size={20}/>, gamepad: <IconGamepad size={20}/>,
  music: <IconMusic size={20}/>, book: <IconBook size={20}/>,
  heart: <IconHeart size={20}/>,
};
const REC_LIST_ICONS = {
  wind: <IconWind size={18}/>, gamepad: <IconGamepad size={18}/>,
  music: <IconMusic size={18}/>, book: <IconBook size={18}/>,
  heart: <IconHeart size={18}/>,
};
const ACTIVITY_ICONS = {
  sun: <IconSun size={14}/>, activity: <IconActivity size={14}/>,
  wind: <IconWind size={14}/>, heart: <IconHeart size={14}/>,
  gamepad: <IconGamepad size={14}/>, book: <IconBook size={14}/>,
  music: <IconMusic size={14}/>,
};

// ─── Anillo de estrés ────────────────────────────────────────────────────────
const StressRing = ({ value, size = 260 }) => {
  const state = stressState(value);
  const r = size / 2 - 22;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Halo externo que respira */}
      <div
        aria-hidden
        className="absolute inset-[-18%] rounded-full blur-2xl animate-breathe-slow"
        style={{ background: `radial-gradient(circle, ${state.hex}55, transparent 60%)` }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id="stressGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={state.hex}/>
            <stop offset="100%" stopColor={state.hex} stopOpacity="0.55"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--border-strong)" strokeWidth="14" fill="none"/>
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke="url(#stressGrad)" strokeWidth="14" fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s" }}
        />
      </svg>
      <div
        className="absolute inset-3 rounded-full pointer-events-none transition-all duration-500"
        style={{ background: `radial-gradient(circle, ${state.hex}33, transparent 70%)` }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] tracking-[0.2em] uppercase text-ink-faint mb-2">
          <span title="Índice estimado de calma basado en HRV y pulso" className="cursor-help">Nivel de calma</span>
        </div>
        <div
          className="font-display font-medium leading-none tracking-tighter transition-colors duration-500"
          style={{ fontSize: "clamp(56px, 7vw, 76px)", color: state.hex, letterSpacing: "-0.04em" }}
        >
          {100 - value}
        </div>
        <div className="text-sm font-medium text-ink-muted mt-2">{state.label}</div>
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
    <div className="w-full relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={state.hex} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={state.hex} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1="20" x2={w-20} y1={20 + g*(h-40)} y2={20 + g*(h-40)} stroke="var(--border)" strokeDasharray="2 4"/>
        ))}
        <path d={dFill} fill="url(#chartFill)"/>
        <path d={d} stroke={state.hex} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={xFor(23)} cy={yFor(points[23])} r="5" fill={state.hex}/>
        <circle cx={xFor(23)} cy={yFor(points[23])} r="10" fill={state.hex} opacity="0.25"/>
        {[0, 6, 12, 18, 23].map(i => (
          <text key={i} x={xFor(i)} y={h - 4} textAnchor="middle" fontSize="10" fill="var(--ink-faint)" fontFamily="Inter">
            {i === 23 ? "Ahora" : `${i.toString().padStart(2,"0")}:00`}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ─── Barras semanales ─────────────────────────────────────────────────────────
const WeekBars = ({ weeklyOverride }) => {
  const defaultWeekly = useMemo(() => getWeeklyData(), []);
  const weekly = Array.isArray(weeklyOverride) && weeklyOverride.length
    ? weeklyOverride
    : defaultWeekly;
  return (
    <div className="flex items-end gap-2.5 h-[120px]">
      {weekly.map((d, i) => {
        const avgStress = Math.max(8, Math.min(95, Number.isFinite(d.avgStress) ? d.avgStress : 10));
        const s = stressState(avgStress);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-lg transition-[height,background] duration-500"
              style={{
                height: `${avgStress}%`,
                background: `linear-gradient(180deg, ${s.hex}, ${s.hex}77)`,
                boxShadow: d.isToday ? `0 0 18px ${s.hex}77, inset 0 1px 0 rgba(255,255,255,0.2)` : "inset 0 1px 0 rgba(255,255,255,0.08)",
                border: d.isToday ? `1px solid ${s.hex}` : "1px solid transparent"
              }}
            />
            <div
              className="text-[11px]"
              style={{ color: d.isToday ? s.hex : "var(--ink-faint)", fontWeight: d.isToday ? 600 : 400 }}
            >
              {d.day}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Etiquetas de tendencia para actividad diaria ───────────────────────────
const describeActivityTrend = (items, index) => {
  const current = items[index];
  const currentStress = Number.isFinite(current?.stress) ? current.stress : null;
  const prev = index > 0 ? items[index - 1] : null;
  const prevStress = Number.isFinite(prev?.stress) ? prev.stress : null;

  if (currentStress == null) return "Cambio en el estado";
  if (prevStress == null) {
    if (currentStress >= 70) return "Inicio del día con estrés alto";
    if (currentStress <= 25) return "Inicio del día con calma";
    if (currentStress >= 50) return "Inicio del día con estrés moderado";
    return "Inicio del día estable";
  }

  const delta = currentStress - prevStress;
  if (delta >= 12) return "Subida marcada de estrés";
  if (delta >= 5) return "Subida leve de estrés";
  if (delta <= -12) return "Descenso marcado de estrés";
  if (delta <= -5) return "Descenso leve de estrés";
  if (currentStress >= 70) return "Pico de estrés sostenido";
  if (currentStress <= 25) return "Momento de calma sostenida";
  return "Nivel de estrés estable";
};

// ─── Modal de recomendación ───────────────────────────────────────────────────
const RecModal = ({ rec, state, onClose }) => {
  if (!rec) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-md"
        style={{ animation: "simFadeIn 0.2s ease-out" }}
      />
      <div
        className="fixed top-1/2 left-1/2 z-[10002] -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-32px))] rounded-2xl p-6 sm:p-7"
        style={{
          background: "rgba(13,10,36,0.98)",
          border: `1px solid ${state.hex}40`,
          boxShadow: `0 32px 80px -16px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05), 0 0 64px -16px ${state.hex}55`,
          animation: "recModalIn 0.25s cubic-bezier(.2,1.2,.4,1)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${state.hex}33, ${state.hex}10)`,
                border: `1px solid ${state.hex}40`,
                color: state.hex,
              }}
            >
              {REC_MODAL_ICONS[rec.icon] || <IconSparkles size={20}/>}
            </div>
            <div>
              <div className="text-lg font-bold mb-0.5">{rec.title}</div>
              <div
                className="inline-flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-0.5"
                style={{ color: state.hex, background: `${state.hex}15` }}
              >
                {rec.duration}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg shrink-0 bg-white/[0.06] border border-line text-ink-dim cursor-pointer flex items-center justify-center hover:bg-white/[0.1] transition-colors"
          >
            <IconX size={14}/>
          </button>
        </div>

        <div
          className="px-3.5 py-3 rounded-xl mb-4 text-sm text-ink-muted leading-relaxed"
          style={{
            background: `${state.hex}0D`,
            border: `1px solid ${state.hex}25`,
          }}
        >
          {rec.detail}
        </div>

        <div className="text-[13px] text-ink-dim leading-relaxed">
          {rec.deepExplanation}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl border-0 font-semibold text-sm cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: `linear-gradient(135deg, ${state.hex}, ${state.hex}bb)`,
            color: "#0D0824",
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
const RecommendationPanel = ({ stress, bpm, bpmResting, hourlyData }) => {
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
  const lastFetchRef = useRef(0);
  stressRef.current  = stress;
  bpmRef.current     = bpm;

  const COOLDOWN_MS = 15_000;

  const phaseLabel = {
    calm:     { text: "Estado tranquilo",              color: SEMANTIC_COLORS.calm },
    mild:     { text: "Atención preventiva",           color: SEMANTIC_COLORS.attention },
    moderate: { text: "Estrés moderado · Intervenir",  color: SEMANTIC_COLORS.danger },
    high:     { text: "Estrés alto · Crisis",          color: SEMANTIC_COLORS.danger },
  }[stressKey];

  const narrative = useMemo(() => {
    const values = Array.isArray(hourlyData) ? hourlyData.map(hd => {
      const val = hd?.avgStress ?? hd?.stressLevel ?? hd?.stress;
      return Number.isFinite(val) ? val : null;
    }) : [];
    const valid = values.filter(v => v != null);
    if (!valid.length) {
      return {
        summary: "Hoy el nivel de estrés se mantuvo dentro de rangos esperables, con variaciones suaves a lo largo del día.",
        recommendation: "Recomendación: sostener pausas breves de respiración antes de momentos exigentes."
      };
    }

    const maxVal = Math.max(...valid);
    const minVal = Math.min(...valid);
    const maxIndex = values.indexOf(maxVal);
    const minIndex = values.indexOf(minVal);
    const delta = maxVal - minVal;

    const timeLabel = (hour) => {
      if (hour < 6) return "madrugada";
      if (hour < 12) return "media mañana";
      if (hour < 17) return "tarde";
      if (hour < 21) return "noche";
      return "final del día";
    };

    const variability = delta >= 35
      ? "muy variable"
      : delta >= 20
        ? "con cambios visibles"
        : "bastante estable";

    const summary = `Hoy el estrés estuvo ${variability}, con el punto más alto en la ${timeLabel(maxIndex)} y más calma hacia la ${timeLabel(minIndex)}.`;
    const recommendation = {
      calm: "Recomendación: mantener rutinas suaves y pausas activas cortas.",
      mild: "Recomendación: anticipar pausas de respiración antes de momentos exigentes.",
      moderate: "Recomendación: reforzar ejercicios guiados cuando suba la tensión.",
      high: "Recomendación: priorizar un espacio seguro y respiración guiada ante picos de estrés.",
    }[stressKey] || "Recomendación: sostener pausas de respiración para regular el ritmo.";

    return { summary, recommendation };
  }, [hourlyData, stressKey]);

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
          stress:     stressRef.current,
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
  }, [stressKey, bpmResting]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  return (
    <>
      <div
        className="card-elevated h-full p-6 sm:p-7"
        style={{ "--card-glow": `${state.hex}33` }}
      >
        <div className="flex justify-between items-start mb-4 gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#D4C5FF] mb-1.5">
              <IconSparkles size={12}/> Recomendación IA
            </div>
            <h3 className="m-0 mb-2 font-display text-2xl sm:text-[26px] font-medium tracking-tight">Para este momento</h3>
            <div className="flex flex-wrap gap-1.5 items-center">
              <div
                className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wider rounded-full px-2.5 py-1"
                style={{
                  color: phaseLabel.color,
                  background: `${phaseLabel.color}18`,
                  border: `1px solid ${phaseLabel.color}35`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: phaseLabel.color, boxShadow: `0 0 6px ${phaseLabel.color}` }}/>
                {phaseLabel.text}
              </div>
              {!loading && recs && (
                <div
                  className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase rounded-full px-2 py-0.5"
                  style={{
                    color:      isAI ? "#76b900" : "#ff6b6b",
                    background: isAI ? "rgba(118,185,0,0.10)" : "rgba(255,107,107,0.10)",
                    border:     `1px solid ${isAI ? "rgba(118,185,0,0.30)" : "rgba(255,107,107,0.30)"}`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: isAI ? "#76b900" : "#ff6b6b",
                      animation: isAI ? "simPulseSmall 2s ease-in-out infinite" : "none",
                    }}
                  />
                  {isAI ? "NVIDIA NIM · en vivo" : "Sin conexión"}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchRecs(true)}
            disabled={loading}
            className="shrink-0 bg-white/[0.04] border border-line rounded-lg px-2.5 py-1.5 text-ink-muted text-xs inline-flex items-center gap-1.5 hover:bg-white/[0.08] hover:border-white/20 transition disabled:opacity-70"
          >
            {loading
              ? <span className="w-2.5 h-2.5 border-[1.5px] border-white/20 border-t-brand rounded-full animate-spin inline-block"/>
              : <IconRefresh size={12}/>
            }
            {loading ? "Consultando…" : "Actualizar"}
          </button>
        </div>

        {aiError && !loading && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-danger/[0.08] border border-danger/20 text-[11px] text-danger flex items-center gap-1.5">
            <IconAlertTriangle size={11}/>
            Sin conexión · mostrando ejercicios guardados
          </div>
        )}

        <div className="mb-3.5 px-3.5 py-3 rounded-xl bg-white/[0.03] border border-line text-[13px] text-ink-dim leading-relaxed">
          <div className="text-[10px] tracking-[0.18em] uppercase text-ink-faint mb-1.5">Resumen del día</div>
          <div className="mb-1.5">{narrative.summary}</div>
          <div className="text-ink-muted">{narrative.recommendation}</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0,1,2].map(i => (
              <div key={i} className="animate-pulse h-[72px] rounded-xl bg-white/[0.05]"/>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {(recs || []).map((r, i) => (
              <button
                key={i}
                onClick={() => setSelectedRec(r)}
                className="group text-left p-3.5 rounded-xl bg-white/[0.025] border border-line flex items-center gap-3.5 cursor-pointer transition-all hover:-translate-y-px"
                style={{ "--hover-glow": `${state.hex}40` }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${state.hex}10`;
                  e.currentTarget.style.borderColor = `${state.hex}40`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "var(--surface)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div
                  className="w-[38px] h-[38px] rounded-xl shrink-0 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${state.hex}33, ${state.hex}10)`,
                    border: `1px solid ${state.hex}40`,
                    color: state.hex,
                  }}
                >
                  {REC_LIST_ICONS[r.icon] || <IconSparkles size={18}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-0.5">{r.title}</div>
                  <div className="text-[12px] text-ink-dim leading-snug">{r.detail}</div>
                </div>
                <div className="text-[11px] text-ink-faint tabular-nums shrink-0">{r.duration}</div>
                <IconChevronRight size={14} className="text-ink-faint shrink-0 group-hover:translate-x-0.5 transition-transform"/>
              </button>
            ))}
            <div className="text-[11px] text-ink-faint text-center mt-1">
              Toca una tarjeta para ver la explicación completa
            </div>
          </div>
        )}
      </div>

      <RecModal rec={selectedRec} state={state} onClose={() => setSelectedRec(null)}/>
    </>
  );
};

// ─── Tarjeta de estadística ───────────────────────────────────────────────────
const Stat = ({ label, value, sub, accent, action, onAction }) => (
  <div className="p-5 rounded-2xl bg-white/[0.025] border border-line transition-colors hover:border-white/15">
    <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-ink-dim mb-2">{label}</div>
    <div
      className="font-display font-medium text-[28px] sm:text-[32px] leading-none tracking-tight"
      style={{ color: accent || "var(--ink)" }}
    >
      {value}
    </div>
    <div className="text-[12px] text-ink-faint mt-1">{sub}</div>
    {action && (
      <button
        onClick={onAction}
        className="mt-2 text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md bg-transparent border cursor-pointer hover:bg-brand/10 transition-colors"
        style={{ color: SEMANTIC_COLORS.brand, borderColor: `${SEMANTIC_COLORS.brand}40` }}
      >
        <IconRefresh size={10}/> {action}
      </button>
    )}
  </div>
);

// ─── Tarjeta del hub de navegación ───────────────────────────────────────────
const HubCard = ({ href, icon, title, desc, accent }) => (
  <Link
    href={href}
    className="group card-elevated p-5 h-full cursor-pointer transition-all hover:-translate-y-0.5 block no-underline text-inherit"
    style={{ "--card-glow": `${accent}33` }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${accent}40, ${accent}10)`,
        border: `1px solid ${accent}30`,
        color: accent,
      }}
    >
      {icon}
    </div>
    <h3 className="text-[15px] font-semibold m-0 mb-1.5 tracking-tight">{title}</h3>
    <p className="text-[13px] text-ink-dim m-0 leading-snug">{desc}</p>
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
  const [wifiStatus, setWifiStatus] = useState("offline");
  const [greeting, setGreeting] = useState("Hola");
  const lastHeartbeatRef = useRef(Date.now());

  useEffect(() => {
    setBaseStress(getCurrentStress());
    setBaseHourlyData(generate24hHistory());
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");

    // Supabase Realtime para la pulsera
    const checkStatus = () => {
      const isOnline = (Date.now() - lastHeartbeatRef.current) < 120000; // 2 minutos
      setWifiStatus(isOnline ? "online" : "offline");
    };

    // Obtener último dato para iniciar
    const fetchLastData = async () => {
      const { data } = await supabase
        .from('sesiones_biometria')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data && data.timestamp) {
        lastHeartbeatRef.current = new Date(data.timestamp).getTime();
        checkStatus();
        if (data.bpm) setBaseBpm(data.bpm);
        if (data.nivel_calma) setBaseStress(100 - data.nivel_calma);
      }
    };
    fetchLastData();

    const interval = setInterval(checkStatus, 30000);

    const channel = supabase
      .channel('biometria-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sesiones_biometria' }, (payload) => {
        lastHeartbeatRef.current = Date.now();
        setWifiStatus("online");
        if (payload.new.bpm) setBaseBpm(payload.new.bpm);
        if (payload.new.nivel_calma) setBaseStress(100 - payload.new.nivel_calma);
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const simData = sim.active ? sim.getCurrentSimData() : null;
  const stress = sim.active ? simData.stress : baseStress;
  const simHourly = sim.active ? sim.getProgressiveHourlyData() : null;
  const hourlyData = simHourly
    ? simHourly.map(h => ({ ...h, avgStress: h.stress, stressLevel: h.stress }))
    : baseHourlyData;
  const simWeekly = sim.active ? sim.getSimWeeklyData() : null;
  const simEvents = sim.active ? sim.getVisibleEvents() : null;
  const activityItems = simEvents || TODAY_ACTIVITY;

  const state = stressState(stress);
  const parentName = profile?.display_name || PARENT_PROFILE.name;
  const avgBpm = sim.active ? (simData?.bpm || 72) : baseBpm + Math.floor(stress / 5);

  const handleSignOut = async () => {
    if (SIMULATION_ONLY) return;
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const handleResetBaseBpm = () => {
    const newBase = Math.round(65 + Math.random() * 12);
    setBaseBpm(newBase);
  };

  const navItems = [
    { i: <IconHome size={18}/>,     active: true,  label: "Inicio",    href: "/dashboard" },
    { i: <IconChart size={18}/>,    active: false, label: "Historial", href: "/history" },
    { i: <IconWatch size={18}/>,    active: false, label: "Conexión",  href: "/pairing" },
    { i: <IconCalendar size={18}/>, active: false, label: "Horario",   href: "/schedule" },
    { i: <IconSettings size={18}/>, active: false, label: "Ajustes",   href: "/settings" },
  ];

  return (
    <div
      className="min-h-screen text-ink relative overflow-hidden bg-bg"
      style={{ "--aurora": state.hex }}
    >
      {/* Halo aurora dinámico — se tiñe con state.hex en runtime */}
      <div className="aurora-layer animate-aurora-shift" aria-hidden/>
      <AmbientOrbs/>

      {/* Sidebar (desktop) */}
      <aside
        className="dashboard-sidebar hidden lg:flex fixed left-0 top-0 bottom-0 w-[76px] z-[5] flex-col items-center py-6 border-r border-line"
        style={{ background: "rgba(10,10,26,0.6)", backdropFilter: "blur(20px)" }}
      >
        <div className="w-9 h-9 rounded-xl mb-8" style={{ background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)" }}/>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((x, k) => (
            <Link
              key={k}
              href={x.href}
              title={x.label}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all no-underline ${
                x.active
                  ? "bg-brand/15 border border-brand/25 text-brand"
                  : "bg-transparent border border-transparent text-ink-dim hover:bg-white/[0.04] hover:text-ink"
              }`}
            >
              {x.i}
            </Link>
          ))}
        </nav>
        {!SIMULATION_ONLY && (
          <button
            onClick={handleSignOut}
            title="Salir"
            className="w-11 h-11 rounded-xl bg-transparent border border-transparent text-ink-dim cursor-pointer flex items-center justify-center hover:bg-white/[0.04] hover:text-danger transition-colors"
          >
            <IconLogOut size={18}/>
          </button>
        )}
      </aside>

      {/* Contenido principal */}
      <main className="dashboard-main relative z-[2] max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 lg:ml-[76px] py-6 sm:py-8 lg:py-10 pb-24">

        {/* Barra superior */}
        <div className="flex flex-col gap-5 mb-8 sm:mb-10">
          {/* Saludo editorial */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] tracking-[0.22em] uppercase text-ink-faint font-medium">
              {greeting} · {parentName}
            </div>
            <h1
              className="font-display font-medium m-0 leading-[1.02]"
              style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", letterSpacing: "-0.025em" }}
            >
              Así está <GradientText>{CHILD_PROFILE.name}</GradientText> hoy.
            </h1>
          </div>

          {/* Meta pills + acciones */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Pill dot={state.hex}>
              {sim.active ? `Simulando · ${sim.getTimeLabel()}` : "Pulsera conectada"}
            </Pill>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-[5px] rounded-full"
              style={{
                background: wifiStatus === "online" ? "rgba(94,220,154,0.12)" : "rgba(236,91,107,0.12)",
                border: `1px solid ${wifiStatus === "online" ? "rgba(94,220,154,0.35)" : "rgba(236,91,107,0.35)"}`,
                color: wifiStatus === "online" ? "#5EDC9A" : "#EC5B6B",
              }}
            >
              {wifiStatus === "online" ? <IconWifi size={12}/> : <IconWifiOff size={12}/>}
              {wifiStatus === "online" ? "WiFi conectada" : "Sin conexión"}
            </span>
            <Link
              href="/kids"
              className="ml-auto sm:ml-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium no-underline text-[#D4C5FF] bg-brand/10 border border-brand/25 hover:bg-brand/20 hover:border-brand/40 transition-colors"
            >
              Abrir vista de {CHILD_PROFILE.name} <IconArrowRight size={12}/>
            </Link>
            <div
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
              style={{ background: CHILD_PROFILE.avatarGradient, color: "#2A0E16" }}
            >
              {CHILD_PROFILE.avatar}
            </div>
          </div>
        </div>

        {/* Fila 1: Anillo + Recomendaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 lg:gap-6 mb-5 lg:mb-6">
          <div
            className="card-elevated p-6 sm:p-7 flex flex-col items-center justify-center gap-5"
            style={{ "--card-glow": `${state.hex}33` }}
          >
            <StressRing value={stress} size={260}/>
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-500"
              style={{
                background: `${state.hex}18`,
                border: `1px solid ${state.hex}40`,
                color: state.hex,
                boxShadow: `0 0 24px -8px ${state.hex}88`
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: state.hex, boxShadow: `0 0 8px ${state.hex}, 0 0 0 0 ${state.hex}66` }}
              />
              {state.key === "calm"     && "Tranquilo · puede concentrarse"}
              {state.key === "mild"     && "Un poco inquieto · observar"}
              {state.key === "moderate" && "Estresado · necesita apoyo"}
              {state.key === "high"     && "Muy ansioso · intervenir ya"}
            </div>
            <div className="text-[12px] text-ink-faint text-center max-w-[280px] leading-relaxed">
              Basado en{" "}
              <abbr title="Variabilidad de la frecuencia cardíaca" className="no-underline border-b border-dotted border-white/30 cursor-help">HRV</abbr>
              {" "}y ritmo cardíaco de los últimos 10 minutos. La pulsera se prende una luz cuando detecta un nivel de estrés elevado.
            </div>
          </div>
          <RecommendationPanel
            stress={stress}
            bpm={avgBpm}
            bpmResting={CHILD_PROFILE.bpmResting}
            hourlyData={hourlyData}
          />
        </div>

        {/* Fila 2: Gráfico 24h */}
        <div
          className="card-elevated p-6 sm:p-7 mb-5 lg:mb-6"
          style={{ "--card-glow": `${state.hex}22` }}
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-ink-dim mb-1">Últimas 24 horas</div>
              <h3 className="m-0 font-display text-[22px] sm:text-[26px] font-medium tracking-tight">Línea del día</h3>
            </div>
          </div>
          <StressChart stress={stress} hourlyData={hourlyData}/>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <Stat
              label="Promedio hoy"
              value={`${Math.round(100 - stress * 0.95)}`}
              sub={<span title="Índice estimado de calma basado en HRV" className="cursor-help">nivel de calma</span>}
              accent={state.hex}
            />
            <Stat
              label="Ritmo cardíaco"
              value={`${avgBpm}`}
              sub={
                <span>
                  <abbr title="Latidos por minuto" className="no-underline border-b border-dotted border-white/30 cursor-help">lpm</abbr>
                  {" "}promedio
                </span>
              }
              accent={SEMANTIC_COLORS.danger}
              action="Guardar ritmo base"
              onAction={handleResetBaseBpm}
            />
            <Stat
              label="Sueño"
              value={(sim.active ? sim.weekData[sim.currentDay]?.summary.sleepHours : null) ?? "8h 20m"}
              sub="anoche"
            />
          </div>
        </div>

        {/* Fila 3: Semana + Actividad */}
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-5 lg:gap-6 mb-5 lg:mb-6">
          <div
            className="card-elevated p-6 sm:p-7"
            style={{ "--card-glow": `${state.hex}22` }}
          >
            <div className="flex justify-between items-start mb-5 gap-3">
              <div>
                <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-ink-dim mb-1">Esta semana</div>
                <h3 className="m-0 font-display text-[22px] sm:text-[26px] font-medium tracking-tight">Patrón semanal</h3>
              </div>
              <Pill>{state.label}</Pill>
            </div>
            <WeekBars weeklyOverride={simWeekly}/>
            <div className="mt-5 px-3.5 py-3 rounded-xl bg-white/[0.02] border border-line text-[13px] text-ink-dim leading-relaxed">
              <strong className="text-ink">Observación:</strong> se ve mayor variabilidad de estrés y ritmo cardíaco a mitad de semana, con una bajada progresiva y más calma hacia el fin de semana.
            </div>
          </div>

          <div
            className="card-elevated p-6 sm:p-7"
            style={{ "--card-glow": `${SEMANTIC_COLORS.brand}1F` }}
          >
            <div className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-ink-dim mb-1">Actividad</div>
            <h3 className="m-0 mb-4 font-display text-[22px] sm:text-[26px] font-medium tracking-tight">Hoy</h3>
            <div className="flex flex-col gap-3.5">
              {activityItems.map((x, i) => {
                const accent = normalizeAccent(x.color);
                const label = describeActivityTrend(activityItems, i);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3.5"
                    style={{ animation: sim.active ? "heroTextIn 0.4s" : "none" }}
                  >
                    <div className="text-[12px] text-ink-faint tabular-nums w-11 shrink-0">{x.time}</div>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent }}
                    >
                      {ACTIVITY_ICONS[x.icon] || <IconHeart size={14}/>}
                    </div>
                    <div className="text-[13px] text-ink-muted flex-1 min-w-0">{label}</div>
                  </div>
                );
              })}
              {sim.active && simEvents && simEvents.length === 0 && (
                <div className="text-[13px] text-ink-faint italic">Esperando eventos…</div>
              )}
            </div>
          </div>
        </div>

        {/* Fila 4: Hub de navegación */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <HubCard href="/kids"     icon={<IconHeart size={22}/>}    title={`Vista de ${CHILD_PROFILE.name}`} desc="Personaje animado, ejercicios de respiración y minijuegos." accent={SEMANTIC_COLORS.brand}/>
          <HubCard href="/pairing"  icon={<IconWatch size={22}/>}    title="Conexión"  desc="Busca y vincula un dispositivo CalmBand." accent={SEMANTIC_COLORS.calm}/>
          <HubCard href="/schedule" icon={<IconCalendar size={22}/>} title="Horario"   desc="Calendario diario de Simón con actividades del colegio." accent={SEMANTIC_COLORS.attention}/>
          <HubCard href="/history"  icon={<IconChart size={22}/>}    title="Historial" desc="Sesiones pasadas, tendencias y ejercicios completados." accent={SEMANTIC_COLORS.danger}/>
        </div>
      </main>
    </div>
  );
}
