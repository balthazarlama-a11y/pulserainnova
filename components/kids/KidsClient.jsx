"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { stressState } from "@/components/marketing/primitives";
import { IconWind, IconGamepad, IconMusic, IconBook, IconArrowLeft, IconX, IconArrowRight, IconHeart, IconActivity } from "@/components/marketing/icons";
import { useAuth } from "@/hooks/useAuth";
import { usePeople } from "@/lib/peopleContext";
import { fetchLatestSession, stressFromCalma } from "@/lib/biometria";
import { SEMANTIC_COLORS } from "@/lib/utils";
import {
  ensureAudio, playPop, playBeat, playTap, playChime, playBreathTone,
  playPluck, createMusicLoop, setMuted,
} from "@/lib/sound";

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

// Breathing exercise overlay — con niveles (patrones) y guía de audio
const BREATH_LEVELS = [
  { name: "Relajación", cfg: { inhale: 4, hold: 4, exhale: 6 },              cycles: 4, desc: "Inhala 4 · mantén 4 · exhala 6" },
  { name: "Caja",       cfg: { inhale: 4, hold: 4, exhale: 4, hold2: 4 },    cycles: 4, desc: "Respiración cuadrada 4·4·4·4" },
  { name: "Calma 4-7-8", cfg: { inhale: 4, hold: 7, exhale: 8 },             cycles: 4, desc: "Inhala 4 · mantén 7 · exhala 8" },
];
const PHASE_ORDER = ["inhale", "hold", "exhale", "hold2"];
const PHASE_LABEL = { inhale: "Inhala", hold: "Mantén", exhale: "Exhala", hold2: "Mantén" };

const BreathingExercise = ({ onClose, onComplete }) => {
  const [level, setLevel] = useState(0);
  const [running, setRunning] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState("inhale");
  const [phaseSec, setPhaseSec] = useState(0);
  const [finished, setFinished] = useState(false); // completó todos los niveles
  const [soundOn, setSoundOn] = useState(true);

  const levelCfg = BREATH_LEVELS[level];
  const cfg = levelCfg.cfg;
  const totalCycles = levelCfg.cycles;
  const phases = PHASE_ORDER.filter(p => cfg[p] != null);

  // Tono guía al cambiar de fase
  useEffect(() => {
    if (!running || finished) return;
    if (!soundOn) return;
    if (phase === "inhale") playBreathTone("inhale");
    else if (phase === "exhale") playBreathTone("exhale");
  }, [phase, running, finished, soundOn]);

  useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      setPhaseSec(s => {
        const next = s + 1;
        if (next >= cfg[phase]) {
          const idx = phases.indexOf(phase);
          const nextPhase = phases[(idx + 1) % phases.length];
          if (idx === phases.length - 1) {
            setCycle(c => {
              const nc = c + 1;
              if (nc >= totalCycles) setRunning(false);
              return nc;
            });
          }
          setPhase(nextPhase);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, finished, level]);

  const cycleDone = cycle >= totalCycles;
  const isLastLevel = level >= BREATH_LEVELS.length - 1;

  const goNextLevel = () => {
    if (soundOn) playChime();
    if (isLastLevel) {
      setFinished(true);
    } else {
      setLevel(l => l + 1);
      setCycle(0);
      setPhase("inhale");
      setPhaseSec(0);
      setRunning(true);
    }
  };

  const maxScale = phase === "inhale"
    ? 0.6 + 0.4 * (phaseSec / cfg.inhale)
    : phase === "exhale" ? 1 - 0.4 * (phaseSec / cfg.exhale)
    : 1; // hold / hold2
  const scale = maxScale;

  const toggleSound = () => {
    setSoundOn(prev => {
      const next = !prev;
      setMuted(!next);
      return next;
    });
  };

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

      {/* Indicador de nivel */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 2, display: "flex", gap: 8, alignItems: "center" }}>
        {BREATH_LEVELS.map((lv, i) => (
          <div key={i} style={{
            padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: i === level ? "rgba(184,164,255,0.25)" : "rgba(255,255,255,0.06)",
            border: i < level ? "1px solid #B8A4FF" : "1px solid rgba(255,255,255,0.12)",
            color: i <= level ? "#E9D6FF" : "rgba(255,255,255,0.4)",
          }}>{i < level ? "✓ " : ""}{lv.name}</div>
        ))}
      </div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {finished ? (
          <div style={{ animation: "heroTextIn 0.6s" }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>✨</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 42, fontWeight: 500, margin: "0 0 12px", color: "#fff" }}>
              ¡Genial!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 32 }}>
              Completaste los 3 niveles de respiración. ¿Cómo te sientes ahora?
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
        ) : cycleDone ? (
          <div style={{ animation: "heroTextIn 0.6s" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌬️</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 34, fontWeight: 500, margin: "0 0 8px", color: "#fff" }}>
              Nivel "{levelCfg.name}" completado
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, marginBottom: 26 }}>
              {isLastLevel ? "¡Último patrón superado!" : `Siguiente: ${BREATH_LEVELS[level + 1].name} (${BREATH_LEVELS[level + 1].desc})`}
            </p>
            <button onClick={goNextLevel} style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", fontSize: 15, borderRadius: 14,
              background: "linear-gradient(180deg, #B8A4FF, #8B7FD8)", color: "#0D0824",
              boxShadow: "0 8px 24px -6px rgba(184,164,255,0.5)", border: "1px solid rgba(255,255,255,0.2)",
              fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif"
            }}>{isLastLevel ? "Terminar" : "Siguiente nivel"} <IconArrowRight size={14}/></button>
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
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, color: "#2a1848", marginBottom: 4 }}>{PHASE_LABEL[phase]}</div>
                  <div style={{ fontSize: 40, fontWeight: 600, color: "#2a1848", letterSpacing: -2 }}>{cfg[phase] - phaseSec}</div>
                </div>
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
              {levelCfg.name} · Ciclo {cycle + 1} de {totalCycles}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
              {Array.from({ length: totalCycles }).map((_, i) => (
                <div key={i} style={{ width: 28, height: 4, borderRadius: 2, background: i < cycle ? "#B8A4FF" : "rgba(255,255,255,0.12)", transition: "background 0.3s" }}/>
              ))}
            </div>
            <button onClick={toggleSound} style={{
              marginTop: 18, padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff", cursor: "pointer", fontFamily: "Inter, sans-serif"
            }}>{soundOn ? "🔊 Sonido" : "🔇 Silencio"}</button>
          </>
        )}
      </div>
    </div>
  );
};

