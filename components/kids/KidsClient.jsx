"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { stressState } from "@/components/marketing/primitives";
import { IconWind, IconGamepad, IconMusic, IconBook, IconArrowLeft, IconX, IconArrowRight, IconHeart, IconActivity } from "@/components/marketing/icons";
import { useAuth } from "@/hooks/useAuth";
import { usePeople } from "@/lib/peopleContext";
import { fetchLatestSession, stressFromCalma } from "@/lib/biometria";
import { SEMANTIC_COLORS } from "@/lib/utils";

const AVATAR_GRADIENT = "linear-gradient(135deg, #B8A4FF, #8B7FD8)";

// Friendly blob character — reacts to stress/mood
const CalmChar = ({ mood = "calm", size = 220 }) => {
  const colors = {
    calm:      { body: SEMANTIC_COLORS.calm,      cheek: SEMANTIC_COLORS.attention, eye: "#1a3528" },
    mild:      { body: SEMANTIC_COLORS.attention, cheek: SEMANTIC_COLORS.brand,     eye: "#2e2410" },
    moderate:  { body: SEMANTIC_COLORS.danger,    cheek: SEMANTIC_COLORS.attention, eye: "#2e120a" },
    high:      { body: SEMANTIC_COLORS.danger,    cheek: SEMANTIC_COLORS.brand,     eye: "#2a0d1e" },
    breathing: { body: SEMANTIC_COLORS.brand,     cheek: SEMANTIC_COLORS.attention, eye: "#190a33" },
  }[mood] || { body: SEMANTIC_COLORS.calm, cheek: SEMANTIC_COLORS.attention, eye: "#1a3528" };

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
const BreathingExercise = ({ onClose, onComplete }) => {
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
              ¡Genial!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 32 }}>
              Completaste {totalCycles} respiraciones. ¿Cómo te sientes ahora?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    { ["😌", "🙂", "😐", "😔"].map(e => (
                      <button key={e} onClick={() => { if (onComplete) onComplete(); onClose(); }} style={{
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
              {[1.2, 1.5, 1.8].map((s, i) => (
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
const BubblePop = ({ onClose, onComplete }) => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [done, setDone] = useState(false);
  const idRef = useRef(0);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    if (done) return;
    const spawn = setInterval(() => {
      const b = {
        id: ++idRef.current,
        x: 10 + Math.random() * 80,
        size: 50 + Math.random() * 40,
        color: [SEMANTIC_COLORS.brand, SEMANTIC_COLORS.calm, SEMANTIC_COLORS.attention, SEMANTIC_COLORS.danger][Math.floor(Math.random() * 4)],
        dur: 5 + Math.random() * 3,
      };
      setBubbles(bs => [...bs, b]);
      const timeoutId = setTimeout(() => setBubbles(bs => bs.filter(x => x.id !== b.id)), b.dur * 1000);
      timeoutsRef.current.push(timeoutId);
    }, 700);
    const timer = setInterval(() => {
      setTime(t => { if (t <= 1) { setDone(true); return 0; } return t - 1; });
    }, 1000);
    return () => {
      clearInterval(spawn);
      clearInterval(timer);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
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
          <button onClick={() => { if (onComplete) onComplete(); onClose(); }} style={{
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

// Music rhythm mini-game
const MusicFlow = ({ onClose, onComplete }) => {
  const beatMs = 1000;
  const targetHits = 10;
  const [running, setRunning] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [goodHits, setGoodHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("Sigue el ritmo suave");
  const [done, setDone] = useState(false);
  const lastBeatRef = useRef(Date.now());

  useEffect(() => {
    if (!running || done) return;
    lastBeatRef.current = Date.now();
    const id = setInterval(() => {
      lastBeatRef.current = Date.now();
      setPulse(p => !p);
    }, beatMs);
    return () => clearInterval(id);
  }, [running, done]);

  useEffect(() => {
    if (goodHits >= targetHits) {
      setDone(true);
      setRunning(false);
    }
  }, [goodHits]);

  const handleTap = () => {
    if (done) return;
    const diff = Math.abs(Date.now() - lastBeatRef.current);
    if (diff <= 160) {
      setGoodHits(h => h + 1);
      setCombo(c => c + 1);
      setFeedback("Perfecto");
    } else if (diff <= 320) {
      setGoodHits(h => h + 1);
      setCombo(c => c + 1);
      setFeedback("Bien");
    } else {
      setCombo(0);
      setFeedback("Más lento");
    }
  };

  const progress = Math.min(100, Math.round((goodHits / targetHits) * 100));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(180deg, #23103a 0%, #0b081d 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, rgba(245,208,111,0.18), transparent 60%)" }}/>
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
            <div style={{ fontSize: 80, marginBottom: 12 }}>🎵</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 42, fontWeight: 500, margin: "0 0 8px", color: "#fff" }}>
              ¡Ritmo calmado!
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
              Lograste {goodHits} aciertos siguiendo el pulso.
            </p>
            <button onClick={() => { if (onComplete) onComplete(); onClose(); }} style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 26px", fontSize: 15, borderRadius: 14,
              background: "linear-gradient(180deg, #F5D06F, #B8A4FF)", color: "#2A0E16",
              boxShadow: "0 8px 24px -6px rgba(245,208,111,0.5)", border: "1px solid rgba(255,255,255,0.2)",
              fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif"
            }}>Volver <IconArrowRight size={14}/></button>
          </div>
        ) : (
          <>
            <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto 22px" }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.1)",
                animation: "musicWave 2.4s ease-in-out infinite"
              }}/>
              <button onClick={handleTap} style={{
                position: "absolute", inset: 16, borderRadius: "50%",
                background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), rgba(245,208,111,0.95) 45%, rgba(184,164,255,0.8) 100%)",
                border: "none", cursor: "pointer",
                transform: pulse ? "scale(1)" : "scale(0.93)",
                transition: "transform 0.45s ease",
                boxShadow: "0 0 60px rgba(245,208,111,0.35), inset 0 0 30px rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Fraunces, serif", fontSize: 22, color: "#2A0E16"
              }}>
                Toca
              </button>
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
              {feedback} · combo {combo}
            </div>
            <div style={{ width: 220, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.12)", margin: "0 auto 14px" }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #F5D06F, #B8A4FF)", transition: "width 0.3s" }}/>
            </div>
            <button onClick={() => setRunning(r => !r)} style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff", cursor: "pointer", fontFamily: "Inter, sans-serif"
            }}>{running ? "Pausar" : "Continuar"}</button>
          </>
        )}
      </div>
      <style>{`@keyframes musicWave { 0%,100% { transform: scale(0.96); opacity: 0.4; } 50% { transform: scale(1.04); opacity: 0.8; } }`}</style>
    </div>
  );
};

