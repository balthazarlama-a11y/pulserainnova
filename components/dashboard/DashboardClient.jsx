"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stressState, Pill } from "@/components/marketing/primitives";
import {
  IconHome, IconChart, IconSettings, IconLogOut, IconArrowRight,
  IconSparkles, IconWind, IconGamepad, IconMusic, IconBook, IconHeart,
  IconChevronRight, IconActivity, IconSun, IconWatch,
  IconCalendar, IconWifi, IconWifiOff, IconRefresh, IconX, IconAlertTriangle,
  IconUser, IconChevronDown, IconClock,
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

// ─── Sistema tipográfico (punto 2) ───────────────────────────────────────────
// Nivel 1: label de sección (uppercase, tracking, gris).
const CardLabel = ({ children, ...rest }) => (
  <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-dim" {...rest}>
    {children}
  </div>
);

// ─── Paleta semántica única (punto 9) ─────────────────────────────────────────
// Un solo significado por color en toda la app.
const calmaColor = (calma) =>
  calma >= 65 ? SEMANTIC_COLORS.calm
  : calma >= 40 ? SEMANTIC_COLORS.attention
  : SEMANTIC_COLORS.danger;

// Ritmo cardíaco: en rango normal NO usa rojo (gris oscuro = dato tranquilo).
const bpmColor = (bpm) =>
  bpm >= 60 && bpm <= 100 ? "var(--ink)"
  : (bpm > 100 && bpm <= 120) || (bpm >= 50 && bpm < 60) ? SEMANTIC_COLORS.attention
  : SEMANTIC_COLORS.danger;

const relativeTime = (date) => {
  if (!date) return "sin datos";
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "hace instantes";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
};

// ─── Indicador de conexión unificado (punto 1) ───────────────────────────────
const CONNECTION_CONFIG = {
  connected: {
    color: SEMANTIC_COLORS.calm, Icon: IconWifi,
    label: "Conectado", desc: "Pulsera y WiFi activos",
  },
  partial: {
    color: SEMANTIC_COLORS.attention, Icon: IconWifi,
    label: "Parcial", desc: "Pulsera sí · WiFi caído",
  },
  disconnected: {
    color: SEMANTIC_COLORS.danger, Icon: IconWifiOff,
    label: "Desconectado", desc: "Sin datos de la pulsera",
  },
};

const ConnectionStatus = ({ level }) => {
  const cfg = CONNECTION_CONFIG[level] || CONNECTION_CONFIG.disconnected;
  const { Icon } = cfg;
  return (
    <span
      role="status"
      aria-label={`Estado de conexión: ${cfg.label}. ${cfg.desc}`}
      title={cfg.desc}
      className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-[6px] rounded-full"
      style={{
        background: `${cfg.color}1A`,
        border: `1px solid ${cfg.color}40`,
        color: cfg.color,
      }}
    >
      <Icon size={13} aria-hidden="true"/>
      {cfg.label}
      <span className="hidden sm:inline font-normal opacity-80">· {cfg.desc}</span>
    </span>
  );
};

// ─── Barra de rango (punto 3) ─────────────────────────────────────────────────
const RangeBar = ({ min, max, value, zones, markerColor }) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="relative h-1.5 rounded-full my-3" style={{ background: "var(--surface-strong)" }}>
      {(zones || []).map((z, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0"
          style={{ left: `${z.from}%`, width: `${z.to - z.from}%`, background: `${z.color}40` }}
        />
      ))}
      <div
        className="absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2"
        style={{ left: `${pct}%`, background: markerColor, boxShadow: "0 0 0 2px var(--bg-elevated)" }}
      />
    </div>
  );
};

