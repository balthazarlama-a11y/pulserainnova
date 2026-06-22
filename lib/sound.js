// Audio sintetizado con Web Audio API — sin archivos externos.
// Sonidos suaves y relajantes para los minijuegos de la vista personal.
// Todo es perezoso y solo se inicializa tras un gesto del usuario (autoplay-safe).

let ctx = null;
let master = null;
let muted = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Debe llamarse desde un handler de click/tap para desbloquear el audio.
export function ensureAudio() {
  return getCtx();
}

export function setMuted(value) {
  muted = value;
  if (master && ctx) {
    master.gain.setTargetAtTime(value ? 0 : 0.5, ctx.currentTime, 0.02);
  }
}

export function isMuted() {
  return muted;
}

// Escala pentatónica de Do mayor (sin semitonos disonantes → siempre suena bien).
export const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

// Reproduce una nota con envolvente suave.
export function playNote(freq, {
  duration = 0.4,
  type = "sine",
  gain = 0.22,
  attack = 0.008,
  release = 0.35,
  when = 0,
  detune = 0,
} = {}) {
  const ac = getCtx();
  if (!ac || !master) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (detune) osc.detune.setValueAtTime(detune, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + duration + release + 0.05);
}

// Pluck tipo marimba/campana — dos osciladores (fundamental + armónico).
export function playPluck(freq, { gain = 0.25, when = 0 } = {}) {
  playNote(freq, { duration: 0.18, type: "triangle", gain, attack: 0.004, release: 0.4, when });
  playNote(freq * 2, { duration: 0.1, type: "sine", gain: gain * 0.35, attack: 0.004, release: 0.25, when });
}

// Pop de burbuja — nota pentatónica aleatoria, alegre.
export function playPop(level = 0) {
  const note = PENTATONIC[(level + Math.floor(Math.random() * PENTATONIC.length)) % PENTATONIC.length];
  playPluck(note, { gain: 0.28 });
}

// Pulso del metrónomo para el juego de ritmo.
export function playBeat(freq = 392.0, accent = false) {
  playPluck(freq, { gain: accent ? 0.34 : 0.2 });
}

// Feedback al acertar/fallar un tap.
export function playTap(good = true) {
  if (good) {
    playPluck(659.25, { gain: 0.3 });
  } else {
    playNote(180, { duration: 0.12, type: "sine", gain: 0.18, release: 0.15 });
  }
}

// Acorde/arpegio ascendente de éxito.
export function playChime() {
  const arp = [392.0, 523.25, 659.25, 783.99];
  arp.forEach((f, i) => playPluck(f, { gain: 0.26, when: i * 0.09 }));
}

// Tono guía para la respiración (sube al inhalar, baja al exhalar).
export function playBreathTone(direction = "inhale") {
  const ac = getCtx();
  if (!ac || !master) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  const [a, b] = direction === "inhale" ? [261.63, 392.0] : [392.0, 261.63];
  osc.frequency.setValueAtTime(a, t);
  osc.frequency.linearRampToValueAtTime(b, t + 1.2);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.16, t + 0.4);
  g.gain.linearRampToValueAtTime(0.0001, t + 1.6);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 1.7);
}

// ── Pad ambiental continuo + arpegio (música de fondo del juego de ritmo) ──
// Devuelve un controlador { start, stop, setTempo }.
export function createMusicLoop({ tempo = 96 } = {}) {
  // Progresión suave de acordes (frecuencias base) en Do/Sol/La menor/Fa.
  const chords = [
    [261.63, 329.63, 392.0],   // C
    [392.0, 493.88, 587.33],   // G
    [220.0, 261.63, 329.63],   // Am
    [349.23, 440.0, 523.25],   // F
  ];
  let step = 0;
  let chordIdx = 0;
  let timer = null;
  let padOsc = [];
  let padGain = null;
  let currentTempo = tempo;

  function startPad(freqs) {
    const ac = getCtx();
    if (!ac || !master) return;
    stopPad();
    padGain = ac.createGain();
    padGain.gain.setValueAtTime(0.0001, ac.currentTime);
    padGain.gain.linearRampToValueAtTime(0.08, ac.currentTime + 1.5);
    padGain.connect(master);
    padOsc = freqs.map((f, i) => {
      const o = ac.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f / 2; // una octava abajo, más cálido
      o.detune.value = (i - 1) * 4;
      o.connect(padGain);
      o.start();
      return o;
    });
  }

  function stopPad() {
    const ac = getCtx();
    if (padGain && ac) {
      padGain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.4);
    }
    const oscs = padOsc;
    const g = padGain;
    setTimeout(() => {
      oscs.forEach(o => { try { o.stop(); } catch {} });
      try { g && g.disconnect(); } catch {}
    }, 1200);
    padOsc = [];
    padGain = null;
  }

  function tick() {
    const chord = chords[chordIdx % chords.length];
    // Arpegio sobre el acorde actual.
    const arpNote = chord[step % chord.length] * (step % 2 === 0 ? 1 : 2);
    playPluck(arpNote, { gain: 0.12 });
    step++;
    // Cada 8 pasos cambia de acorde y de pad.
    if (step % 8 === 0) {
      chordIdx++;
      startPad(chords[chordIdx % chords.length]);
    }
  }

  return {
    start() {
      const ac = getCtx();
      if (!ac) return;
      if (timer) return; // ya está sonando — evita temporizadores duplicados
      startPad(chords[0]);
      const interval = () => (60 / currentTempo) * 1000 / 2; // corcheas
      const run = () => {
        tick();
        timer = setTimeout(run, interval());
      };
      run();
    },
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      stopPad();
    },
    setTempo(t) { currentTempo = t; },
  };
}
