"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { stressState, AmbientOrbs } from "@/components/marketing/primitives";
import { IconWind, IconGamepad, IconMusic, IconBook, IconArrowLeft, IconX, IconArrowRight } from "@/components/marketing/icons";
import { CHILD_PROFILE, getCurrentStress, getStressKey } from "@/lib/mockData";

// Friendly blob character — reacts to stress/mood
const CalmChar = ({ mood = "calm", size = 220 }) => {
  const colors = {
    calm:      { body: "#A8E6CF", cheek: "#FFB4A2", eye: "#1a3528" },
    mild:      { body: "#F5D06F", cheek: "#FFB4A2", eye: "#2e2410" },
    moderate:  { body: "#FFB4A2", cheek: "#F4A6C0", eye: "#2e120a" },
    high:      { body: "#F4A6C0", cheek: "#B8A4FF", eye: "#2a0d1e" },
    breathing: { body: "#B8A4FF", cheek: "#FFC9E5", eye: "#190a33" },
  }[mood] || { body: "#A8E6CF", cheek: "#FFB4A2", eye: "#1a3528" };

  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let t;
    const loop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
      t = setTimeout(loop, 2500 + Math.random() * 2500);
    };
    t = setTimeout(loop, 1000);
    return () => clearTimeout(t);
  }, []);

  const mouthPath = {
    calm:      "M 80 125 Q 100 140 120 125",
    mild:      "M 82 128 Q 100 132 118 128",
    moderate:  "M 85 130 L 115 130",
    high:      "M 82 135 Q 100 122 118 135",
    breathing: "M 88 125 Q 100 138 112 125",
  }[mood];

  return (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="charBody" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5"/>
          <stop offset="30%" stopColor={colors.body}/>
          <stop offset="100%" stopColor={colors.body} stopOpacity="0.85"/>
        </radialGradient>
        <filter id="charShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6"/>
        </filter>
      </defs>
      <ellipse cx="100" cy="200" rx="60" ry="8" fill="rgba(0,0,0,0.3)" filter="url(#charShadow)"/>
      <g style={{ transformOrigin: "100px 110px", animation: "charBob 3s ease-in-out infinite" }}>
        <path d="M 100 30 C 55 30 25 60 25 110 C 25 160 55 190 100 190 C 145 190 175 160 175 110 C 175 60 145 30 100 30 Z"
              fill="url(#charBody)" stroke={colors.body} strokeWidth="2" strokeOpacity="0.6"/>
        <line x1="100" y1="30" x2="100" y2="12" stroke={colors.body} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="100" cy="8" r="6" fill={colors.body}>
          <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite"/>
        </circle>
        <ellipse cx="65" cy="120" rx="10" ry="7" fill={colors.cheek} opacity="0.65"/>
        <ellipse cx="135" cy="120" rx="10" ry="7" fill={colors.cheek} opacity="0.65"/>
        {blink ? (
          <>
            <path d="M 68 100 L 82 100" stroke={colors.eye} strokeWidth="3" strokeLinecap="round"/>
            <path d="M 118 100 L 132 100" stroke={colors.eye} strokeWidth="3" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <ellipse cx="75" cy="102" rx="5" ry="7" fill={colors.eye}/>
            <circle cx="77" cy="99" r="1.5" fill="#fff"/>
            <ellipse cx="125" cy="102" rx="5" ry="7" fill={colors.eye}/>
            <circle cx="127" cy="99" r="1.5" fill="#fff"/>
          </>
        )}
        <path d={mouthPath} stroke={colors.eye} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>
    </svg>
  );
};

