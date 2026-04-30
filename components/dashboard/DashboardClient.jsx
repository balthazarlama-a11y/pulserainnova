"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stressState, GradientText, AmbientOrbs, Card, Pill } from "@/components/marketing/primitives";
import {
  IconHome, IconChart, IconBell, IconSettings, IconLogOut, IconArrowRight,
  IconSparkles, IconWind, IconGamepad, IconMusic, IconBook, IconHeart,
  IconChevronRight, IconActivity, IconSun, IconWatch, IconShield
} from "@/components/marketing/icons";
import { useAuth } from "@/hooks/useAuth";
import Bracelet from "@/components/marketing/bracelet";
import {
  CHILD_PROFILE, PARENT_PROFILE, getCurrentStress,
  generate24hHistory, getWeeklyData, TODAY_ACTIVITY, RECOMMENDATIONS,
  getStressKey
} from "@/lib/mockData";

// Stress ring visualization
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

// 24h chart
const StressChart = ({ stress, hourlyData }) => {
  const w = 640, h = 180;
  const points = useMemo(() => {
    if (hourlyData && hourlyData.length === 24) return hourlyData.map(hd => hd.avgStress || hd.stressLevel);
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

// Weekly bars
const WeekBars = ({ stress }) => {
  const weekly = useMemo(() => getWeeklyData(), []);
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

// AI Recommendation panel
const RecommendationPanel = ({ stress }) => {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);
  const state = stressState(stress);
  const stressKey = getStressKey(stress);

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    setRecs(RECOMMENDATIONS[stressKey] || RECOMMENDATIONS.mild);
    setLoading(false);
  }, [stressKey]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const iconMap = {
    wind: <IconWind size={18}/>, gamepad: <IconGamepad size={18}/>,
    music: <IconMusic size={18}/>, book: <IconBook size={18}/>,
    heart: <IconHeart size={18}/>
  };

  return (
    <Card style={{ padding: 26, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(184,164,255,0.9)", marginBottom: 6 }}>
            <IconSparkles size={12}/> Recomendación IA
          </div>
          <h3 style={{ margin: 0, fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Para este momento</h3>
        </div>
        <button onClick={fetchRecs} disabled={loading} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "6px 10px", color: "var(--ink-muted)", cursor: "pointer", fontSize: 12,
          display: "inline-flex", alignItems: "center", gap: 6
        }}>
          {loading ? <span style={{ width: 10, height: 10, border: "1.5px solid rgba(255,255,255,0.2)", borderTopColor: "#B8A4FF", borderRadius: 5, animation: "spin-slow 0.8s linear infinite", display: "inline-block" }}/> : <IconSparkles size={12}/>}
          {loading ? "Pensando" : "Actualizar"}
        </button>
      </div>

      {loading && !recs ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))", backgroundSize: "200% 100%", animation: "sheen 1.8s linear infinite" }}/>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(recs || []).map((r, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.2s"
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${state.hex}33, ${state.hex}10)`,
                border: `1px solid ${state.hex}40`, color: state.hex,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{iconMap[r.icon] || <IconSparkles size={18}/>}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.4 }}>{r.detail}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums" }}>{r.duration}</div>
              <IconChevronRight size={14} style={{ color: "var(--ink-faint)" }}/>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// Stat card
const Stat = ({ label, value, sub, accent }) => (
  <div style={{ padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)" }}>
    <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1, color: accent || "var(--ink)" }}>{value}</div>
    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>{sub}</div>
  </div>
);

// Navigation hub card
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

export default function DashboardClient({ user, profile }) {
  const router = useRouter();
  const { supabase } = useAuth();
  const [stress, setStress] = useState(35);
  const [hourlyData, setHourlyData] = useState(null);

  useEffect(() => {
    setStress(getCurrentStress());
    setHourlyData(generate24hHistory());
  }, []);

  const state = stressState(stress);
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 19 ? "Buenas tardes" : "Buenas noches";
  const parentName = profile?.display_name || PARENT_PROFILE.name;
  const avgBpm = 72 + Math.floor(stress / 5);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-2)", color: "var(--ink)", position: "relative" }}>
      <AmbientOrbs/>

      {/* Sidebar */}
      <aside className="dashboard-sidebar" style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 76, zIndex: 5,
        borderRight: "1px solid var(--border)", background: "rgba(10,10,26,0.7)",
        backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0"
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)", marginBottom: 32 }}/>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {[
            { i: <IconHome size={18}/>, active: true, label: "Inicio", href: "/dashboard" },
            { i: <IconChart size={18}/>, label: "Historial", href: "/history" },
            { i: <IconWatch size={18}/>, label: "Pulsera", href: "/pairing" },
            { i: <IconSettings size={18}/>, label: "Ajustes", href: "/dashboard" },
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

      {/* Main */}
      <main className="dashboard-main" style={{ marginLeft: 76, padding: "32px 40px 80px", position: "relative", zIndex: 2, maxWidth: 1440 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 4 }}>{greeting}, {parentName}</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>
              Así está <GradientText>{CHILD_PROFILE.name}</GradientText> hoy
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Pill dot={state.hex}>Pulsera conectada</Pill>
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

        {/* Row 1: ring + bracelet + recommendations */}
        <div className="dashboard-row" style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, marginBottom: 24 }}>
          <Card style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <StressRing value={stress} size={260}/>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px 10px 12px",
              borderRadius: 999, background: `${state.hex}18`, border: `1px solid ${state.hex}40`,
              color: state.hex, fontSize: 13, fontWeight: 500, transition: "all 0.3s"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: state.hex, boxShadow: `0 0 8px ${state.hex}` }}/>
              {state.key === "calm" && "Tranquila · puede concentrarse"}
              {state.key === "mild" && "Un poco inquieta · observar"}
              {state.key === "moderate" && "Estresada · necesita apoyo"}
              {state.key === "high" && "Muy ansiosa · intervenir ya"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>
              Basado en HRV, ritmo y temperatura de los últimos 10 minutos.
            </div>
          </Card>
          <RecommendationPanel stress={stress}/>
        </div>

        {/* Row 2: chart */}
        <Card style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 4 }}>Últimas 24 horas</div>
              <h3 style={{ margin: 0, fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Línea del día</h3>
            </div>
          </div>
          <StressChart stress={stress} hourlyData={hourlyData}/>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 24 }}>
            <Stat label="Promedio hoy" value={`${Math.round(100 - stress * 0.95)}`} sub="nivel de calma" accent={state.hex}/>
            <Stat label="Ejercicios" value="4" sub="completados"/>
            <Stat label="Ritmo cardíaco" value={`${avgBpm}`} sub="lpm promedio"/>
            <Stat label="Sueño" value="8h 20m" sub="anoche"/>
          </div>
        </Card>

        {/* Row 3: week + activity */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, marginBottom: 24 }}>
          <Card style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 4 }}>Esta semana</div>
                <h3 style={{ margin: 0, fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Patrón semanal</h3>
              </div>
              <Pill>{state.label}</Pill>
            </div>
            <WeekBars stress={stress}/>
            <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--ink)" }}>Observación:</strong> los miércoles muestran picos más altos, coinciden con clases de matemáticas.
            </div>
          </Card>

          <Card style={{ padding: 28 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 4 }}>Actividad</div>
            <h3 style={{ margin: "0 0 18px", fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Hoy</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {TODAY_ACTIVITY.map((x, i) => {
                const iconMap = {
                  sun: <IconSun size={14}/>, activity: <IconActivity size={14}/>,
                  wind: <IconWind size={14}/>, heart: <IconHeart size={14}/>, gamepad: <IconGamepad size={14}/>
                };
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
            </div>
          </Card>
        </div>

        {/* Row 4: Navigation hub */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <HubCard href="/kids" icon={<IconHeart size={22}/>} title={`Vista de ${CHILD_PROFILE.name}`} desc="Personaje animado, ejercicios de respiración y mini-juegos." accent="#B8A4FF"/>
          <HubCard href="/pairing" icon={<IconWatch size={22}/>} title="Emparejar pulsera" desc="Conecta o vincula un nuevo dispositivo CalmBand." accent="#A8E6CF"/>
          <HubCard href="/history" icon={<IconChart size={22}/>} title="Historial" desc="Sesiones pasadas, tendencias y ejercicios completados." accent="#FFB4A2"/>
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
