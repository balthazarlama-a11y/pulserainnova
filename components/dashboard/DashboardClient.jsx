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
import { usePeople } from "@/lib/peopleContext";
import { RECOMMENDATIONS } from "@/lib/recommendationsFallback";
import { getStressKey, normalizeAccent, SEMANTIC_COLORS } from "@/lib/utils";
import {
  stressFromCalma, fetchLatestSession, fetch24hSessions, toStressSeries,
  fetchWeeklyData, fetchTodayActivity,
} from "@/lib/biometria";

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

// ─── Sistema tipográfico ──────────────────────────────────────────────────────
const CardLabel = ({ children, ...rest }) => (
  <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-dim" {...rest}>
    {children}
  </div>
);

// ─── Paleta semántica única ───────────────────────────────────────────────────
const calmaColor = (calma) =>
  calma >= 65 ? SEMANTIC_COLORS.calm
  : calma >= 40 ? SEMANTIC_COLORS.attention
  : SEMANTIC_COLORS.danger;

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

// ─── Indicador de conexión unificado ──────────────────────────────────────────
const CONNECTION_CONFIG = {
  connected: {
    color: SEMANTIC_COLORS.calm, Icon: IconWifi,
    label: "Conectado", desc: "Pulsera y WiFi activos",
  },
  partial: {
    color: SEMANTIC_COLORS.attention, Icon: IconWifi,
    label: "Parcial", desc: "Sin lecturas recientes",
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
      style={{ background: `${cfg.color}1A`, border: `1px solid ${cfg.color}40`, color: cfg.color }}
    >
      <Icon size={13} aria-hidden="true"/>
      {cfg.label}
      <span className="hidden sm:inline font-normal opacity-80">· {cfg.desc}</span>
    </span>
  );
};

// ─── Barra de rango ───────────────────────────────────────────────────────────
const RangeBar = ({ min, max, value, zones, markerColor }) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="relative h-1.5 rounded-full my-3" style={{ background: "var(--surface-strong)" }}>
      {(zones || []).map((z, i) => (
        <div key={i} className="absolute top-0 bottom-0"
          style={{ left: `${z.from}%`, width: `${z.to - z.from}%`, background: `${z.color}40` }}/>
      ))}
      <div className="absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2"
        style={{ left: `${pct}%`, background: markerColor, boxShadow: "0 0 0 2px var(--bg-elevated)" }}/>
    </div>
  );
};

// ─── Sub-métrica (pie de la tarjeta de estado) ───────────────────────────────
const SubStat = ({ label, value, unit, color }) => (
  <div className="min-w-0">
    <CardLabel>{label}</CardLabel>
    <div className="mt-1.5 flex items-baseline gap-1">
      <span className="font-display font-bold text-[22px] leading-none tracking-tight truncate"
        style={{ color: color || "var(--ink)" }}>
        {value}
      </span>
      {unit && <span className="text-[12px] font-medium text-ink-dim">{unit}</span>}
    </div>
  </div>
);