// ─── Tarjeta de métrica con contexto completo (puntos 2 + 3) ─────────────────
const MetricCard = ({ label, value, unit, valueColor, delta, scale, timestamp, action, onAction }) => (
  <div className="card p-5">
    <CardLabel>{label}</CardLabel>
    <div className="flex items-end justify-between gap-2 mt-2">
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-display font-bold text-[32px] leading-none tracking-tight"
          style={{ color: valueColor || "var(--ink)" }}
        >
          {value}
        </span>
        {unit && <span className="text-[13px] font-medium text-ink-dim">{unit}</span>}
      </div>
      {delta && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ color: delta.color, background: `${delta.color}1A` }}
          title={`Cambio respecto a ayer: ${delta.text}`}
        >
          <span aria-hidden="true">{delta.up ? "▲" : "▼"}</span>
          {delta.text}
        </span>
      )}
    </div>

    {scale && (
      <RangeBar
        min={scale.min} max={scale.max} value={scale.value}
        zones={scale.zones} markerColor={valueColor || "var(--ink)"}
      />
    )}

    <div className="flex items-center justify-between mt-1">
      {timestamp && (
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-dim">
          <IconClock size={11} aria-hidden="true"/> {timestamp}
        </span>
      )}
      {action && (
        <button
          onClick={onAction}
          aria-label={action}
          className="text-[12px] font-medium inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-transparent border cursor-pointer hover:bg-surface transition-colors"
          style={{ color: "var(--brand)", borderColor: "var(--border-strong)" }}
        >
          <IconRefresh size={11} aria-hidden="true"/> {action}
        </button>
      )}
    </div>
  </div>
);

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
  const state = stressState(stress);

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block" role="img" aria-label="Línea de estrés de las últimas 24 horas">
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1="20" x2={w-20} y1={20 + g*(h-40)} y2={20 + g*(h-40)} stroke="var(--border)" strokeDasharray="2 4"/>
        ))}
        <path d={d} stroke={state.hex} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={xFor(23)} cy={yFor(points[23])} r="5" fill={state.hex}/>
        <circle cx={xFor(23)} cy={yFor(points[23])} r="10" fill={state.hex} opacity="0.25"/>
        {[0, 6, 12, 18, 23].map(i => (
          <text key={i} x={xFor(i)} y={h - 4} textAnchor="middle" fontSize="10" fill="var(--ink-dim)" fontFamily="'Plus Jakarta Sans'">
            {i === 23 ? "Ahora" : `${i.toString().padStart(2,"0")}:00`}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ─── Barras semanales (punto 7) ───────────────────────────────────────────────
// Altura = nivel de calma promedio del día. Color semántico por nivel.
const WeekBars = ({ weeklyOverride }) => {
  const defaultWeekly = useMemo(() => getWeeklyData(), []);
  const weekly = Array.isArray(weeklyOverride) && weeklyOverride.length
    ? weeklyOverride
    : defaultWeekly;
  return (
    <div className="flex items-end gap-2.5 h-[120px]" role="img" aria-label="Patrón semanal de calma, de lunes a domingo">
      {weekly.map((d, i) => {
        const avgStress = Math.max(8, Math.min(95, Number.isFinite(d.avgStress) ? d.avgStress : 10));
        const calma = 100 - avgStress;
        const color = calmaColor(calma);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
            title={`${d.day}: ${calma} de calma`}
          >
            <div
              className="w-full rounded-md transition-[height,background] duration-500"
              style={{
                height: `${Math.max(8, calma)}%`,
                background: color,
                opacity: d.isToday ? 1 : 0.45,
                boxShadow: d.isToday ? `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${color}` : "none",
              }}
            />
            <div
              className="text-[11px]"
              style={{ color: d.isToday ? color : "var(--ink-dim)", fontWeight: d.isToday ? 700 : 400 }}
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

// ─── Modal de recomendación (tema claro, punto 9) ─────────────────────────────
const RecModal = ({ rec, state, onClose }) => {
  if (!rec) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm"
        style={{ animation: "simFadeIn 0.2s ease-out" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={rec.title}
        className="card fixed top-1/2 left-1/2 z-[10002] -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-32px))] p-6 sm:p-7"
        style={{
          border: `1px solid ${state.hex}40`,
          boxShadow: `0 32px 80px -16px rgba(0,0,0,0.25), 0 0 48px -20px ${state.hex}55`,
          animation: "recModalIn 0.25s cubic-bezier(.2,1.2,.4,1)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${state.hex}26, ${state.hex}0D)`,
                border: `1px solid ${state.hex}40`,
                color: state.hex,
              }}
            >
              {REC_MODAL_ICONS[rec.icon] || <IconSparkles size={20}/>}
            </div>
            <div>
              <div className="text-lg font-bold mb-0.5 text-ink">{rec.title}</div>
              <div
                className="inline-flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-0.5 font-semibold"
                style={{ color: state.hex, background: `${state.hex}1A` }}
              >
                {rec.duration}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-lg shrink-0 bg-surface border border-line text-ink-dim cursor-pointer flex items-center justify-center hover:bg-surface-strong transition-colors"
          >
            <IconX size={14} aria-hidden="true"/>
          </button>
        </div>

        <div
          className="px-3.5 py-3 rounded-xl mb-4 text-sm text-ink-muted leading-relaxed"
          style={{ background: `${state.hex}0D`, border: `1px solid ${state.hex}25` }}
        >
          {rec.detail}
        </div>

        <div className="text-[13px] text-ink-dim leading-relaxed">
          {rec.deepExplanation}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl border-0 font-semibold text-sm cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: state.hex, color: "var(--ink-on-accent)" }}
        >
          Entendido
        </button>
      </div>
      <style>{`
        @keyframes recModalIn {
          from { opacity:0; transform:translate(-50%,-48%) scale(0.95); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
        @keyframes simFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

// ─── Skeleton de ejercicios (punto 4) ─────────────────────────────────────────
const RecSkeleton = () => (
  <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Cargando recomendaciones">
    {[0, 1, 2].map(i => (
      <div key={i} className="p-3.5 rounded-xl bg-surface border border-line flex items-center gap-3.5">
        <div className="w-[38px] h-[38px] rounded-xl shrink-0 animate-pulse" style={{ background: "var(--surface-strong)" }}/>
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: "var(--surface-strong)" }}/>
          <div className="h-2.5 w-4/5 rounded animate-pulse" style={{ background: "var(--surface-strong)" }}/>
        </div>
      </div>
    ))}
  </div>
);

// ─── Panel de recomendaciones IA (punto 5: una sola alerta) ──────────────────
const RecommendationPanel = ({ stress, bpm, bpmResting, hourlyData }) => {
  const [recs, setRecs]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [isAI, setIsAI]               = useState(false);
  const [aiError, setAiError]         = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);

  const state     = stressState(stress);
  const stressKey = getStressKey(stress);

  // Refs para capturar los valores más recientes sin hacerlos dependencias del callback.
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

    const variability = delta >= 35 ? "muy variable" : delta >= 20 ? "con cambios visibles" : "bastante estable";
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
      if (!res.ok || data.fallback) throw new Error(data.error || `HTTP ${res.status}`);

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

  const offline = aiError && !isAI && !loading;

  return (
    <>
      <div className="card p-6 sm:p-7 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4 gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-brand mb-1.5">
              <IconSparkles size={12} aria-hidden="true"/> Recomendación IA
            </div>
            <h3 className="m-0 mb-2 font-display text-[26px] font-semibold tracking-tight text-ink">Para este momento</h3>
            {/* Único badge de estado clínico (no de conexión) */}
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider rounded-full px-2.5 py-1"
              style={{ color: phaseLabel.color, background: `${phaseLabel.color}1A` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: phaseLabel.color }} aria-hidden="true"/>
              {phaseLabel.text}
            </div>
          </div>
          <button
            onClick={() => fetchRecs(true)}
            disabled={loading}
            aria-label="Actualizar recomendaciones"
            className="shrink-0 bg-surface border border-line rounded-lg px-2.5 py-1.5 text-ink-muted text-xs inline-flex items-center gap-1.5 hover:bg-surface-strong transition disabled:opacity-70"
          >
            {loading
              ? <span className="w-2.5 h-2.5 border-[1.5px] border-line-strong border-t-brand rounded-full animate-spin inline-block"/>
              : <IconRefresh size={12} aria-hidden="true"/>
            }
            {loading ? "Consultando…" : "Actualizar"}
          </button>
        </div>

        {/* Punto 5: un único banner contextual cuando no hay conexión con la IA */}
        {offline && (
          <div className="mb-3.5 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-[12px]"
            style={{ background: `${SEMANTIC_COLORS.attention}14`, border: `1px solid ${SEMANTIC_COLORS.attention}40`, color: "var(--ink-muted)" }}>
            <IconAlertTriangle size={14} style={{ color: SEMANTIC_COLORS.attention }} aria-hidden="true"/>
            <span className="flex-1">Sin conexión — mostrando sugerencias guardadas.</span>
            <button
              onClick={() => fetchRecs(true)}
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: SEMANTIC_COLORS.attention }}
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <>
            <div className="mb-3.5 h-[78px] rounded-xl bg-surface border border-line animate-pulse"/>
            <RecSkeleton/>
          </>
        ) : (
          <>
            <div className="mb-3.5 px-4 py-3.5 rounded-xl bg-surface border border-line text-[13px] text-ink-muted leading-relaxed">
              <CardLabel>Resumen del día</CardLabel>
              <div className="mt-1.5 mb-1.5 font-medium text-ink">{narrative.summary}</div>
              <div>{narrative.recommendation}</div>
            </div>

            <div className="flex flex-col gap-2.5">
              {(recs || []).map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRec(r)}
                  aria-label={`${r.title} · ${r.duration}. Toca para ver la explicación completa.`}
                  className="group/rec text-left p-3.5 rounded-xl bg-surface border border-line flex items-center gap-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2"
                  style={{ "--tw-ring-color": `${state.hex}66` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${state.hex}66`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div
                    className="w-[38px] h-[38px] rounded-xl shrink-0 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${state.hex}26, ${state.hex}0D)`,
                      border: `1px solid ${state.hex}40`,
                      color: state.hex,
                    }}
                  >
                    {REC_LIST_ICONS[r.icon] || <IconSparkles size={18}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-0.5 text-ink">{r.title}</div>
                    <div className="text-[12px] text-ink-dim leading-snug">{r.detail}</div>
                  </div>
                  {/* Punto 8: chip de affordance, sólo visible en hover/focus */}
                  <span
                    className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 opacity-0 group-hover/rec:opacity-100 group-focus-visible/rec:opacity-100 transition-opacity"
                    style={{ color: state.hex, background: `${state.hex}1A` }}
                  >
                    Toca para expandir
                  </span>
                  <span className="text-[11px] text-ink-dim tabular-nums shrink-0">{r.duration}</span>
                  <IconChevronRight size={14} className="text-ink-faint shrink-0 group-hover/rec:translate-x-0.5 transition-transform" aria-hidden="true"/>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <RecModal rec={selectedRec} state={state} onClose={() => setSelectedRec(null)}/>
    </>
  );
};

// ─── Tarjeta del hub de navegación ───────────────────────────────────────────
const HubCard = ({ href, icon, title, desc, accent }) => (
  <Link
    href={href}
    className="group card p-5 h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md block no-underline text-inherit"
  >
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
      style={{ background: `${accent}1A`, color: accent }}
    >
      {icon}
    </div>
    <h3 className="text-[15px] font-semibold m-0 mb-1.5 tracking-tight text-ink">{title}</h3>
    <p className="text-[13px] text-ink-muted m-0 leading-snug">{desc}</p>
  </Link>
);

// ─── Sidebar expandible con avatar + menú (punto 6) ──────────────────────────
const Sidebar = ({ navItems, parentName, parentEmail, onSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (parentName?.[0] || "?").toUpperCase();

  return (
    <aside
      className="dashboard-sidebar group/sb hidden lg:flex fixed left-0 top-0 bottom-0 w-[72px] hover:w-[220px] z-30 flex-col py-6 px-3 border-r border-line transition-[width] duration-200 ease-out overflow-hidden"
      style={{ background: "var(--bg-elevated)" }}
    >
      <div className="flex items-center gap-2.5 px-2 mb-8 h-9">
        <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "linear-gradient(135deg, #2A9D8F, #6FD0C4)" }}/>
        <span className="font-bold text-[15px] tracking-tight text-ink opacity-0 group-hover/sb:opacity-100 transition-opacity whitespace-nowrap">CalmBand</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1" aria-label="Navegación principal">
        {navItems.map((x, k) => (
          <Link
            key={k}
            href={x.href}
            aria-label={x.label}
            aria-current={x.active ? "page" : undefined}
            className={`flex items-center gap-3 h-11 px-2.5 rounded-xl transition-colors no-underline ${
              x.active
                ? "bg-brand/12 border border-brand/25 text-brand"
                : "bg-transparent border border-transparent text-ink-dim hover:bg-surface hover:text-ink"
            }`}
          >
            <span className="shrink-0 flex items-center justify-center w-[22px]">{x.i}</span>
            <span className="text-sm font-medium opacity-0 group-hover/sb:opacity-100 transition-opacity whitespace-nowrap">{x.label}</span>
          </Link>
        ))}
      </nav>

      {/* Avatar + menú desplegable */}
      <div className="relative mt-2">
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} aria-hidden="true"/>
            <div
              className="card absolute bottom-full mb-2 left-0 w-[190px] p-1.5 z-10 shadow-lg"
              role="menu"
            >
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-muted hover:bg-surface no-underline transition-colors"
              >
                <IconUser size={15} aria-hidden="true"/> Perfil
              </Link>
              {!SIMULATION_ONLY && (
                <button
                  onClick={() => { setMenuOpen(false); onSignOut(); }}
                  role="menuitem"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-surface transition-colors"
                  style={{ color: SEMANTIC_COLORS.danger }}
                >
                  <IconLogOut size={15} aria-hidden="true"/> Cerrar sesión
                </button>
              )}
            </div>
          </>
        )}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Menú de usuario"
          className="w-full flex items-center gap-3 h-12 px-1.5 rounded-xl hover:bg-surface transition-colors cursor-pointer"
        >
          <span
            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-semibold text-sm text-ink-on-accent"
            style={{ background: "linear-gradient(135deg, #2A9D8F, #6FD0C4)" }}
          >
            {initial}
          </span>
          <span className="flex-1 min-w-0 text-left opacity-0 group-hover/sb:opacity-100 transition-opacity">
            <span className="block text-[13px] font-semibold text-ink truncate">{parentName}</span>
            <span className="block text-[11px] text-ink-dim truncate">{parentEmail}</span>
          </span>
          <IconChevronDown
            size={14}
            className={`shrink-0 text-ink-dim opacity-0 group-hover/sb:opacity-100 transition-all ${menuOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </aside>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardClient({ user, profile }) {
  const router = useRouter();
  const { supabase } = useAuth();
  const sim = useSimulation();
  const [baseStress, setBaseStress] = useState(35);
  const [baseHourlyData, setBaseHourlyData] = useState(null);
  const [baseBpm, setBaseBpm] = useState(72);
  const [connection, setConnection] = useState("disconnected");
  const [greeting, setGreeting] = useState("Hola");
  const lastHeartbeatRef = useRef(0);

  useEffect(() => {
    setBaseStress(getCurrentStress());
    setBaseHourlyData(generate24hHistory());
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");

    // Deriva el nivel de conexión (punto 1) según la antigüedad del último latido.
    const checkStatus = () => {
      const age = Date.now() - lastHeartbeatRef.current;
      setConnection(age < 120000 ? "connected" : age < 600000 ? "partial" : "disconnected");
    };

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
        setConnection("connected");
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
  const parentEmail = profile?.email || user?.email || PARENT_PROFILE.email;
  const avgBpm = sim.active ? (simData?.bpm || 72) : baseBpm + Math.floor(stress / 5);

  // Nivel de conexión efectivo: durante la simulación se considera conectado.
  const connectionLevel = sim.active ? "connected" : connection;
  const lastReading = sim.active ? Date.now() : (lastHeartbeatRef.current || null);

  // Calma de hoy + delta vs. ayer (punto 3).
  const calmaHoy = Math.round(100 - stress * 0.95);
  const weeklyForDelta = simWeekly || getWeeklyData();
  const calmaAyer = useMemo(() => {
    const todayIdx = weeklyForDelta.findIndex(d => d.isToday);
    const yIdx = todayIdx > 0 ? todayIdx - 1 : weeklyForDelta.length - 1;
    const y = weeklyForDelta[yIdx];
    return y ? 100 - y.avgStress : calmaHoy;
  }, [weeklyForDelta, calmaHoy]);
  const calmaDelta = calmaHoy - calmaAyer;

  const handleSignOut = async () => {
    if (SIMULATION_ONLY) return;
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const handleResetBaseBpm = () => setBaseBpm(Math.round(65 + Math.random() * 12));

  const navItems = [
    { i: <IconHome size={18}/>,     active: true,  label: "Dashboard",       href: "/dashboard" },
    { i: <IconHeart size={18}/>,    active: false, label: `Vista de ${CHILD_PROFILE.name}`, href: "/kids" },
    { i: <IconChart size={18}/>,    active: false, label: "Historial",       href: "/history" },
    { i: <IconCalendar size={18}/>, active: false, label: "Horario",         href: "/schedule" },
    { i: <IconWatch size={18}/>,    active: false, label: "Conexión",        href: "/pairing" },
    { i: <IconSettings size={18}/>, active: false, label: "Ajustes",         href: "/settings" },
  ];

  return (
    <div className="min-h-screen text-ink relative overflow-hidden bg-bg">

      <Sidebar
        navItems={navItems}
        parentName={parentName}
        parentEmail={parentEmail}
        onSignOut={handleSignOut}
      />

      {/* Contenido principal */}
      <main className="dashboard-main relative z-[2] max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 lg:ml-[72px] py-6 sm:py-8 lg:py-10 pb-24">

        {/* Barra superior */}
        <div className="flex flex-col gap-5 mb-8 sm:mb-10">
          <div className="flex flex-col gap-2">
            <CardLabel className="tracking-[0.22em]">{greeting} · {parentName}</CardLabel>
            <h1
              className="font-display font-medium m-0 leading-[1.02]"
              style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", letterSpacing: "-0.025em" }}
            >
              Así está <span className="text-brand font-bold">{CHILD_PROFILE.name}</span> hoy.
            </h1>
          </div>

          {/* Estado de conexión unificado + acciones (punto 1) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <ConnectionStatus level={connectionLevel}/>
            {sim.active && (
              <Pill dot={state.hex}>Simulando · {sim.getTimeLabel()}</Pill>
            )}
            <Link
              href="/kids"
              className="ml-auto sm:ml-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium no-underline text-brand bg-brand/10 border border-brand/25 hover:bg-brand/20 hover:border-brand/40 transition-colors"
            >
              Abrir vista de {CHILD_PROFILE.name} <IconArrowRight size={12} aria-hidden="true"/>
            </Link>
            <div
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-semibold text-sm shrink-0 text-ink-on-accent"
              style={{ background: CHILD_PROFILE.avatarGradient }}
              title={CHILD_PROFILE.name}
              aria-label={`Avatar de ${CHILD_PROFILE.name}`}
            >
              {CHILD_PROFILE.avatar}
            </div>
          </div>
        </div>

        {/* Fila 1: Métricas + Recomendaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 lg:gap-6 mb-5 lg:mb-6">
          <div className="flex flex-col gap-4">
            <MetricCard
              label="Nivel de calma · hoy"
              value={calmaHoy}
              unit="/ 100"
              valueColor={calmaColor(calmaHoy)}
              delta={{
                up: calmaDelta >= 0,
                text: `${Math.abs(calmaDelta)} vs ayer`,
                color: calmaDelta >= 0 ? SEMANTIC_COLORS.calm : SEMANTIC_COLORS.attention,
              }}
              scale={{
                min: 0, max: 100, value: calmaHoy,
                zones: [
                  { from: 0,  to: 40,  color: SEMANTIC_COLORS.danger },
                  { from: 40, to: 65,  color: SEMANTIC_COLORS.attention },
                  { from: 65, to: 100, color: SEMANTIC_COLORS.calm },
                ],
              }}
              timestamp={relativeTime(lastReading)}
            />
            <MetricCard
              label="Ritmo cardíaco"
              value={avgBpm}
              unit="lpm"
              valueColor={bpmColor(avgBpm)}
              scale={{
                min: 40, max: 140, value: avgBpm,
                zones: [
                  { from: 20, to: 60, color: SEMANTIC_COLORS.calm },     // 60-100 lpm = rango normal
                ],
              }}
              timestamp={relativeTime(lastReading)}
              action="Guardar base"
              onAction={handleResetBaseBpm}
            />
            <MetricCard
              label="Sueño"
              value={(sim.active ? sim.weekData[sim.currentDay]?.summary.sleepHours : null) ?? "8h 20m"}
              valueColor="var(--ink)"
              timestamp="anoche"
            />
          </div>
          <RecommendationPanel
            stress={stress}
            bpm={avgBpm}
            bpmResting={CHILD_PROFILE.bpmResting}
            hourlyData={hourlyData}
          />
        </div>

        {/* Fila 2: Gráfico 24h */}
        <div className="card p-6 sm:p-7 mb-5 lg:mb-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <CardLabel>Últimas 24 horas</CardLabel>
              <h3 className="m-0 mt-1 font-display text-[26px] font-semibold tracking-tight text-ink">Línea del día</h3>
            </div>
          </div>
          <StressChart stress={stress} hourlyData={hourlyData}/>
        </div>

        {/* Fila 3: Semana + Actividad */}
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-5 lg:gap-6 mb-5 lg:mb-6">
          <div className="card p-6 sm:p-7">
            <div className="flex justify-between items-start mb-5 gap-3">
              <div>
                <CardLabel>Esta semana</CardLabel>
                <h3 className="m-0 mt-1 font-display text-[26px] font-semibold tracking-tight text-ink">Patrón semanal</h3>
              </div>
              <Pill>{state.label}</Pill>
            </div>
            <WeekBars weeklyOverride={simWeekly}/>
            <div className="mt-5 px-3.5 py-3 rounded-xl bg-surface border border-line text-[13px] text-ink-muted leading-relaxed">
              <strong className="text-ink">Observación:</strong> las barras altas indican días de mayor calma. A mitad de semana hubo más tensión, con una recuperación progresiva hacia el fin de semana.
            </div>
          </div>

          <div className="card p-6 sm:p-7">
            <CardLabel>Actividad</CardLabel>
            <h3 className="m-0 mt-1 mb-4 font-display text-[26px] font-semibold tracking-tight text-ink">Hoy</h3>
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
                    <div className="text-[12px] text-ink-dim tabular-nums w-11 shrink-0">{x.time}</div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${accent}1A`, color: accent }}
                    >
                      {ACTIVITY_ICONS[x.icon] || <IconHeart size={14}/>}
                    </div>
                    <div className="text-[13px] text-ink-muted flex-1 min-w-0 font-medium">{label}</div>
                  </div>
                );
              })}
              {sim.active && simEvents && simEvents.length === 0 && (
                <div className="text-[13px] text-ink-dim italic">Esperando eventos…</div>
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