// Story mini-game
const StoryFlow = ({ onClose, onComplete }) => {
  const steps = [
    {
      title: "Bosque tranquilo",
      text: "Imagina un camino suave entre árboles. Cada paso te hace sentir más ligero.",
    },
    {
      title: "Respira",
      text: "Inhala contando 4, exhala contando 6. Hazlo tres veces.",
    },
    {
      title: "Palabra calma",
      text: "Elige una palabra que te haga sentir seguro.",
      options: ["Luz", "Paz", "Suave", "Valiente"],
    },
    {
      title: "Cierre",
      text: "Guarda esa palabra en tu bolsillo. Puedes volver a ella cuando quieras.",
    },
  ];

  const [index, setIndex] = useState(0);
  const [word, setWord] = useState(null);

  useEffect(() => {
    if (steps[index].options) setWord(null);
  }, [index]);

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const canNext = !step.options || word;
  const chosenWord = word || "";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(180deg, #1b0f2e 0%, #0a081a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, rgba(245,208,111,0.15), transparent 60%)" }}/>
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20, zIndex: 2,
        width: 40, height: 40, borderRadius: 20,
        background: "rgba(255,255,255,0.08)", border: "none",
        color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}><IconX size={18}/></button>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 520, padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: 26, height: 4, borderRadius: 99,
              background: i <= index ? "#F4A6C0" : "rgba(255,255,255,0.12)",
              transition: "background 0.3s"
            }}/>
          ))}
        </div>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📖</div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 36, fontWeight: 500, margin: "0 0 10px", color: "#fff" }}>
          {step.title}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginBottom: 20, lineHeight: 1.6 }}>
          {step.text} {index === 3 && chosenWord ? `Tu palabra es "${chosenWord}".` : ""}
        </p>

        {step.options && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 18 }}>
            {step.options.map(opt => (
              <button key={opt} onClick={() => setWord(opt)} style={{
                padding: "10px 16px", borderRadius: 999,
                background: opt === word ? "#F5D06F" : "rgba(255,255,255,0.08)",
                border: opt === word ? "1px solid #F5D06F" : "1px solid rgba(255,255,255,0.18)",
                color: opt === word ? "#2A0E16" : "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "Inter, sans-serif"
              }}>{opt}</button>
            ))}
          </div>
        )}

        <button onClick={() => {
          if (!canNext) return;
          if (isLast) {
            if (onComplete) onComplete();
            onClose();
          } else {
            setIndex(i => i + 1);
          }
        }} disabled={!canNext} style={{
          padding: "14px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600,
          background: canNext ? "linear-gradient(180deg, #F5D06F, #B8A4FF)" : "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)", color: "#2A0E16",
          cursor: canNext ? "pointer" : "not-allowed", fontFamily: "Inter, sans-serif"
        }}>{isLast ? "Terminar" : "Siguiente"}</button>
      </div>
    </div>
  );
};