// Bubble pop mini-game — con niveles progresivos y burbujas doradas
const BUBBLE_LEVELS = [
  { goal: 80,  spawnMs: 750, time: 25, sizeMin: 55, sizeMax: 95, label: "Brisa" },
  { goal: 150, spawnMs: 560, time: 28, sizeMin: 45, sizeMax: 80, label: "Viento" },
  { goal: 240, spawnMs: 420, time: 30, sizeMin: 36, sizeMax: 68, label: "Tormenta" },
];

const BubblePop = ({ onClose, onComplete }) => {
  const [level, setLevel] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(BUBBLE_LEVELS[0].time);
  const [phase, setPhase] = useState("playing"); // playing | levelClear | failed | won
  const idRef = useRef(0);
  const timeoutsRef = useRef([]);

  const lv = BUBBLE_LEVELS[level];
  const isLastLevel = level >= BUBBLE_LEVELS.length - 1;

  useEffect(() => {
    if (phase !== "playing") return;
    const spawn = setInterval(() => {
      const golden = Math.random() < 0.14;
      const b = {
        id: ++idRef.current,
        x: 8 + Math.random() * 82,
        size: golden ? 44 : lv.sizeMin + Math.random() * (lv.sizeMax - lv.sizeMin),
        golden,
        color: golden ? "#F5D06F" : [SEMANTIC_COLORS.brand, SEMANTIC_COLORS.calm, SEMANTIC_COLORS.attention][Math.floor(Math.random() * 3)],
        dur: (golden ? 4 : 5 + Math.random() * 2.5) - level * 0.4,
      };
      setBubbles(bs => [...bs, b]);
      const timeoutId = setTimeout(() => setBubbles(bs => bs.filter(x => x.id !== b.id)), b.dur * 1000);
      timeoutsRef.current.push(timeoutId);
    }, lv.spawnMs);
    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          setScore(sc => { setPhase(sc >= lv.goal ? "levelClear" : "failed"); return sc; });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(spawn);
      clearInterval(timer);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [phase, level]);

  // Alcanzar la meta antes de tiempo despeja el nivel.
  useEffect(() => {
    if (phase === "playing" && score >= lv.goal) {
      setPhase(isLastLevel ? "won" : "levelClear");
    }
  }, [score, phase, lv.goal, isLastLevel]);

  const pop = (b) => {
    setBubbles(bs => bs.filter(x => x.id !== b.id));
    setScore(s => s + (b.golden ? 30 : 10));
    playPop(level);
  };

  const nextLevel = () => {
    playChime();
    setLevel(l => l + 1);
    setBubbles([]);
    setTime(BUBBLE_LEVELS[level + 1].time);
    setPhase("playing");
  };

  const retry = () => {
    setBubbles([]);
    setScore(0);
    setTime(lv.time);
    setPhase("playing");
  };

  const endGame = (win) => { if (win && onComplete) onComplete(); onClose(); };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "linear-gradient(180deg, #2a1849 0%, #0f0825 100%)", overflow: "hidden" }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20, zIndex: 10,
        width: 40, height: 40, borderRadius: 20,
        background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}><IconX size={18}/></button>

      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, fontWeight: 600 }}>⏱ {time}s</div>
        <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(184,164,255,0.2)", border: "1px solid rgba(184,164,255,0.3)", color: "#E9D6FF", fontSize: 14, fontWeight: 600 }}>✨ {score} / {lv.goal}</div>
        <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(245,208,111,0.18)", border: "1px solid rgba(245,208,111,0.3)", color: "#F5D06F", fontSize: 14, fontWeight: 600 }}>Nivel {level + 1} · {lv.label}</div>
      </div>

      {/* Barra de progreso hacia la meta */}
      {phase === "playing" && (
        <div style={{ position: "absolute", top: 70, left: 20, right: 20, zIndex: 9, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.1)" }}>
          <div style={{ width: `${Math.min(100, (score / lv.goal) * 100)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #B8A4FF, #F5D06F)", transition: "width 0.3s" }}/>
        </div>
      )}

      {phase === "playing" ? (
        <>
          {bubbles.map(b => (
            <div key={b.id} onClick={() => pop(b)} style={{
              position: "absolute", left: `${b.x}%`, bottom: -100,
              width: b.size, height: b.size, borderRadius: "50%",
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${b.color} 60%, ${b.color}cc)`,
              boxShadow: b.golden ? `0 0 30px ${b.color}, inset 0 0 20px rgba(255,255,255,0.5)` : `0 0 24px ${b.color}77, inset 0 0 20px rgba(255,255,255,0.3)`,
              cursor: "pointer", animation: `bubbleRise ${b.dur}s linear forwards`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: b.size * 0.4
            }}>{b.golden ? "⭐" : ""}</div>
          ))}
          <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            Toca las burbujas · las ⭐ doradas valen 30 💜
          </div>
          <style>{`@keyframes bubbleRise { from { bottom: -100px; opacity: 0; } 10% { opacity: 1; } to { bottom: 110vh; opacity: 0; } }`}</style>
        </>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", animation: "heroTextIn 0.6s", textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 80, marginBottom: 12 }}>{phase === "failed" ? "💨" : "🎉"}</div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 40, fontWeight: 500, margin: "0 0 8px" }}>
            {phase === "won" ? "¡Completaste todo!" : phase === "levelClear" ? `¡Nivel ${level + 1} superado!` : "¡Casi!"}
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
            {phase === "failed"
              ? `Llegaste a ${score} de ${lv.goal} puntos. ¿Lo intentamos otra vez?`
              : <>Lograste <strong style={{ color: "#B8A4FF" }}>{score} puntos</strong></>}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {phase === "failed" && (
              <button onClick={retry} style={btnSecondaryStyle}>Reintentar</button>
            )}
            {phase === "levelClear" && (
              <button onClick={nextLevel} style={btnPrimaryStyle("#B8A4FF", "#8B7FD8")}>Siguiente nivel <IconArrowRight size={14}/></button>
            )}
            {phase === "won" && (
              <button onClick={() => endGame(true)} style={btnPrimaryStyle("#B8A4FF", "#8B7FD8")}>Volver <IconArrowRight size={14}/></button>
            )}
            {phase === "failed" && (
              <button onClick={() => endGame(false)} style={btnSecondaryStyle}>Salir</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos de botón reutilizables para los finales de juego
const btnPrimaryStyle = (c1, c2) => ({
  display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 26px", fontSize: 15, borderRadius: 14,
  background: `linear-gradient(180deg, ${c1}, ${c2})`, color: "#0D0824",
  boxShadow: `0 8px 24px -6px ${c1}88`, border: "1px solid rgba(255,255,255,0.2)",
  fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif"
});
const btnSecondaryStyle = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 24px", fontSize: 15, borderRadius: 14,
  background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)",
  fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif"
};