// ─── Tarjeta de estado (jerarquía principal: nivel de calma en vivo) ──────────
const HeroStatus = ({ nombre, hasReading, calma, calmaDelta, bpm, sleep, state, lastReading }) => {
  const calmaC = hasReading ? calmaColor(calma) : "var(--ink-dim)";
  const deltaC = calmaDelta >= 0 ? SEMANTIC_COLORS.calm : SEMANTIC_COLORS.attention;
  return (
    <div className="card p-6 sm:p-7 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-brand">
          <IconActivity size={12} aria-hidden="true"/> Estado ahora
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-dim">
          <IconClock size={11} aria-hidden="true"/> {relativeTime(lastReading)}
        </span>
      </div>

      {hasReading ? (
        <>
          <div className="flex items-end gap-3 mb-1">
            <span className="font-display font-bold leading-[0.82] tracking-tight"
              style={{ fontSize: "clamp(3.4rem, 9vw, 4.6rem)", color: calmaC }}>
              {calma}
            </span>
            <div className="pb-1.5 flex flex-col gap-1.5 min-w-0">
              <span className="text-[13px] text-ink-dim font-medium">
                de calma <span className="text-ink-faint">/ 100</span>
              </span>
              {calmaDelta != null && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit"
                  style={{ color: deltaC, background: `${deltaC}1A` }}
                  title="Cambio respecto a ayer">
                  <span aria-hidden="true">{calmaDelta >= 0 ? "▲" : "▼"}</span>
                  {Math.abs(calmaDelta)} vs ayer
                </span>
              )}
            </div>
          </div>
          <RangeBar min={0} max={100} value={calma} markerColor={calmaC}
            zones={[
              { from: 0,  to: 40,  color: SEMANTIC_COLORS.danger },
              { from: 40, to: 65,  color: SEMANTIC_COLORS.attention },
              { from: 65, to: 100, color: SEMANTIC_COLORS.calm },
            ]}/>
          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-2.5 py-1 w-fit mt-1"
            style={{ color: state.hex, background: `${state.hex}1A` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: state.hex }} aria-hidden="true"/>
            {state.label}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3 py-4">
          <div className="flex items-center gap-2.5 text-ink-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-brand"
              style={{ animation: "simPulseSmall 1.6s ease-in-out infinite" }} aria-hidden="true"/>
            <span className="text-sm font-semibold">Esperando la primera lectura…</span>
          </div>
          <p className="text-[13px] text-ink-faint leading-relaxed">
            Cuando la pulsera de {nombre || "la persona"} envíe datos, verás aquí su nivel de calma en vivo.
          </p>
        </div>
      )}

      <div className="mt-auto pt-5 border-t border-line grid grid-cols-2 gap-4">
        <SubStat label="Ritmo cardíaco" value={bpm != null ? bpm : "—"}
          unit={bpm != null ? "lpm" : null} color={bpm != null ? bpmColor(bpm) : "var(--ink-dim)"}/>
        <SubStat label="Sueño" value={sleep || "—"}/>
      </div>
    </div>
  );
};