// Breathing exercise overlay
const BreathingExercise = ({ onClose }) => {
  const [running, setRunning] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState("inhale");
  const [phaseSec, setPhaseSec] = useState(0);
  const totalCycles = 5;
  const cfg = { inhale: 4, hold: 4, exhale: 6 };
  const phaseLabel = { inhale: "Inhala", hold: "Mantén", exhale: "Exhala" }[phase];

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setPhaseSec(s => {
        const next = s + 1;
        if (next >= cfg[phase]) {
          if (phase === "inhale") setPhase("hold");
          else if (phase === "hold") setPhase("exhale");
          else {
            setPhase("inhale");
            setCycle(c => {
              const nc = c + 1;
              if (nc >= totalCycles) setRunning(false);
              return nc;
            });
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  const scale = phase === "inhale"
    ? 0.6 + 0.4 * (phaseSec / cfg.inhale)
    : phase === "hold" ? 1
    : 1 - 0.4 * (phaseSec / cfg.exhale);

  const done = cycle >= totalCycles;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(180deg, #1f1040 0%, #0a0820 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(184,164,255,0.2), transparent 60%)" }}/>
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20, zIndex: 2,
        width: 40, height: 40, borderRadius: 20,
        background: "rgba(255,255,255,0.08)", border: "none",
        color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}><IconX size={18}/></button>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {done ? (
          <div style={{ animation: "heroTextIn 0.6s" }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>✨</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 42, fontWeight: 500, margin: "0 0 12px", color: "#fff" }}>
              ¡Genial, {CHILD_PROFILE.name}!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 32 }}>
              Completaste {totalCycles} respiraciones. ¿Cómo te sientes ahora?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {["😌", "🙂", "😐", "😔"].map(e => (
                <button key={e} onClick={onClose} style={{
                  width: 64, height: 64, fontSize: 32, borderRadius: 20,
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer", transition: "transform 0.2s"
                }}>{e}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: "relative", width: 320, height: 320, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px" }}>
              {[0.95, 1.1, 1.25].map((s, i) => (
                <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(184,164,255,0.15)", transform: `scale(${s})` }}/>
              ))}
              <div style={{
                width: 260, height: 260, borderRadius: "50%",
                background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.4), rgba(184,164,255,0.9) 40%, rgba(139,127,216,0.7) 100%)",
                transform: `scale(${scale})`, transition: "transform 1s cubic-bezier(.4,0,.2,1)",
                boxShadow: "0 0 80px rgba(184,164,255,0.5), inset 0 0 60px rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, color: "#2a1848", marginBottom: 4 }}>{phaseLabel}</div>
                  <div style={{ fontSize: 40, fontWeight: 600, color: "#2a1848", letterSpacing: -2 }}>{cfg[phase] - phaseSec}</div>
                </div>
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
              Ciclo {cycle + 1} de {totalCycles}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
              {Array.from({ length: totalCycles }).map((_, i) => (
                <div key={i} style={{ width: 28, height: 4, borderRadius: 2, background: i < cycle ? "#B8A4FF" : "rgba(255,255,255,0.12)", transition: "background 0.3s" }}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Bubble pop mini-game
const BubblePop = ({ onClose }) => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [done, setDone] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    if (done) return;
    const spawn = setInterval(() => {
      const b = {
        id: ++idRef.current,
        x: 10 + Math.random() * 80,
        size: 50 + Math.random() * 40,
        color: ["#B8A4FF", "#A8E6CF", "#FFB4A2", "#F4A6C0"][Math.floor(Math.random() * 4)],
        dur: 5 + Math.random() * 3,
      };
      setBubbles(bs => [...bs, b]);
      setTimeout(() => setBubbles(bs => bs.filter(x => x.id !== b.id)), b.dur * 1000);
    }, 700);
    const timer = setInterval(() => {
      setTime(t => { if (t <= 1) { setDone(true); return 0; } return t - 1; });
    }, 1000);
    return () => { clearInterval(spawn); clearInterval(timer); };
  }, [done]);

  const pop = (id) => { setBubbles(bs => bs.filter(x => x.id !== id)); setScore(s => s + 10); };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "linear-gradient(180deg, #2a1849 0%, #0f0825 100%)", overflow: "hidden" }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20, zIndex: 10,
        width: 40, height: 40, borderRadius: 20,
        background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}><IconX size={18}/></button>

      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10, display: "flex", gap: 12 }}>
        <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, fontWeight: 600 }}>⏱ {time}s</div>
        <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(184,164,255,0.2)", border: "1px solid rgba(184,164,255,0.3)", color: "#E9D6FF", fontSize: 14, fontWeight: 600 }}>✨ {score}</div>
      </div>

      {done ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", animation: "heroTextIn 0.6s" }}>
          <div style={{ fontSize: 80, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 42, fontWeight: 500, margin: "0 0 8px" }}>¡Increíble!</h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
            Lograste <strong style={{ color: "#B8A4FF" }}>{score} puntos</strong>
          </p>
          <button onClick={onClose} style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 26px", fontSize: 15, borderRadius: 14,
            background: "linear-gradient(180deg, #B8A4FF, #8B7FD8)", color: "#0D0824",
            boxShadow: "0 8px 24px -6px rgba(184,164,255,0.5)", border: "1px solid rgba(255,255,255,0.2)",
            fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif"
          }}>Volver <IconArrowRight size={14}/></button>
        </div>
      ) : (
        <>
          {bubbles.map(b => (
            <div key={b.id} onClick={() => pop(b.id)} style={{
              position: "absolute", left: `${b.x}%`, bottom: -100,
              width: b.size, height: b.size, borderRadius: "50%",
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), ${b.color} 60%, ${b.color}cc)`,
              boxShadow: `0 0 24px ${b.color}77, inset 0 0 20px rgba(255,255,255,0.3)`,
              cursor: "pointer", animation: `bubbleRise ${b.dur}s linear forwards`
            }}/>
          ))}
          <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            Toca las burbujas al ritmo de tu respiración 💜
          </div>
          <style>{`@keyframes bubbleRise { from { bottom: -100px; opacity: 0; } 10% { opacity: 1; } to { bottom: 110vh; opacity: 0; } }`}</style>
        </>
      )}
    </div>
  );
};

// Activity card
const ActivityCard = ({ accent, icon, title, sub, recommended, onClick }) => (
  <button onClick={onClick} style={{
    position: "relative", padding: "24px 20px", borderRadius: 20,
    background: `linear-gradient(180deg, ${accent}22, ${accent}08)`,
    border: `1px solid ${accent}40`, color: "var(--ink)", cursor: "pointer",
    textAlign: "center", transition: "transform 0.2s, box-shadow 0.2s",
    fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 12
  }}>
    {recommended && (
      <div style={{
        position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
        padding: "4px 10px", borderRadius: 999, background: accent,
        color: "#0A0A1A", fontSize: 10, fontWeight: 700, letterSpacing: 0.5
      }}>RECOMENDADO</div>
    )}
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
      color: "#0A0A1A", display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 6px 16px -4px ${accent}66`
    }}>{icon}</div>
    <div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, letterSpacing: -0.3, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{sub}</div>
    </div>
  </button>
);

// Main Kids View
export default function KidsClient() {
  const router = useRouter();
  const [stress, setStress] = useState(35);
  const [activity, setActivity] = useState(null);

  useEffect(() => { setStress(getCurrentStress()); }, []);

  const state = stressState(stress);
  const mood = state.key;
  const greeting = stress <= 30 ? "¡Qué bien te ves hoy!" :
                   stress <= 55 ? `¿Cómo vas, ${CHILD_PROFILE.name}?` :
                   stress <= 75 ? "¿Necesitas un momento?" : "Estoy aquí contigo";

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${state.hex}18 0%, #0A0A1A 60%)`,
      color: "var(--ink)", position: "relative", overflow: "hidden", transition: "background 0.6s"
    }}>
      <AmbientOrbs/>

      <header style={{ position: "relative", zIndex: 2, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => router.push("/dashboard")} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "8px 14px", cursor: "pointer",
          color: "var(--ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13
        }}>
          <IconArrowLeft size={14}/> Dashboard
        </button>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "8px 14px", borderRadius: 999,
          background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)"
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 12,
            background: CHILD_PROFILE.avatarGradient,
            fontSize: 11, fontWeight: 700, color: "#2A0E16",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>{CHILD_PROFILE.avatar}</div>
          <span style={{ fontSize: 13 }}>{CHILD_PROFILE.name} · {CHILD_PROFILE.age} años</span>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 2, maxWidth: 960, margin: "0 auto", padding: "20px 32px 80px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <CalmChar mood={mood} size={220}/>
        </div>

        <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: state.hex, fontWeight: 500, marginBottom: 8 }}>
          Hola {CHILD_PROFILE.name}
        </div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 500, margin: "0 auto 12px", maxWidth: 640, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          {greeting}
        </h1>
        <p style={{ color: "var(--ink-dim)", fontSize: 16, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.55 }}>
          {stress <= 30 && "Tu pulsera dice que estás muy tranquila. ¡Sigue así!"}
          {stress > 30 && stress <= 55 && "Noto que estás un poquito inquieta. ¿Quieres calmarte conmigo?"}
          {stress > 55 && stress <= 75 && "Parece que algo te preocupa. Elige una actividad y respiremos juntos."}
          {stress > 75 && "Vamos paso a paso. Estás a salvo. Elige algo que te ayude ahora."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, maxWidth: 760, margin: "0 auto" }}>
          <ActivityCard accent="#B8A4FF" icon={<IconWind size={28}/>} title="Respirar" sub="3 min · contigo" recommended={stress > 55} onClick={() => setActivity("breath")}/>
          <ActivityCard accent="#A8E6CF" icon={<IconGamepad size={28}/>} title="Burbujas" sub="30 s · divertido" recommended={stress > 40 && stress <= 70} onClick={() => setActivity("bubble")}/>
          <ActivityCard accent="#FFB4A2" icon={<IconMusic size={28}/>} title="Música" sub="10 min · relax" onClick={() => {}}/>
          <ActivityCard accent="#F4A6C0" icon={<IconBook size={28}/>} title="Historia" sub="5 min · calmante" onClick={() => {}}/>
        </div>

        {/* Streak */}
        <div style={{ marginTop: 40, display: "inline-flex", alignItems: "center", gap: 16, padding: "14px 22px", borderRadius: 999, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4,5,6,7].map(d => (
              <div key={d} style={{
                width: 10, height: 10, borderRadius: 5,
                background: d <= CHILD_PROFILE.streakDays ? "#F5D06F" : "rgba(255,255,255,0.1)",
                boxShadow: d <= CHILD_PROFILE.streakDays ? "0 0 6px #F5D06F88" : "none"
              }}/>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            <strong style={{ color: "#F5D06F" }}>{CHILD_PROFILE.streakDays} días</strong> cuidándote 🌟
          </div>
        </div>
      </main>

      {activity === "breath" && <BreathingExercise onClose={() => setActivity(null)}/>}
      {activity === "bubble" && <BubblePop onClose={() => setActivity(null)}/>}
    </div>
  );
}

export { CalmChar };