// Constellation mini-game
const ConstellationGame = ({ onClose, onComplete }) => {
  const stars = [
    { x: 18, y: 30 },
    { x: 38, y: 18 },
    { x: 64, y: 26 },
    { x: 72, y: 54 },
    { x: 50, y: 72 },
    { x: 24, y: 60 },
  ];
  const [nextIndex, setNextIndex] = useState(0);
  const [mistake, setMistake] = useState(false);
  const done = nextIndex >= stars.length;
  const mistakeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (mistakeTimeoutRef.current) clearTimeout(mistakeTimeoutRef.current);
    };
  }, []);

  const handleStar = (i) => {
    if (done) return;
    if (i === nextIndex) {
      setNextIndex(i + 1);
    } else {
      setMistake(true);
      if (mistakeTimeoutRef.current) clearTimeout(mistakeTimeoutRef.current);
      mistakeTimeoutRef.current = setTimeout(() => setMistake(false), 600);
    }
  };

  const visited = stars.slice(0, nextIndex);
  const points = visited.map(s => `${s.x},${s.y}`).join(" ");

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(180deg, #101a3a 0%, #070916 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, rgba(94,220,154,0.18), transparent 60%)" }}/>
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
            <div style={{ fontSize: 80, marginBottom: 12 }}>✨</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 40, fontWeight: 500, margin: "0 0 8px", color: "#fff" }}>
              ¡Constelación completa!
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
              Cada estrella es un pensamiento tranquilo.
            </p>
            <button onClick={() => { if (onComplete) onComplete(); onClose(); }} style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 26px", fontSize: 15, borderRadius: 14,
              background: "linear-gradient(180deg, #5EDC9A, #A8E6CF)", color: "#0D0824",
              boxShadow: "0 8px 24px -6px rgba(94,220,154,0.5)", border: "1px solid rgba(255,255,255,0.2)",
              fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif"
            }}>Volver <IconArrowRight size={14}/></button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
              {mistake ? "Busca la siguiente estrella en orden" : "Toca las estrellas en orden"}
            </div>
            <div style={{ position: "relative", width: 320, height: 320, margin: "0 auto 16px", borderRadius: 24, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                {visited.length > 1 && (
                  <polyline points={points} fill="none" stroke="rgba(94,220,154,0.6)" strokeWidth="1.5" />
                )}
              </svg>
              {stars.map((s, i) => {
                const active = i < nextIndex;
                return (
                  <button key={i} onClick={() => handleStar(i)} style={{
                    position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)",
                    width: active ? 30 : 26, height: active ? 30 : 26, borderRadius: "50%",
                    background: active ? "#5EDC9A" : "rgba(255,255,255,0.14)",
                    border: active ? "1px solid #5EDC9A" : "1px solid rgba(255,255,255,0.3)",
                    color: active ? "#0D0824" : "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    boxShadow: active ? "0 0 12px rgba(94,220,154,0.6)" : "none",
                    animation: !active ? "twinkle 2.2s ease-in-out infinite" : "none"
                  }}>{i + 1}</button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              Progreso: {nextIndex}/{stars.length}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes twinkle { 0%,100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.9); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }`}</style>
    </div>
  );
};

// Zen garden mini-game
const ZenGarden = ({ onClose, onComplete }) => {
  const maxStones = 8;
  const [stones, setStones] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (stones.length >= maxStones) setDone(true);
  }, [stones.length]);

  const placeStone = () => {
    if (done) return;
    setStones(prev => {
      if (prev.length >= maxStones) return prev;
      const size = 12 + Math.random() * 10;
      const x = 20 + Math.random() * 60;
      const y = 22 + Math.random() * 56;
      return [...prev, { x, y, size }];
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(180deg, #0f1c22 0%, #050a0d 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 35%, rgba(94,220,154,0.2), transparent 60%)" }}/>
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
            <div style={{ fontSize: 80, marginBottom: 12 }}>🪨</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 40, fontWeight: 500, margin: "0 0 8px", color: "#fff" }}>
              Jardín en calma
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
              Colocaste todas las piedras con calma.
            </p>
            <button onClick={() => { if (onComplete) onComplete(); onClose(); }} style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 26px", fontSize: 15, borderRadius: 14,
              background: "linear-gradient(180deg, #5EDC9A, #A8E6CF)", color: "#0D0824",
              boxShadow: "0 8px 24px -6px rgba(94,220,154,0.5)", border: "1px solid rgba(255,255,255,0.2)",
              fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif"
            }}>Volver <IconArrowRight size={14}/></button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
              Toca el estanque y coloca piedras lentamente
            </div>
            <div onClick={placeStone} style={{
              position: "relative", width: 320, height: 320, margin: "0 auto 16px", borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, rgba(94,220,154,0.25), rgba(10,20,24,0.9) 60%, rgba(5,8,10,0.95) 100%)",
              border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer"
            }}>
              {stones.map((s, i) => (
                <div key={i} style={{
                  position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)",
                  width: s.size, height: s.size, borderRadius: "50%",
                  background: "linear-gradient(135deg, #9aa2a8, #5f6a70)",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.35)"
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              {stones.length}/{maxStones} piedras
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Activity card
const ActivityCard = ({ accent, icon, title, sub, recommended, onClick }) => (
  <button onClick={onClick} className="card group" style={{
    position: "relative", padding: "24px 20px", borderRadius: 16,
    background: "#FFFFFF",
    border: `2px solid ${accent}40`, color: "var(--ink)", cursor: "pointer",
    textAlign: "center", transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
    fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  }}
  onMouseEnter={(e) => e.currentTarget.style.borderColor = accent}
  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${accent}40`}
  >
    {recommended && (
      <div style={{
        position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
        padding: "4px 10px", borderRadius: 999, background: accent,
        color: "#FFFFFF", fontSize: 10, fontWeight: 700, letterSpacing: 0.5
      }}>RECOMENDADO</div>
    )}
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: `${accent}1A`,
      color: accent, display: "flex", alignItems: "center", justifyContent: "center",
    }}>{icon}</div>
    <div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: -0.3, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--ink-muted)", fontWeight: 500 }}>{sub}</div>
    </div>
  </button>
);