// ─── Gráfico 24h (serie real, escala temporal) ────────────────────────────────
const StressChart = ({ series }) => {
  const w = 640, h = 180;
  const lm = 52, rm = 20, tm = 20, bm = 20;
  const now = Date.now();
  const start = now - 24 * 3600000;
  const xFor = (t) => lm + ((t - start) / (now - start)) * (w - lm - rm);
  const yFor = (v) => h - bm - (v / 100) * (h - tm - bm);

  const pts = (series || []).filter((p) => p.stress != null);
  const last = pts[pts.length - 1];
  const state = stressState(last ? last.stress : 30);
  const d = pts.map((p, i) => (i ? "L" : "M") + xFor(p.t.getTime()) + " " + yFor(p.stress)).join(" ");

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block" role="img" aria-label="Línea de nivel cardiaco de las últimas 24 horas">
        <text x={8} y={h / 2} textAnchor="middle" fontSize="9" fill="var(--ink-dim)"
          fontFamily="'Plus Jakarta Sans'" transform={`rotate(-90, 8, ${h / 2})`}>
          Nivel cardiaco
        </text>
        {[75, 50, 25].map(val => {
          const y = yFor(val);
          return (
            <g key={val}>
              <line x1={lm} x2={w - rm} y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 4"/>
              <text x={lm - 4} y={y + 3.5} textAnchor="end" fontSize="9" fill="var(--ink-dim)" fontFamily="'Plus Jakarta Sans'">
                {val}
              </text>
            </g>
          );
        })}
        {pts.length > 1 && (
          <path d={d} stroke={state.hex} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {pts.map((p, i) => (
          <circle key={i} cx={xFor(p.t.getTime())} cy={yFor(p.stress)} r={i === pts.length - 1 ? 5 : 2.5} fill={state.hex}/>
        ))}
        {["−24h", "−18h", "−12h", "−6h", "Ahora"].map((lbl, i) => (
          <text key={i} x={lm + (i / 4) * (w - lm - rm)} y={h - 4} textAnchor="middle" fontSize="10" fill="var(--ink-dim)" fontFamily="'Plus Jakarta Sans'">
            {lbl}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ─── Barras semanales ─────────────────────────────────────────────────────────
const WeekBars = ({ weekly }) => (
  <div className="flex items-end gap-2.5 h-[120px]" role="img" aria-label="Patrón semanal de calma, de lunes a domingo">
    {(weekly || []).map((d, i) => {
      const hasData = Number.isFinite(d.avgStress);
      const calma = hasData ? 100 - d.avgStress : 0;
      const color = hasData ? calmaColor(calma) : "var(--surface-strong)";
      return (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
          title={hasData ? `${d.day}: ${calma} de calma` : `${d.day}: sin datos`}>
          <div className="w-full rounded-md transition-[height,background] duration-500"
            style={{
              height: `${Math.max(6, calma)}%`,
              background: color,
              opacity: hasData ? (d.isToday ? 1 : 0.45) : 0.25,
              boxShadow: d.isToday && hasData ? `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${color}` : "none",
            }}/>
          <div className="text-[11px]"
            style={{ color: d.isToday && hasData ? color : "var(--ink-dim)", fontWeight: d.isToday ? 700 : 400 }}>
            {d.day}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Modal de recomendación ───────────────────────────────────────────────────
const RecModal = ({ rec, state, onClose }) => {
  if (!rec) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm" style={{ animation: "simFadeIn 0.2s ease-out" }}/>
      <div role="dialog" aria-modal="true" aria-label={rec.title}
        className="card fixed top-1/2 left-1/2 z-[10002] -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-32px))] p-6 sm:p-7"
        style={{
          border: `1px solid ${state.hex}40`,
          boxShadow: `0 32px 80px -16px rgba(0,0,0,0.25), 0 0 48px -20px ${state.hex}55`,
          animation: "recModalIn 0.25s cubic-bezier(.2,1.2,.4,1)",
        }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${state.hex}26, ${state.hex}0D)`, border: `1px solid ${state.hex}40`, color: state.hex }}>
              {REC_MODAL_ICONS[rec.icon] || <IconSparkles size={20}/>}
            </div>
            <div>
              <div className="text-lg font-bold mb-0.5 text-ink">{rec.title}</div>
              <div className="inline-flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-0.5 font-semibold"
                style={{ color: state.hex, background: `${state.hex}1A` }}>
                {rec.duration}
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            className="w-8 h-8 rounded-lg shrink-0 bg-surface border border-line text-ink-dim cursor-pointer flex items-center justify-center hover:bg-surface-strong transition-colors">
            <IconX size={14} aria-hidden="true"/>
          </button>
        </div>

        <div className="px-3.5 py-3 rounded-xl mb-4 text-sm text-ink-muted leading-relaxed"
          style={{ background: `${state.hex}0D`, border: `1px solid ${state.hex}25` }}>
          {rec.detail}
        </div>

        <div className="text-[13px] text-ink-dim leading-relaxed">{rec.deepExplanation}</div>

        <button onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl border-0 font-semibold text-sm cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: state.hex, color: "var(--ink-on-accent)" }}>
          Entendido
        </button>
      </div>
      <style>{`
        @keyframes recModalIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.95); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes simFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

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

// ─── Panel de recomendaciones IA ──────────────────────────────────────────────
const RecommendationPanel = ({ stress, bpm, bpmResting, series, childName, childAge }) => {
  const [recs, setRecs]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [isAI, setIsAI]               = useState(false);
  const [aiError, setAiError]         = useState(null);
  const [needsNewKey, setNeedsNewKey] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);

  const state     = stressState(stress);
  const stressKey = getStressKey(stress);

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
    const valid = (series || []).map(p => p.stress).filter(v => Number.isFinite(v));
    if (!valid.length) {
      return {
        summary: "Aún no hay lecturas suficientes de la pulsera para describir el día.",
        recommendation: "Recomendación: mantener pausas breves de respiración antes de momentos exigentes.",
      };
    }
    const maxVal = Math.max(...valid);
    const minVal = Math.min(...valid);
    const delta = maxVal - minVal;
    const variability = delta >= 35 ? "muy variable" : delta >= 20 ? "con cambios visibles" : "bastante estable";
    const summary = `Hoy el estrés estuvo ${variability}, entre ${minVal} y ${maxVal} sobre 100.`;
    const recommendation = {
      calm: "Recomendación: mantener rutinas suaves y pausas activas cortas.",
      mild: "Recomendación: anticipar pausas de respiración antes de momentos exigentes.",
      moderate: "Recomendación: reforzar ejercicios guiados cuando suba la tensión.",
      high: "Recomendación: priorizar un espacio seguro y respiración guiada ante picos de estrés.",
    }[stressKey] || "Recomendación: sostener pausas de respiración para regular el ritmo.";
    return { summary, recommendation };
  }, [series, stressKey]);

  const fetchRecs = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < COOLDOWN_MS) return;

    setLoading(true);
    setAiError(null);
    setNeedsNewKey(false);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stress:     stressRef.current,
          bpm:        bpmRef.current ?? 80,
          bpmResting: bpmResting ?? 78,
          stressKey,
          childName:  childName || "la persona",
          childAge:   childAge ?? "",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.fallback) {
        const err = new Error(data.error || `HTTP ${res.status}`);
        err.needNewKey = Boolean(data.needNewKey);
        throw err;
      }

      setRecs(data.recommendations);
      setIsAI(true);
    } catch (err) {
      console.warn("[RecommendationPanel] Fallback local:", err.message);
      setAiError(err.message);
      setNeedsNewKey(Boolean(err.needNewKey));
      setRecs(RECOMMENDATIONS[stressKey] || RECOMMENDATIONS.mild);
      setIsAI(false);
    } finally {
      // Aplica el cooldown también tras un fallo: evita reintentos en ráfaga
      // (y límites de uso de NVIDIA) cuando los datos en vivo cambian seguido.
      lastFetchRef.current = Date.now();
      setLoading(false);
    }
  }, [stressKey, bpmResting, childName, childAge]);

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
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider rounded-full px-2.5 py-1"
              style={{ color: phaseLabel.color, background: `${phaseLabel.color}1A` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: phaseLabel.color }} aria-hidden="true"/>
              {phaseLabel.text}
            </div>
          </div>
          <button onClick={() => fetchRecs(true)} disabled={loading} aria-label="Actualizar recomendaciones"
            className="shrink-0 bg-surface border border-line rounded-lg px-2.5 py-1.5 text-ink-muted text-xs inline-flex items-center gap-1.5 hover:bg-surface-strong transition disabled:opacity-70">
            {loading
              ? <span className="w-2.5 h-2.5 border-[1.5px] border-line-strong border-t-brand rounded-full animate-spin inline-block"/>
              : <IconRefresh size={12} aria-hidden="true"/>}
            {loading ? "Consultando…" : "Actualizar"}
          </button>
        </div>

        {offline && (
          <div className="mb-3.5 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-[12px]"
            style={{
              background: needsNewKey ? "rgba(220, 77, 85, 0.12)" : `${SEMANTIC_COLORS.attention}14`,
              border: needsNewKey ? "1px solid rgba(220, 77, 85, 0.35)" : `1px solid ${SEMANTIC_COLORS.attention}40`,
              color: "var(--ink-muted)",
            }}>
            <IconAlertTriangle size={14} style={{ color: needsNewKey ? SEMANTIC_COLORS.danger : SEMANTIC_COLORS.attention }} aria-hidden="true"/>
            <span className="flex-1">
              {needsNewKey
                ? "La clave de NVIDIA no funcionó. Pegá otra en .env.local y reiniciá el servidor."
                : "Sin conexión — mostrando sugerencias guardadas."}
            </span>
            <button onClick={() => fetchRecs(true)} className="font-semibold underline-offset-2 hover:underline" style={{ color: SEMANTIC_COLORS.attention }}>
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
                <button key={i} onClick={() => setSelectedRec(r)}
                  aria-label={`${r.title} · ${r.duration}. Toca para ver la explicación completa.`}
                  className="group/rec text-left p-3.5 rounded-xl bg-surface border border-line flex items-center gap-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2"
                  style={{ "--tw-ring-color": `${state.hex}66` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${state.hex}66`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                  <div className="w-[38px] h-[38px] rounded-xl shrink-0 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${state.hex}26, ${state.hex}0D)`, border: `1px solid ${state.hex}40`, color: state.hex }}>
                    {REC_LIST_ICONS[r.icon] || <IconSparkles size={18}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-0.5 text-ink">{r.title}</div>
                    <div className="text-[12px] text-ink-dim leading-snug">{r.detail}</div>
                  </div>
                  <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 opacity-0 group-hover/rec:opacity-100 group-focus-visible/rec:opacity-100 transition-opacity"
                    style={{ color: state.hex, background: `${state.hex}1A` }}>
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
  <Link href={href} className="group card p-5 h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md block no-underline text-inherit">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
      style={{ background: `${accent}1A`, color: accent }}>
      {icon}
    </div>
    <h3 className="text-[15px] font-semibold m-0 mb-1.5 tracking-tight text-ink">{title}</h3>
    <p className="text-[13px] text-ink-muted m-0 leading-snug">{desc}</p>
  </Link>
);

// ─── Selector de persona ──────────────────────────────────────────────────────
const PersonSwitcher = ({ people, selectedId, onSelect }) => {
  if (people.length <= 1) return null;
  return (
    <select
      value={selectedId || ""}
      onChange={(e) => onSelect(e.target.value)}
      aria-label="Cambiar de persona"
      className="bg-surface border border-line rounded-xl px-3 py-2 text-[13px] text-ink cursor-pointer focus:outline-none focus:border-brand/50"
    >
      {people.map((p) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ navItems, parentName, parentEmail, onSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (parentName?.[0] || "?").toUpperCase();

  return (
    <aside className="dashboard-sidebar group/sb hidden lg:flex fixed left-0 top-0 bottom-0 w-[72px] hover:w-[220px] z-30 flex-col py-6 px-3 border-r border-line transition-[width] duration-200 ease-out overflow-hidden"
      style={{ background: "var(--bg-elevated)" }}>
      <div className="flex items-center gap-2.5 px-2 mb-8 h-9">
        <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "linear-gradient(135deg, #2A9D8F, #6FD0C4)" }}/>
        <span className="font-bold text-[15px] tracking-tight text-ink opacity-0 group-hover/sb:opacity-100 transition-opacity whitespace-nowrap">CalmBand</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1" aria-label="Navegación principal">
        {navItems.map((x, k) => (
          <Link key={k} href={x.href} aria-label={x.label} aria-current={x.active ? "page" : undefined}
            className={`flex items-center gap-3 h-11 px-2.5 rounded-xl transition-colors no-underline ${
              x.active ? "bg-brand/12 border border-brand/25 text-brand"
                : "bg-transparent border border-transparent text-ink-dim hover:bg-surface hover:text-ink"}`}>
            <span className="shrink-0 flex items-center justify-center w-[22px]">{x.i}</span>
            <span className="text-sm font-medium opacity-0 group-hover/sb:opacity-100 transition-opacity whitespace-nowrap">{x.label}</span>
          </Link>
        ))}
      </nav>

      <div className="relative mt-2">
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} aria-hidden="true"/>
            <div className="card absolute bottom-full mb-2 left-0 w-[190px] p-1.5 z-10 shadow-lg" role="menu">
              <Link href="/settings" role="menuitem" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-muted hover:bg-surface no-underline transition-colors">
                <IconUser size={15} aria-hidden="true"/> Perfil
              </Link>
              <button onClick={() => { setMenuOpen(false); onSignOut(); }} role="menuitem"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-surface transition-colors"
                style={{ color: SEMANTIC_COLORS.danger }}>
                <IconLogOut size={15} aria-hidden="true"/> Cerrar sesión
              </button>
            </div>
          </>
        )}
        <button onClick={() => setMenuOpen(o => !o)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Menú de usuario"
          className="w-full flex items-center gap-3 h-12 px-1.5 rounded-xl hover:bg-surface transition-colors cursor-pointer">
          <span className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-semibold text-sm text-ink-on-accent"
            style={{ background: "linear-gradient(135deg, #2A9D8F, #6FD0C4)" }}>
            {initial}
          </span>
          <span className="flex-1 min-w-0 text-left opacity-0 group-hover/sb:opacity-100 transition-opacity">
            <span className="block text-[13px] font-semibold text-ink truncate">{parentName}</span>
            <span className="block text-[11px] text-ink-dim truncate">{parentEmail}</span>
          </span>
          <IconChevronDown size={14}
            className={`shrink-0 text-ink-dim opacity-0 group-hover/sb:opacity-100 transition-all ${menuOpen ? "rotate-180" : ""}`}
            aria-hidden="true"/>
        </button>
      </div>
    </aside>
  );
};

const NAV_ITEMS = (active) => [
  { i: <IconHome size={18}/>,     active: active === "dashboard", label: "Dashboard", href: "/dashboard" },
  { i: <IconHeart size={18}/>,    active: active === "kids",      label: "Vista persona", href: "/kids" },
  { i: <IconChart size={18}/>,    active: active === "history",   label: "Historial", href: "/history" },
  { i: <IconCalendar size={18}/>, active: active === "schedule",  label: "Horario", href: "/schedule" },
  { i: <IconWatch size={18}/>,    active: active === "pairing",   label: "Conexión", href: "/pairing" },
  { i: <IconSettings size={18}/>, active: active === "settings",  label: "Ajustes", href: "/settings" },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardClient({ user, profile }) {
  const router = useRouter();
  const { supabase } = useAuth();
  const { people, selectedPerson, selectedId, selectPerson, loading: peopleLoading } = usePeople();

  const [stress, setStress] = useState(null);
  const [bpm, setBpm] = useState(null);
  const [series, setSeries] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [activity, setActivity] = useState([]);
  const [connection, setConnection] = useState("disconnected");
  const [greeting, setGreeting] = useState("Hola");
  const lastHeartbeatRef = useRef(0);
  const lastBiometricRef = useRef(0);

  const ninoId = selectedPerson?.id || null;

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
  }, []);

  // Carga de datos reales para la persona seleccionada + realtime.
  useEffect(() => {
    if (!ninoId) {
      setStress(null); setBpm(null); setSeries([]); setWeekly([]); setActivity([]);
      setConnection("disconnected");
      lastHeartbeatRef.current = 0;
      lastBiometricRef.current = 0;
      return;
    }

    let active = true;

    const checkStatus = () => {
      const age = Date.now() - lastHeartbeatRef.current;
      if (!lastHeartbeatRef.current) { setConnection("disconnected"); return; }
      setConnection(age < 120000 ? "connected" : age < 600000 ? "partial" : "disconnected");
      
      // Si pasan más de 20 segundos sin una lectura nueva real, asumimos que no hay dedo
      if (Date.now() - lastBiometricRef.current > 20000) {
        setBpm(null); // Ocultar pulsaciones hasta que vuelva a detectar pulso
      }
    };

    const loadAll = async () => {
      const latest = await fetchLatestSession(supabase, ninoId);
      if (!active) return;

      if (latest?.timestamp) {
        lastHeartbeatRef.current = new Date(latest.timestamp).getTime();
        lastBiometricRef.current = lastHeartbeatRef.current;
        if (latest.bpm != null) setBpm(latest.bpm);
        const s = stressFromCalma(latest.nivel_calma);
        if (s != null) setStress(s);
        checkStatus();
      } else {
        setStress(null); setBpm(null);
        setConnection("disconnected");
      }

      Promise.allSettled([
        fetch24hSessions(supabase, ninoId),
        fetchWeeklyData(supabase, ninoId),
        fetchTodayActivity(supabase, ninoId),
      ]).then(([sessionsRes, weekRes, actsRes]) => {
        if (!active) return;
        if (sessionsRes.status === "fulfilled") setSeries(toStressSeries(sessionsRes.value));
        if (weekRes.status === "fulfilled") setWeekly(weekRes.value);
        if (actsRes.status === "fulfilled") setActivity(actsRes.value);
      });
    };
    loadAll();

    const interval = setInterval(checkStatus, 30000);

    let channel;
    const setupRealtime = () => {
      if (channel) supabase.removeChannel(channel);
      channel = supabase
        .channel(`biometria-${ninoId}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "sesiones_biometria", filter: `niño_id=eq.${ninoId}` },
          (payload) => {
            lastHeartbeatRef.current = Date.now();
            lastBiometricRef.current = Date.now();
            setConnection("connected");
            if (payload.new.bpm != null) setBpm(payload.new.bpm);
            const s = stressFromCalma(payload.new.nivel_calma);
            if (s != null) {
              setStress(s);
              setSeries((prev) => [...prev, { t: new Date(), stress: s, bpm: payload.new.bpm ?? null }]);
            }
          })
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "dispositivos", filter: `niño_id=eq.${ninoId}` },
          (payload) => {
            // Latido de presencia (cuando la pulsera manda datos sin biometría o actualiza last_seen)
            lastHeartbeatRef.current = Date.now();
            setConnection("connected");
          })
        .subscribe((status, err) => {
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            if (active) setTimeout(setupRealtime, 5000); // Reintento automático
          }
        });
    };
    setupRealtime();

    return () => {
      active = false;
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, ninoId]);

  const hasReading = stress != null;
  const state = stressState(hasReading ? stress : 30);
  const parentName = profile?.display_name || profile?.nombre || user?.email?.split("@")[0] || "Cuidador";
  const parentEmail = profile?.email || user?.email || "";

  const calmaHoy = hasReading ? Math.round(100 - stress * 0.95) : null;
  const calmaAyer = useMemo(() => {
    const todayIdx = weekly.findIndex(d => d.isToday);
    const yIdx = todayIdx > 0 ? todayIdx - 1 : weekly.length - 1;
    const y = weekly[yIdx];
    return y && Number.isFinite(y.avgStress) ? 100 - y.avgStress : null;
  }, [weekly]);
  const calmaDelta = (calmaHoy != null && calmaAyer != null) ? calmaHoy - calmaAyer : null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const lastReading = lastHeartbeatRef.current || null;

  // ── Estado vacío: no hay ninguna persona/pulsera vinculada ──────────────────
  if (!peopleLoading && people.length === 0) {
    return (
      <div className="min-h-screen text-ink relative overflow-hidden bg-bg">
        <Sidebar navItems={NAV_ITEMS("dashboard")} parentName={parentName} parentEmail={parentEmail} onSignOut={handleSignOut}/>
        <main className="dashboard-main relative z-[2] max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 lg:ml-[72px] py-6 sm:py-8 lg:py-10 pb-24">
          <div className="flex flex-col gap-2 mb-10">
            <CardLabel className="tracking-[0.22em]">{greeting} · {parentName}</CardLabel>
            <h1 className="font-display font-medium m-0 leading-[1.02]"
              style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", letterSpacing: "-0.025em" }}>
              Conecta tu primera <span className="text-brand font-bold">pulsera</span>.
            </h1>
          </div>
          <div className="card p-8 sm:p-10 max-w-[560px] flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-brand"
              style={{ background: "rgba(42,157,143,0.12)", border: "1px solid rgba(42,157,143,0.25)" }}>
              <IconWatch size={30}/>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Aún no hay datos</h2>
              <p className="text-sm text-ink-muted leading-relaxed max-w-[400px]">
                Vincula una pulsera CalmBand a una persona para empezar a ver su nivel de calma,
                ritmo cardíaco y recomendaciones en tiempo real.
              </p>
            </div>
            <Link href="/pairing"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[15px] font-semibold no-underline"
              style={{ background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)", color: "#0D0824", boxShadow: "0 8px 24px -6px rgba(184,164,255,0.5)" }}>
              <IconWatch size={16}/> Conectar pulsera y persona
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-ink relative overflow-hidden bg-bg">
      <Sidebar navItems={NAV_ITEMS("dashboard")} parentName={parentName} parentEmail={parentEmail} onSignOut={handleSignOut}/>

      <main className="dashboard-main relative z-[2] max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 lg:ml-[72px] py-6 sm:py-8 lg:py-10 pb-24">

        {/* Encabezado */}
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-7 sm:mb-9 animate-slide-up">
          <div className="flex items-center gap-3.5 min-w-0">
            {selectedPerson && (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 text-ink-on-accent"
                style={{ background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)" }}
                title={selectedPerson.nombre} aria-label={`Avatar de ${selectedPerson.nombre}`}>
                {(selectedPerson.avatar || selectedPerson.nombre?.[0] || "?").toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <CardLabel className="tracking-[0.18em]">{greeting} · {parentName}</CardLabel>
              <h1 className="font-display font-bold tracking-tight text-ink leading-[1.05] truncate mt-0.5"
                style={{ fontSize: "clamp(1.55rem, 4vw, 2.35rem)" }}>
                {selectedPerson?.nombre || "—"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <ConnectionStatus level={connection}/>
            <PersonSwitcher people={people} selectedId={selectedId} onSelect={selectPerson}/>
          </div>
        </header>

        {/* Estado + Recomendaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-5 lg:gap-6 mb-5 lg:mb-6 items-stretch animate-slide-up"
          style={{ animationDelay: "60ms", animationFillMode: "both" }}>
          <HeroStatus
            nombre={selectedPerson?.nombre}
            hasReading={hasReading}
            calma={calmaHoy}
            calmaDelta={calmaDelta}
            bpm={bpm}
            sleep={selectedPerson?.sueno}
            state={state}
            lastReading={lastReading}
          />
          <RecommendationPanel
            stress={hasReading ? stress : 30}
            bpm={bpm}
            bpmResting={selectedPerson?.bpm_reposo}
            series={series}
            childName={selectedPerson?.nombre}
            childAge={selectedPerson?.edad}
          />
        </div>

        {/* Fila 2: Gráfico 24h */}
        <div className="card p-6 sm:p-7 mb-5 lg:mb-6 animate-slide-up"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <CardLabel>Últimas 24 horas</CardLabel>
              <h3 className="m-0 mt-1 font-display text-[26px] font-semibold tracking-tight text-ink">Línea del día</h3>
            </div>
          </div>
          {series.length > 0 ? (
            <StressChart series={series}/>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-center gap-2 text-ink-dim">
              <IconActivity size={26}/>
              <p className="text-sm">Sin lecturas en las últimas 24 horas.</p>
            </div>
          )}
        </div>

        {/* Fila 3: Semana + Actividad */}
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-5 lg:gap-6 mb-5 lg:mb-6 animate-slide-up"
          style={{ animationDelay: "180ms", animationFillMode: "both" }}>
          <div className="card p-6 sm:p-7">
            <div className="flex justify-between items-start mb-5 gap-3">
              <div>
                <CardLabel>Esta semana</CardLabel>
                <h3 className="m-0 mt-1 font-display text-[26px] font-semibold tracking-tight text-ink">Patrón semanal</h3>
              </div>
              <Pill>{state.label}</Pill>
            </div>
            <WeekBars weekly={weekly}/>
            <div className="mt-5 px-3.5 py-3 rounded-xl bg-surface border border-line text-[13px] text-ink-muted leading-relaxed">
              <strong className="text-ink">Observación:</strong> las barras altas indican días de mayor calma.
              Las barras tenues son días sin lecturas registradas.
            </div>
          </div>

          <div className="card p-6 sm:p-7">
            <CardLabel>Actividad</CardLabel>
            <h3 className="m-0 mt-1 mb-4 font-display text-[26px] font-semibold tracking-tight text-ink">Hoy</h3>
            <div className="flex flex-col gap-3.5">
              {activity.length > 0 ? activity.map((x, i) => {
                const accent = normalizeAccent(SEMANTIC_COLORS.brand);
                return (
                  <div key={i} className="flex items-center gap-3.5">
                    <div className="text-[12px] text-ink-dim tabular-nums w-11 shrink-0">{x.time}</div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${accent}1A`, color: accent }}>
                      <IconActivity size={14}/>
                    </div>
                    <div className="text-[13px] text-ink-muted flex-1 min-w-0 font-medium">
                      {x.descripcion || x.tipo}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-[13px] text-ink-dim italic">Sin actividad registrada hoy.</div>
              )}
            </div>
          </div>
        </div>

        {/* Fila 4: Hub de navegación */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 animate-slide-up"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}>
          <HubCard href="/kids"     icon={<IconHeart size={22}/>}    title={`Vista de ${selectedPerson?.nombre || "persona"}`} desc="Personaje animado, ejercicios de respiración y minijuegos." accent={SEMANTIC_COLORS.brand}/>
          <HubCard href="/pairing"  icon={<IconWatch size={22}/>}    title="Conexión"  desc="Vincula una pulsera CalmBand a una persona y red WiFi." accent={SEMANTIC_COLORS.calm}/>
          <HubCard href="/schedule" icon={<IconCalendar size={22}/>} title="Horario"   desc="Calendario diario para cruzar con los datos de la pulsera." accent={SEMANTIC_COLORS.attention}/>
          <HubCard href="/history"  icon={<IconChart size={22}/>}    title="Historial" desc="Sesiones pasadas, tendencias y ejercicios completados." accent={SEMANTIC_COLORS.danger}/>
        </div>
      </main>
    </div>
  );
}
