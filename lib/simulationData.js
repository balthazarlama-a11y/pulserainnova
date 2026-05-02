// Simulation data — a full realistic week in Simón's life
// Each day has hourly stress/BPM data, events, exercises, and a narrative summary

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

// Helper to build 24-hour data from key-points
function buildHourlyFromKeypoints(keypoints) {
  const data = [];
  for (let h = 0; h < 24; h++) {
    // Find surrounding keypoints
    let prev = keypoints[0];
    let next = keypoints[keypoints.length - 1];
    for (let i = 0; i < keypoints.length - 1; i++) {
      if (h >= keypoints[i].hour && h < keypoints[i + 1].hour) {
        prev = keypoints[i];
        next = keypoints[i + 1];
        break;
      }
    }
    const range = next.hour - prev.hour || 1;
    const t = (h - prev.hour) / range;
    const stress = Math.max(3, Math.min(95, lerp(prev.stress, next.stress, Math.max(0, Math.min(1, t)))));
    const bpm = Math.max(55, Math.min(120, lerp(prev.bpm, next.bpm, Math.max(0, Math.min(1, t)))));
    data.push({
      hour: h,
      stress,
      bpm,
      sleeping: h < 7 || h >= 21,
    });
  }
  return data;
}

export const SIMULATION_WEEK = [
  // ─── LUNES ─── "Vuelta al cole después del fin de semana"
  {
    day: "Lunes",
    dayShort: "Lun",
    date: "2026-04-27",
    narrative: "Vuelta al cole después del fin de semana",
    hourlyData: buildHourlyFromKeypoints([
      { hour: 0, stress: 5, bpm: 60 },
      { hour: 5, stress: 6, bpm: 58 },
      { hour: 6, stress: 15, bpm: 65 },
      { hour: 7, stress: 30, bpm: 74 },
      { hour: 8, stress: 40, bpm: 82 },
      { hour: 9, stress: 38, bpm: 80 },
      { hour: 10, stress: 20, bpm: 72 },
      { hour: 11, stress: 35, bpm: 78 },
      { hour: 12, stress: 38, bpm: 79 },
      { hour: 13, stress: 22, bpm: 70 },
      { hour: 14, stress: 38, bpm: 79 },
      { hour: 15, stress: 36, bpm: 77 },
      { hour: 16, stress: 25, bpm: 72 },
      { hour: 17, stress: 18, bpm: 68 },
      { hour: 18, stress: 15, bpm: 66 },
      { hour: 19, stress: 15, bpm: 65 },
      { hour: 20, stress: 10, bpm: 62 },
      { hour: 21, stress: 8, bpm: 60 },
      { hour: 22, stress: 5, bpm: 58 },
      { hour: 23, stress: 5, bpm: 57 },
    ]),
    events: [
      { time: "07:15", hour: 7.25, event: "Despertó tranquila", icon: "sun", color: "#F5D06F", stress: 18 },
      { time: "08:40", hour: 8.67, event: "Ansiedad camino al cole", icon: "activity", color: "#F59E4C", stress: 42 },
      { time: "10:15", hour: 10.25, event: "Jugó con amigas en recreo", icon: "heart", color: "#5EDC9A", stress: 20 },
      { time: "13:05", hour: 13.08, event: "Almuerzo relajado", icon: "heart", color: "#5EDC9A", stress: 22 },
      { time: "17:30", hour: 17.5, event: "Jugó en casa", icon: "gamepad", color: "#B8A4FF", stress: 18 },
      { time: "20:15", hour: 20.25, event: "Respiración antes de dormir", icon: "wind", color: "#A8E6CF", stress: 10 },
    ],
    exercises: [
      { time: "20:15", type: "Respiración 4-4-6", duration: "3 min", mood_before: "mild", mood_after: "calm" },
    ],
    summary: {
      avgStress: 23,
      peakStress: 42,
      avgBpm: 71,
      exercisesCount: 1,
      sleepHours: "10h 00m",
      bestMoment: "Jugó con amigas en el recreo",
      worstMoment: "Ansiedad camino al colegio",
    },
  },

  // ─── MARTES ─── "Examen de matemáticas"
  {
    day: "Martes",
    dayShort: "Mar",
    date: "2026-04-28",
    narrative: "Examen de matemáticas",
    hourlyData: buildHourlyFromKeypoints([
      { hour: 0, stress: 5, bpm: 59 },
      { hour: 5, stress: 6, bpm: 58 },
      { hour: 6, stress: 18, bpm: 66 },
      { hour: 7, stress: 35, bpm: 76 },
      { hour: 8, stress: 45, bpm: 84 },
      { hour: 9, stress: 55, bpm: 90 },
      { hour: 10, stress: 70, bpm: 98 },
      { hour: 11, stress: 45, bpm: 82 },
      { hour: 12, stress: 35, bpm: 76 },
      { hour: 13, stress: 28, bpm: 72 },
      { hour: 14, stress: 25, bpm: 70 },
      { hour: 15, stress: 22, bpm: 68 },
      { hour: 16, stress: 20, bpm: 67 },
      { hour: 17, stress: 18, bpm: 66 },
      { hour: 18, stress: 15, bpm: 65 },
      { hour: 19, stress: 14, bpm: 64 },
      { hour: 20, stress: 12, bpm: 62 },
      { hour: 21, stress: 8, bpm: 59 },
      { hour: 22, stress: 5, bpm: 58 },
      { hour: 23, stress: 5, bpm: 57 },
    ]),
    events: [
      { time: "09:45", hour: 9.75, event: "Completó respiración 4-4-6", icon: "wind", color: "#A8E6CF", stress: 45 },
      { time: "10:00", hour: 10.0, event: "Inicio examen — estrés alto", icon: "activity", color: "#F59E4C", stress: 68 },
      { time: "10:30", hour: 10.5, event: "Pico de ansiedad", icon: "activity", color: "#EC5B6B", stress: 75 },
      { time: "11:00", hour: 11.0, event: "Terminó examen — alivio", icon: "sun", color: "#F5D06F", stress: 45 },
      { time: "14:00", hour: 14.0, event: "Juego de burbujas", icon: "gamepad", color: "#B8A4FF", stress: 25 },
      { time: "20:00", hour: 20.0, event: "Respiración nocturna", icon: "wind", color: "#A8E6CF", stress: 12 },
    ],
    exercises: [
      { time: "09:45", type: "Respiración 4-4-6", duration: "3 min", mood_before: "moderate", mood_after: "mild" },
      { time: "14:00", type: "Juego de burbujas", duration: "2 min", mood_before: "mild", mood_after: "calm" },
      { time: "20:00", type: "Respiración 4-4-6", duration: "3 min", mood_before: "mild", mood_after: "calm" },
    ],
    summary: {
      avgStress: 28,
      peakStress: 75,
      avgBpm: 73,
      exercisesCount: 3,
      sleepHours: "9h 30m",
      bestMoment: "Alivio al terminar el examen",
      worstMoment: "Pico de ansiedad durante el examen",
    },
  },

  // ─── MIÉRCOLES ─── "Educación física + pelea con amiga"
  {
    day: "Miércoles",
    dayShort: "Mié",
    date: "2026-04-29",
    narrative: "Clase de educación física + pelea con amiga",
    hourlyData: buildHourlyFromKeypoints([
      { hour: 0, stress: 5, bpm: 58 },
      { hour: 5, stress: 6, bpm: 59 },
      { hour: 6, stress: 15, bpm: 64 },
      { hour: 7, stress: 28, bpm: 72 },
      { hour: 8, stress: 32, bpm: 75 },
      { hour: 9, stress: 30, bpm: 74 },
      { hour: 10, stress: 15, bpm: 88 },
      { hour: 11, stress: 18, bpm: 72 },
      { hour: 12, stress: 25, bpm: 74 },
      { hour: 13, stress: 55, bpm: 86 },
      { hour: 14, stress: 80, bpm: 105 },
      { hour: 15, stress: 50, bpm: 84 },
      { hour: 16, stress: 48, bpm: 82 },
      { hour: 17, stress: 45, bpm: 80 },
      { hour: 18, stress: 25, bpm: 72 },
      { hour: 19, stress: 20, bpm: 68 },
      { hour: 20, stress: 15, bpm: 64 },
      { hour: 21, stress: 10, bpm: 60 },
      { hour: 22, stress: 6, bpm: 58 },
      { hour: 23, stress: 5, bpm: 57 },
    ]),
    events: [
      { time: "10:00", hour: 10.0, event: "Educación física — muy relajada", icon: "heart", color: "#5EDC9A", stress: 15 },
      { time: "13:30", hour: 13.5, event: "Pelea con amiga — estrés alto", icon: "activity", color: "#EC5B6B", stress: 80 },
      { time: "13:45", hour: 13.75, event: "Respiración guiada", icon: "wind", color: "#A8E6CF", stress: 55 },
      { time: "14:00", hour: 14.0, event: "Abrazo mariposa", icon: "heart", color: "#F4A6C0", stress: 50 },
      { time: "18:00", hour: 18.0, event: "Se reconcilió con amiga", icon: "sun", color: "#F5D06F", stress: 25 },
      { time: "20:30", hour: 20.5, event: "Dormida tranquila", icon: "sun", color: "#5EDC9A", stress: 12 },
    ],
    exercises: [
      { time: "13:45", type: "Respiración guiada", duration: "4 min", mood_before: "high", mood_after: "moderate" },
      { time: "14:00", type: "Abrazo mariposa", duration: "3 min", mood_before: "moderate", mood_after: "mild" },
    ],
    summary: {
      avgStress: 29,
      peakStress: 80,
      avgBpm: 74,
      exercisesCount: 2,
      sleepHours: "9h 30m",
      bestMoment: "Educación física — se divirtió mucho",
      worstMoment: "Pelea con su mejor amiga",
    },
  },

  // ─── JUEVES ─── "Día tranquilo, excursión al parque"
  {
    day: "Jueves",
    dayShort: "Jue",
    date: "2026-04-30",
    narrative: "Día tranquilo, excursión al parque",
    hourlyData: buildHourlyFromKeypoints([
      { hour: 0, stress: 5, bpm: 58 },
      { hour: 5, stress: 5, bpm: 57 },
      { hour: 6, stress: 12, bpm: 62 },
      { hour: 7, stress: 18, bpm: 68 },
      { hour: 8, stress: 15, bpm: 66 },
      { hour: 9, stress: 12, bpm: 70 },
      { hour: 10, stress: 10, bpm: 78 },
      { hour: 11, stress: 45, bpm: 85 },
      { hour: 12, stress: 12, bpm: 75 },
      { hour: 13, stress: 10, bpm: 72 },
      { hour: 14, stress: 12, bpm: 68 },
      { hour: 15, stress: 15, bpm: 66 },
      { hour: 16, stress: 12, bpm: 64 },
      { hour: 17, stress: 10, bpm: 62 },
      { hour: 18, stress: 10, bpm: 62 },
      { hour: 19, stress: 8, bpm: 60 },
      { hour: 20, stress: 6, bpm: 58 },
      { hour: 21, stress: 5, bpm: 57 },
      { hour: 22, stress: 4, bpm: 56 },
      { hour: 23, stress: 4, bpm: 56 },
    ]),
    events: [
      { time: "09:00", hour: 9.0, event: "Salida al parque natural", icon: "sun", color: "#5EDC9A", stress: 12 },
      { time: "11:30", hour: 11.5, event: "Se perdió del grupo — resolvió rápido", icon: "activity", color: "#F59E4C", stress: 45 },
      { time: "12:00", hour: 12.0, event: "Picnic con compañeros", icon: "heart", color: "#5EDC9A", stress: 12 },
      { time: "15:00", hour: 15.0, event: "Llegó a casa feliz", icon: "sun", color: "#F5D06F", stress: 15 },
      { time: "17:00", hour: 17.0, event: "Dibujo tranquilo", icon: "book", color: "#B8A4FF", stress: 10 },
      { time: "20:00", hour: 20.0, event: "Se durmió temprano", icon: "sun", color: "#5EDC9A", stress: 6 },
    ],
    exercises: [],
    summary: {
      avgStress: 12,
      peakStress: 45,
      avgBpm: 66,
      exercisesCount: 0,
      sleepHours: "10h 30m",
      bestMoment: "Picnic en el parque con amigos",
      worstMoment: "Se perdió brevemente del grupo",
    },
  },

  // ─── VIERNES ─── "Último día + fiesta de cumpleaños"
  {
    day: "Viernes",
    dayShort: "Vie",
    date: "2026-05-01",
    narrative: "Último día de la semana + fiesta de cumpleaños",
    hourlyData: buildHourlyFromKeypoints([
      { hour: 0, stress: 5, bpm: 58 },
      { hour: 5, stress: 6, bpm: 58 },
      { hour: 6, stress: 20, bpm: 68 },
      { hour: 7, stress: 32, bpm: 76 },
      { hour: 8, stress: 35, bpm: 78 },
      { hour: 9, stress: 33, bpm: 76 },
      { hour: 10, stress: 30, bpm: 74 },
      { hour: 11, stress: 32, bpm: 76 },
      { hour: 12, stress: 28, bpm: 72 },
      { hour: 13, stress: 25, bpm: 70 },
      { hour: 14, stress: 30, bpm: 74 },
      { hour: 15, stress: 38, bpm: 78 },
      { hour: 16, stress: 50, bpm: 86 },
      { hour: 17, stress: 58, bpm: 92 },
      { hour: 18, stress: 35, bpm: 76 },
      { hour: 19, stress: 22, bpm: 68 },
      { hour: 20, stress: 15, bpm: 64 },
      { hour: 21, stress: 8, bpm: 59 },
      { hour: 22, stress: 5, bpm: 57 },
      { hour: 23, stress: 5, bpm: 56 },
    ]),
    events: [
      { time: "08:00", hour: 8.0, event: "Emocionada por la fiesta", icon: "sun", color: "#F5D06F", stress: 35 },
      { time: "12:00", hour: 12.0, event: "Último día de clases", icon: "heart", color: "#5EDC9A", stress: 28 },
      { time: "16:00", hour: 16.0, event: "Fiesta de cumpleaños", icon: "gamepad", color: "#B8A4FF", stress: 50 },
      { time: "17:30", hour: 17.5, event: "Juego de burbujas en la fiesta", icon: "wind", color: "#A8E6CF", stress: 35 },
      { time: "19:00", hour: 19.0, event: "Vuelta a casa agotada", icon: "sun", color: "#F5D06F", stress: 22 },
      { time: "20:00", hour: 20.0, event: "Se durmió rápido", icon: "sun", color: "#5EDC9A", stress: 15 },
    ],
    exercises: [
      { time: "17:30", type: "Juego de burbujas", duration: "2 min", mood_before: "moderate", mood_after: "mild" },
    ],
    summary: {
      avgStress: 27,
      peakStress: 58,
      avgBpm: 73,
      exercisesCount: 1,
      sleepHours: "9h 30m",
      bestMoment: "Diversión en la fiesta de cumpleaños",
      worstMoment: "Sobreestimulación en la fiesta",
    },
  },

  // ─── SÁBADO ─── "Mañana en familia + tarde de pantallas"
  {
    day: "Sábado",
    dayShort: "Sáb",
    date: "2026-05-02",
    narrative: "Mañana en familia + tarde de pantallas",
    hourlyData: buildHourlyFromKeypoints([
      { hour: 0, stress: 5, bpm: 57 },
      { hour: 5, stress: 5, bpm: 56 },
      { hour: 6, stress: 5, bpm: 56 },
      { hour: 7, stress: 6, bpm: 57 },
      { hour: 8, stress: 8, bpm: 60 },
      { hour: 9, stress: 10, bpm: 62 },
      { hour: 10, stress: 10, bpm: 68 },
      { hour: 11, stress: 8, bpm: 72 },
      { hour: 12, stress: 10, bpm: 68 },
      { hour: 13, stress: 12, bpm: 66 },
      { hour: 14, stress: 15, bpm: 65 },
      { hour: 15, stress: 25, bpm: 70 },
      { hour: 16, stress: 35, bpm: 74 },
      { hour: 17, stress: 50, bpm: 82 },
      { hour: 18, stress: 20, bpm: 68 },
      { hour: 19, stress: 15, bpm: 64 },
      { hour: 20, stress: 10, bpm: 62 },
      { hour: 21, stress: 6, bpm: 58 },
      { hour: 22, stress: 5, bpm: 57 },
      { hour: 23, stress: 5, bpm: 56 },
    ]),
    events: [
      { time: "09:30", hour: 9.5, event: "Despertó tarde y feliz", icon: "sun", color: "#F5D06F", stress: 10 },
      { time: "10:30", hour: 10.5, event: "Parque con papás", icon: "heart", color: "#5EDC9A", stress: 10 },
      { time: "12:00", hour: 12.0, event: "Helado en familia", icon: "heart", color: "#5EDC9A", stress: 10 },
      { time: "15:00", hour: 15.0, event: "Tablet — sube estrés gradual", icon: "activity", color: "#F59E4C", stress: 25 },
      { time: "17:00", hour: 17.0, event: "Límite de pantalla — frustración", icon: "activity", color: "#EC5B6B", stress: 50 },
      { time: "17:15", hour: 17.25, event: "Música relajante", icon: "music", color: "#B8A4FF", stress: 30 },
      { time: "19:00", hour: 19.0, event: "Cena en familia", icon: "heart", color: "#5EDC9A", stress: 15 },
    ],
    exercises: [
      { time: "17:15", type: "Música relajante", duration: "10 min", mood_before: "moderate", mood_after: "calm" },
    ],
    summary: {
      avgStress: 14,
      peakStress: 50,
      avgBpm: 65,
      exercisesCount: 1,
      sleepHours: "10h 30m",
      bestMoment: "Parque y helado con la familia",
      worstMoment: "Frustración al limitar la tablet",
    },
  },

  // ─── DOMINGO ─── "Día tranquilo + ansiedad anticipatoria"
  {
    day: "Domingo",
    dayShort: "Dom",
    date: "2026-05-03",
    narrative: "Día tranquilo + ansiedad anticipatoria por el lunes",
    hourlyData: buildHourlyFromKeypoints([
      { hour: 0, stress: 5, bpm: 56 },
      { hour: 5, stress: 5, bpm: 56 },
      { hour: 6, stress: 5, bpm: 56 },
      { hour: 7, stress: 6, bpm: 57 },
      { hour: 8, stress: 8, bpm: 58 },
      { hour: 9, stress: 10, bpm: 60 },
      { hour: 10, stress: 10, bpm: 62 },
      { hour: 11, stress: 12, bpm: 64 },
      { hour: 12, stress: 15, bpm: 66 },
      { hour: 13, stress: 15, bpm: 66 },
      { hour: 14, stress: 15, bpm: 66 },
      { hour: 15, stress: 18, bpm: 68 },
      { hour: 16, stress: 25, bpm: 72 },
      { hour: 17, stress: 35, bpm: 76 },
      { hour: 18, stress: 42, bpm: 80 },
      { hour: 19, stress: 25, bpm: 72 },
      { hour: 20, stress: 15, bpm: 64 },
      { hour: 21, stress: 8, bpm: 59 },
      { hour: 22, stress: 5, bpm: 57 },
      { hour: 23, stress: 5, bpm: 56 },
    ]),
    events: [
      { time: "10:00", hour: 10.0, event: "Mañana perezosa", icon: "sun", color: "#F5D06F", stress: 10 },
      { time: "12:00", hour: 12.0, event: "Comida familiar", icon: "heart", color: "#5EDC9A", stress: 15 },
      { time: "15:00", hour: 15.0, event: "Juego libre", icon: "gamepad", color: "#B8A4FF", stress: 18 },
      { time: "17:00", hour: 17.0, event: "Empieza ansiedad por el lunes", icon: "activity", color: "#F59E4C", stress: 35 },
      { time: "19:00", hour: 19.0, event: "Respiración 4-4-6 con mamá", icon: "wind", color: "#A8E6CF", stress: 25 },
      { time: "19:30", hour: 19.5, event: "Cuento relajante", icon: "book", color: "#B8A4FF", stress: 18 },
      { time: "20:30", hour: 20.5, event: "Dormida tranquila", icon: "sun", color: "#5EDC9A", stress: 8 },
    ],
    exercises: [
      { time: "19:00", type: "Respiración 4-4-6", duration: "3 min", mood_before: "mild", mood_after: "calm" },
      { time: "19:30", type: "Cuento relajante", duration: "10 min", mood_before: "mild", mood_after: "calm" },
    ],
    summary: {
      avgStress: 15,
      peakStress: 42,
      avgBpm: 65,
      exercisesCount: 2,
      sleepHours: "10h 00m",
      bestMoment: "Mañana perezosa en familia",
      worstMoment: "Ansiedad anticipatoria por el lunes",
    },
  },
];