// Main Kids View
export default function KidsClient() {
  const router = useRouter();
  const { supabase } = useAuth();
  const { selectedPerson } = usePeople();
  const [baseStress, setBaseStress] = useState(30);
  const [activity, setActivity] = useState(null);
  const [earned, setEarned] = useState({
    breath: 0,
    bubble: 0,
    music: 0,
    story: 0,
    constellation: 0,
    garden: 0,
  });
  const [celebrate, setCelebrate] = useState(false);
  const [lastBadge, setLastBadge] = useState(null);

  const personName = selectedPerson?.nombre || "amigo";
  const personAge = selectedPerson?.edad;
  const streakDays = 0;

  useEffect(() => {
    if (!selectedPerson?.id) return;
    let active = true;
    fetchLatestSession(supabase, selectedPerson.id).then((latest) => {
      const s = stressFromCalma(latest?.nivel_calma);
      if (active && s != null) setBaseStress(s);
    });
    return () => { active = false; };
  }, [supabase, selectedPerson]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const isImmersive = Boolean(activity);
    document.body.classList.toggle("immersive-mode", isImmersive);
    window.dispatchEvent(new CustomEvent("immersive-mode-change", { detail: isImmersive }));
    return () => {
      document.body.classList.remove("immersive-mode");
      window.dispatchEvent(new CustomEvent("immersive-mode-change", { detail: false }));
    };
  }, [activity]);

  const stress = baseStress;

  const state = stressState(stress);
  const mood = state.key;
  const greeting = stress <= 30 ? "¡Qué bien te ves hoy!" :
                   stress <= 55 ? `¿Cómo vas, ${personName}?` :
                   stress <= 75 ? "¿Necesitas un momento?" : "Estoy aquí contigo";

  const handleActivityClose = () => setActivity(null);
  const handleActivityComplete = (key) => {
    setEarned((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    setLastBadge(key);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1600);
    setActivity(null);
  };

  const activityCards = [
    {
      key: "breath",
      title: "Respirar",
      sub: "3 min · contigo",
      icon: <IconWind size={28}/>,
      accent: "#B8A4FF",
      recommended: stress > 55,
    },
    {
      key: "bubble",
      title: "Burbujas",
      sub: "30 s · divertido",
      icon: <IconGamepad size={28}/>,
      accent: SEMANTIC_COLORS.calm,
      recommended: stress > 40 && stress <= 70,
    },
    {
      key: "music",
      title: "Música",
      sub: "2 min · ritmo suave",
      icon: <IconMusic size={28}/>,
      accent: SEMANTIC_COLORS.attention,
    },
    {
      key: "story",
      title: "Historia",
      sub: "4 pasos · calma",
      icon: <IconBook size={28}/>,
      accent: SEMANTIC_COLORS.brand,
    },
    {
      key: "constellation",
      title: "Constelación",
      sub: "1 min · foco",
      icon: <IconActivity size={28}/>,
      accent: SEMANTIC_COLORS.attention,
    },
    {
      key: "garden",
      title: "Jardín zen",
      sub: "2 min · lento",
      icon: <IconHeart size={28}/>,
      accent: SEMANTIC_COLORS.calm,
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFFBF0",
      color: "var(--ink)", position: "relative", overflow: "hidden", transition: "background 0.6s"
    }}>

      <header style={{ position: "relative", zIndex: 2, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => router.push("/dashboard")} style={{
          background: "#FFFFFF", border: "1px solid var(--border)",
          borderRadius: 8, padding: "8px 14px", cursor: "pointer",
          color: "var(--ink)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600
        }}>
          <IconArrowLeft size={14}/> Dashboard
        </button>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "8px 14px", borderRadius: 999,
          background: "#FFFFFF", border: "1px solid var(--border)"
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 12,
            background: AVATAR_GRADIENT,
            fontSize: 11, fontWeight: 700, color: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>{(selectedPerson?.avatar || personName[0] || "?").toUpperCase()}</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            {personName}{personAge ? ` · ${personAge} años` : ""}
          </span>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 2, maxWidth: 960, margin: "0 auto", padding: "20px 32px 80px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <CalmChar mood={mood} size={220}/>
        </div>

        <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: state.hex, fontWeight: 700, marginBottom: 8 }}>
          ¡Hola {personName}!
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, margin: "0 auto 12px", maxWidth: 640, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          {stress <= 30 && `${personName} está en calma`}
          {stress > 30 && stress <= 55 && `${personName} está un poquito inquieto`}
          {stress > 55 && stress <= 75 && "¿Necesitas un momento?"}
          {stress > 75 && "Estoy aquí contigo"}
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: 16, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.55 }}>
          {stress <= 30 && "Estás en calma. ¡Sigue así!"}
          {stress > 30 && stress <= 55 && "Noto que estás un poquito inquieto. ¿Quieres calmarte conmigo?"}
          {stress > 55 && stress <= 75 && "Parece que algo te preocupa. Elige una actividad y respiremos juntos."}
          {stress > 75 && "Vamos paso a paso. Estás a salvo. Elige algo que te ayude ahora."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, maxWidth: 820, margin: "0 auto" }}>
          {activityCards.map(card => (
            <ActivityCard
              key={card.key}
              accent={card.accent}
              icon={card.icon}
              title={card.title}
              sub={card.sub}
              recommended={card.recommended}
              onClick={() => setActivity(card.key)}
            />
          ))}
        </div>

        {/* Logros */}
        <div style={{ marginTop: 40, padding: "24px", borderRadius: 20, background: "#FFFFFF", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 999, background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3,4,5,6,7].map(d => (
                <div key={d} style={{
                  width: 10, height: 10, borderRadius: 5,
                  background: d <= streakDays ? SEMANTIC_COLORS.attention : "var(--border)",
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-muted)", fontWeight: 500 }}>
              <strong style={{ color: "var(--ink)" }}>{streakDays} días</strong> de racha
            </div>
          </div>

          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-dim)", fontWeight: 700, marginBottom: 16 }}>
            Medallas
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 8 }}>
            {[
              { key: "breath", label: "Respiración", icon: "🌬️", color: SEMANTIC_COLORS.brand, active: earned.breath > 0 },
              { key: "streak_3", label: "3 días seguidos", icon: "🔥", color: SEMANTIC_COLORS.attention, active: streakDays >= 3 },
              { key: "first_game", label: "Primer juego", icon: "🌟", color: SEMANTIC_COLORS.calm, active: Object.values(earned).some(v => v > 0) },
            ].map((medal) => (
              <div key={medal.key} style={{
                padding: "12px 14px", borderRadius: 12,
                background: medal.active ? `${medal.color}14` : "var(--bg)",
                border: medal.active ? `1px solid ${medal.color}40` : "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 12,
                opacity: medal.active ? 1 : 0.6,
                filter: medal.active ? "none" : "grayscale(1)"
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: medal.active ? `${medal.color}33` : "var(--border-strong)", color: medal.color,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                }}>{medal.icon}</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: medal.active ? "var(--ink)" : "var(--ink-dim)" }}>
                    {medal.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {celebrate && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
          background: "radial-gradient(circle at 50% 50%, rgba(184,164,255,0.3), transparent 60%)",
          animation: "celebrationPulse 1.5s ease-out forwards"
        }}>
          <style>{`@keyframes celebrationPulse { 0% { opacity: 0; transform: scale(0.9); } 20% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0; transform: scale(1.5); } }`}</style>
        </div>
      )}

      {activity === "breath" && <BreathingExercise onClose={() => setActivity(null)} onComplete={() => handleActivityComplete("breath")} />}
      {activity === "bubble" && <BubblePop onClose={() => setActivity(null)} onComplete={() => handleActivityComplete("bubble")} />}
      {activity === "music" && <MusicFlow onClose={() => setActivity(null)} onComplete={() => handleActivityComplete("music")} />}
      {activity === "story" && <StoryFlow onClose={() => setActivity(null)} onComplete={() => handleActivityComplete("story")} />}
      {activity === "constellation" && <ConstellationGame onClose={() => setActivity(null)} onComplete={() => handleActivityComplete("constellation")} />}
      {activity === "garden" && <ZenGarden onClose={() => setActivity(null)} onComplete={() => handleActivityComplete("garden")} />}
    </div>
  );
}

export { CalmChar };