// Music rhythm mini-game — con música real (Web Audio) y niveles de tempo
const MUSIC_LEVELS = [
  { beatMs: 1100, target: 8,  tempo: 82,  label: "Lento" },
  { beatMs: 850,  target: 12, tempo: 104, label: "Medio" },
  { beatMs: 650,  target: 16, tempo: 132, label: "Vivo"  },
];

const MusicFlow = ({ onClose, onComplete }) => {
  const [level, setLevel] = useState(0);
  const [started, setStarted] = useState(false); // requiere gesto para audio
  const [running, setRunning] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [goodHits, setGoodHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [feedback, setFeedback] = useState("Toca al ritmo del pulso");
  const [phase, setPhase] = useState("playing"); // playing | levelClear | won
  const lastBeatRef = useRef(Date.now());
  const beatTimerRef = useRef(null);
  const musicRef = useRef(null);

  const lv = MUSIC_LEVELS[level];
  const isLastLevel = level >= MUSIC_LEVELS.length - 1;

  // Arranca/para el metrónomo audible y la música de fondo.
  useEffect(() => {
    if (!started || !running || phase !== "playing") return;
    let beatIdx = 0;
    lastBeatRef.current = Date.now();
    setPulse(true);
    playBeat(392, true);
    beatTimerRef.current = setInterval(() => {
      beatIdx++;
      lastBeatRef.current = Date.now();
      setPulse(p => !p);
      playBeat(beatIdx % 4 === 0 ? 523.25 : 392, beatIdx % 4 === 0);
    }, lv.beatMs);
    return () => clearInterval(beatTimerRef.current);
  }, [started, running, phase, level]);

  // Música ambiental de fondo continua mientras se juega.
  useEffect(() => {
    if (!started) return;
    const loop = createMusicLoop({ tempo: lv.tempo });
    musicRef.current = loop;
    if (running && phase === "playing") loop.start();
    return () => loop.stop();
  }, [started, level]);

  useEffect(() => {
    if (!musicRef.current) return;
    musicRef.current.setTempo(lv.tempo);
    if (running && phase === "playing") musicRef.current.start();
    else musicRef.current.stop();
  }, [running, phase]);

  useEffect(() => {
    if (phase === "playing" && goodHits >= lv.target) {
      setPhase(isLastLevel ? "won" : "levelClear");
      setRunning(false);
      playChime();
    }
  }, [goodHits, phase, lv.target, isLastLevel]);

  const begin = () => {
    ensureAudio();
    setStarted(true);
    setRunning(true);
  };

  const handleTap = () => {
    if (!running || phase !== "playing") return;
    const diff = Math.abs(Date.now() - lastBeatRef.current);
    if (diff <= 180) {
      setGoodHits(h => h + 1);
      setCombo(c => { const n = c + 1; setBestCombo(b => Math.max(b, n)); return n; });
      setFeedback("¡Perfecto!");
      playTap(true);
    } else if (diff <= 340) {
      setGoodHits(h => h + 1);
      setCombo(c => { const n = c + 1; setBestCombo(b => Math.max(b, n)); return n; });
      setFeedback("Bien");
      playPluck(440, { gain: 0.22 });
    } else {
      setCombo(0);
      setFeedback("Sigue el pulso");
      playTap(false);
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    setGoodHits(0);
    setCombo(0);
    setFeedback("Toca al ritmo del pulso");
    setPhase("playing");
    setRunning(true);
  };

  const progress = Math.min(100, Math.round((goodHits / lv.target) * 100));

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

      {/* Indicador de niveles */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 2, display: "flex", gap: 8 }}>
        {MUSIC_LEVELS.map((m, i) => (
          <div key={i} style={{
            padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: i === level ? "rgba(245,208,111,0.22)" : "rgba(255,255,255,0.06)",
            border: i < level ? "1px solid #F5D06F" : "1px solid rgba(255,255,255,0.12)",
            color: i <= level ? "#F5D06F" : "rgba(255,255,255,0.4)",
          }}>{i < level ? "✓ " : ""}{m.label}</div>
        ))}
      </div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {!started ? (
          <div style={{ animation: "heroTextIn 0.4s" }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🎶</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 38, fontWeight: 500, margin: "0 0 10px", color: "#fff" }}>
              Música en calma
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 26, maxWidth: 360 }}>
              Sonará una melodía suave. Toca el círculo siguiendo el pulso. Sube de nivel acertando.
            </p>
            <button onClick={begin} style={btnPrimaryStyle("#F5D06F", "#B8A4FF")}>
              ▶ Empezar con música
            </button>
          </div>
        ) : phase !== "playing" ? (
          <div style={{ animation: "heroTextIn 0.6s" }}>
            <div style={{ fontSize: 80, marginBottom: 12 }}>🎵</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 42, fontWeight: 500, margin: "0 0 8px", color: "#fff" }}>
              {phase === "won" ? "¡Maestro del ritmo!" : `¡Nivel ${level + 1} logrado!`}
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
              {goodHits} aciertos · mejor combo {bestCombo}
            </p>
            {phase === "won" ? (
              <button onClick={() => { if (onComplete) onComplete(); onClose(); }} style={btnPrimaryStyle("#F5D06F", "#B8A4FF")}>
                Volver <IconArrowRight size={14}/>
              </button>
            ) : (
              <button onClick={nextLevel} style={btnPrimaryStyle("#F5D06F", "#B8A4FF")}>
                Siguiente nivel ({MUSIC_LEVELS[level + 1].label}) <IconArrowRight size={14}/>
              </button>
            )}
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
                transform: pulse ? "scale(1)" : "scale(0.9)",
                transition: `transform ${lv.beatMs / 1000 * 0.45}s ease`,
                boxShadow: "0 0 60px rgba(245,208,111,0.35), inset 0 0 30px rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Fraunces, serif", fontSize: 22, color: "#2A0E16"
              }}>
                Toca
              </button>
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
              {feedback} · combo {combo} · {goodHits}/{lv.target}
            </div>
            <div style={{ width: 220, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.12)", margin: "0 auto 14px" }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #F5D06F, #B8A4FF)", transition: "width 0.3s" }}/>
            </div>
            <button onClick={() => setRunning(r => !r)} style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff", cursor: "pointer", fontFamily: "Inter, sans-serif"
            }}>{running ? "⏸ Pausar" : "▶ Continuar"}</button>
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
              <button key={opt} onClick={() => { setWord(opt); playPluck(440, { gain: 0.2 }); }} style={{
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
            playChime();
            if (onComplete) onComplete();
            onClose();
          } else {
            playPluck(523.25, { gain: 0.2 });
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

// Constellation mini-game — varios patrones (niveles) con sonido por estrella
const CONSTELLATIONS = [
  { name: "Osa menor", stars: [{ x: 18, y: 30 }, { x: 38, y: 18 }, { x: 64, y: 26 }, { x: 72, y: 54 }, { x: 50, y: 72 }, { x: 24, y: 60 }] },
  { name: "Cometa",    stars: [{ x: 20, y: 20 }, { x: 35, y: 35 }, { x: 50, y: 50 }, { x: 65, y: 62 }, { x: 78, y: 75 }, { x: 60, y: 40 }, { x: 80, y: 30 }] },
  { name: "Corona",    stars: [{ x: 50, y: 18 }, { x: 70, y: 28 }, { x: 80, y: 50 }, { x: 70, y: 72 }, { x: 50, y: 82 }, { x: 30, y: 72 }, { x: 20, y: 50 }, { x: 30, y: 28 }] },
];

const ConstellationGame = ({ onClose, onComplete }) => {
  const [level, setLevel] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [phase, setPhase] = useState("playing"); // playing | levelClear | won
  const mistakeTimeoutRef = useRef(null);

  const constellation = CONSTELLATIONS[level];
  const stars = constellation.stars;
  const isLastLevel = level >= CONSTELLATIONS.length - 1;

  useEffect(() => {
    return () => {
      if (mistakeTimeoutRef.current) clearTimeout(mistakeTimeoutRef.current);
    };
  }, []);

  const handleStar = (i) => {
    if (phase !== "playing") return;
    if (i === nextIndex) {
      const n = i + 1;
      setNextIndex(n);
      playPluck([330, 392, 440, 494, 523, 587, 659, 784][i % 8], { gain: 0.26 });
      if (n >= stars.length) {
        setPhase(isLastLevel ? "won" : "levelClear");
        setTimeout(() => playChime(), 150);
      }
    } else {
      setMistake(true);
      playTap(false);
      if (mistakeTimeoutRef.current) clearTimeout(mistakeTimeoutRef.current);
      mistakeTimeoutRef.current = setTimeout(() => setMistake(false), 600);
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    setNextIndex(0);
    setPhase("playing");
  };

  const visited = stars.slice(0, nextIndex);
  const points = visited.map(s => `${s.x},${s.y}`).join(" ");
  const done = phase !== "playing";

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

      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 2, display: "flex", gap: 8 }}>
        {CONSTELLATIONS.map((c, i) => (
          <div key={i} style={{
            padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: i === level ? "rgba(94,220,154,0.22)" : "rgba(255,255,255,0.06)",
            border: i < level ? "1px solid #5EDC9A" : "1px solid rgba(255,255,255,0.12)",
            color: i <= level ? "#A8E6CF" : "rgba(255,255,255,0.4)",
          }}>{i < level ? "✓ " : ""}{c.name}</div>
        ))}
      </div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {done ? (
          <div style={{ animation: "heroTextIn 0.6s" }}>
            <div style={{ fontSize: 80, marginBottom: 12 }}>✨</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 38, fontWeight: 500, margin: "0 0 8px", color: "#fff" }}>
              {phase === "won" ? "¡Cielo completo!" : `¡${constellation.name} completa!`}
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
              {phase === "won" ? "Uniste las 3 constelaciones." : "Cada estrella es un pensamiento tranquilo."}
            </p>
            {phase === "won" ? (
              <button onClick={() => { if (onComplete) onComplete(); onClose(); }} style={btnPrimaryStyle("#5EDC9A", "#A8E6CF")}>
                Volver <IconArrowRight size={14}/>
              </button>
            ) : (
              <button onClick={nextLevel} style={btnPrimaryStyle("#5EDC9A", "#A8E6CF")}>
                Siguiente: {CONSTELLATIONS[level + 1].name} <IconArrowRight size={14}/>
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
              {mistake ? "Busca la siguiente estrella en orden" : `Dibuja: ${constellation.name}`}
            </div>
            <div style={{ position: "relative", width: 320, height: 320, margin: "0 auto 16px", borderRadius: 24, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                {visited.length > 1 && (
                  <polyline points={points} fill="none" stroke="rgba(94,220,154,0.6)" strokeWidth="1.5" />
                )}
              </svg>
              {stars.map((s, i) => {
                const active = i < nextIndex;
                const isNext = i === nextIndex;
                return (
                  <button key={i} onClick={() => handleStar(i)} style={{
                    position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)",
                    width: active ? 30 : 26, height: active ? 30 : 26, borderRadius: "50%",
                    background: active ? "#5EDC9A" : "rgba(255,255,255,0.14)",
                    border: active ? "1px solid #5EDC9A" : isNext ? "2px solid #A8E6CF" : "1px solid rgba(255,255,255,0.3)",
                    color: active ? "#0D0824" : "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    boxShadow: active ? "0 0 12px rgba(94,220,154,0.6)" : isNext ? "0 0 14px rgba(168,230,207,0.7)" : "none",
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

// Zen garden mini-game — etapas: piedras → flores → faroles
const GARDEN_STAGES = [
  { key: "stone",   max: 6, emoji: "🪨", label: "Coloca piedras lentamente",  note: 261.63 },
  { key: "flower",  max: 6, emoji: "🌸", label: "Siembra flores con cuidado", note: 392.0 },
  { key: "lantern", max: 5, emoji: "🏮", label: "Enciende los faroles",        note: 523.25 },
];

const ZenGarden = ({ onClose, onComplete }) => {
  const [stage, setStage] = useState(0);
  const [items, setItems] = useState([]);       // elementos del stage actual
  const [placed, setPlaced] = useState([]);      // capas ya completadas (se quedan)
  const [phase, setPhase] = useState("placing"); // placing | stageClear | done

  const st = GARDEN_STAGES[stage];
  const isLastStage = stage >= GARDEN_STAGES.length - 1;

  useEffect(() => {
    if (phase === "placing" && items.length >= st.max) {
      setPhase(isLastStage ? "done" : "stageClear");
      playChime();
    }
  }, [items.length, phase, st.max, isLastStage]);

  const place = (e) => {
    if (phase !== "placing") return;
    if (items.length >= st.max) return;
    const size = st.key === "stone" ? 14 + Math.random() * 12 : 22 + Math.random() * 8;
    const x = 18 + Math.random() * 64;
    const y = 20 + Math.random() * 60;
    setItems(prev => [...prev, { x, y, size, key: st.key, emoji: st.emoji }]);
    playPluck(st.note + Math.random() * 30, { gain: 0.2 });
  };

  const nextStage = () => {
    setPlaced(prev => [...prev, ...items]);
    setItems([]);
    setStage(s => s + 1);
    setPhase("placing");
  };

  const allItems = [...placed, ...items];
  const done = phase === "done";

  const renderItem = (it, i) => {
    if (it.key === "stone") {
      return (
        <div key={i} style={{
          position: "absolute", left: `${it.x}%`, top: `${it.y}%`, transform: "translate(-50%, -50%)",
          width: it.size, height: it.size, borderRadius: "50%",
          background: "linear-gradient(135deg, #9aa2a8, #5f6a70)",
          boxShadow: "0 6px 12px rgba(0,0,0,0.35)"
        }}/>
      );
    }
    return (
      <div key={i} style={{
        position: "absolute", left: `${it.x}%`, top: `${it.y}%`, transform: "translate(-50%, -50%)",
        fontSize: it.size, filter: it.key === "lantern" ? "drop-shadow(0 0 8px rgba(245,208,111,0.8))" : "none",
        animation: "twinkle 3s ease-in-out infinite"
      }}>{it.emoji}</div>
    );
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

      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 2, display: "flex", gap: 8 }}>
        {GARDEN_STAGES.map((g, i) => (
          <div key={i} style={{
            padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: i === stage ? "rgba(94,220,154,0.22)" : "rgba(255,255,255,0.06)",
            border: i < stage ? "1px solid #5EDC9A" : "1px solid rgba(255,255,255,0.12)",
            color: i <= stage ? "#A8E6CF" : "rgba(255,255,255,0.4)",
          }}>{i < stage ? "✓ " : `${g.emoji} `}</div>
        ))}
      </div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {done ? (
          <div style={{ animation: "heroTextIn 0.6s" }}>
            <div style={{ fontSize: 80, marginBottom: 12 }}>🌿</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 40, fontWeight: 500, margin: "0 0 8px", color: "#fff" }}>
              Jardín en calma
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
              Creaste un jardín completo, con calma y paciencia.
            </p>
            <button onClick={() => { if (onComplete) onComplete(); onClose(); }} style={btnPrimaryStyle("#5EDC9A", "#A8E6CF")}>
              Volver <IconArrowRight size={14}/>
            </button>
          </div>
        ) : phase === "stageClear" ? (
          <div style={{ animation: "heroTextIn 0.6s" }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>{st.emoji}</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, margin: "0 0 8px", color: "#fff" }}>
              Etapa lista
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 22 }}>
              Ahora: {GARDEN_STAGES[stage + 1].label.toLowerCase()}
            </p>
            <button onClick={nextStage} style={btnPrimaryStyle("#5EDC9A", "#A8E6CF")}>
              Continuar <IconArrowRight size={14}/>
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
              {st.label}
            </div>
            <div onClick={place} style={{
              position: "relative", width: 320, height: 320, margin: "0 auto 16px", borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, rgba(94,220,154,0.25), rgba(10,20,24,0.9) 60%, rgba(5,8,10,0.95) 100%)",
              border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer"
            }}>
              {allItems.map(renderItem)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              {items.length}/{st.max} · etapa {stage + 1} de {GARDEN_STAGES.length}
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
              onClick={() => { ensureAudio(); setMuted(false); setActivity(card.key); }}
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
