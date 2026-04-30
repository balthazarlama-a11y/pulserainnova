// Mock data for CalmBand — used across all components when no real device/Supabase data is available

export const CHILD_PROFILE = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "Sofía",
  age: 8,
  avatar: "S",
  avatarGradient: "linear-gradient(135deg, #FFB4A2, #F4A6C0)",
  streakDays: 5,
  bpmResting: 78,
};

export const PARENT_PROFILE = {
  name: "Carolina",
  email: "carolina@example.com",
};

// Current stress state — simulates live data
export function getCurrentStress() {
  const hour = new Date().getHours();
  // Simulate natural variation through the day
  const base = hour >= 8 && hour <= 14 ? 45 : hour >= 15 && hour <= 18 ? 35 : 22;
  const jitter = Math.floor(Math.random() * 15) - 7;
  return Math.max(5, Math.min(95, base + jitter));
}

// Generate 24h history
export function generate24hHistory() {
  const now = Date.now();
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now - i * 3600000).getHours();
    const schoolBump = hour >= 8 && hour <= 14 ? 12 : 0;
    const nightDip = hour >= 22 || hour <= 6 ? -15 : 0;
    const base = 35 + schoolBump + nightDip;
    const wobble = Math.sin(hour * 0.6) * 10 + Math.sin(hour * 1.3) * 5;
    const stress = Math.max(5, Math.min(95, Math.round(base + wobble)));
    const bpm = Math.round(72 + stress * 0.3 + (Math.random() * 6 - 3));
    data.push({
      timestamp: new Date(now - i * 3600000).toISOString(),
      hour,
      bpm,
      stressLevel: stress,
      avgStress: stress,
    });
  }
  return data;
}

// Weekly averages
export function getWeeklyData() {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return days.map((day, i) => {
    const base = 35 + Math.sin(i * 1.8) * 18 + Math.cos(i) * 8;
    return {
      day,
      avgStress: Math.max(10, Math.min(95, Math.round(base))),
      isToday: i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6),
    };
  });
}

// Activity timeline for today
export const TODAY_ACTIVITY = [
  { time: "07:15", event: "Despertó tranquila", icon: "sun", color: "#F5D06F" },
  { time: "08:40", event: "Pico leve camino al cole", icon: "activity", color: "#F59E4C" },
  { time: "10:22", event: "Respiración 4-7-8 completada", icon: "wind", color: "#A8E6CF" },
  { time: "13:05", event: "Almuerzo, muy relajada", icon: "heart", color: "#5EDC9A" },
  { time: "16:30", event: "Mini-juego burbujas", icon: "gamepad", color: "#B8A4FF" },
];

// AI Recommendations by stress level
export const RECOMMENDATIONS = {
  calm: [
    { title: "Dibujo tranquilo", detail: "5 minutos de colorear con tonos suaves y música baja.", duration: "5 min", icon: "book" },
    { title: "Pausa de agua", detail: "Tomar agua lenta y contar 10 tragos juntos.", duration: "2 min", icon: "heart" },
    { title: "Estiramiento suave", detail: "Brazos arriba y respirar profundo tres veces.", duration: "3 min", icon: "wind" },
  ],
  mild: [
    { title: "Respira 4-4-6", detail: "Inhala 4, mantén 4, exhala 6 con una mano en el pecho.", duration: "3 min", icon: "wind" },
    { title: "Juego de burbujas", detail: "Reventar burbujas al ritmo de la respiración.", duration: "5 min", icon: "gamepad" },
    { title: "Música lenta", detail: "Canción suave con palmas lentas para bajar la energía.", duration: "6 min", icon: "music" },
  ],
  moderate: [
    { title: "Círculo de calma", detail: "Dibujar un círculo con el dedo y seguirlo con la respiración.", duration: "4 min", icon: "wind" },
    { title: "Historia corta", detail: "Leer un cuento breve juntos en un rincón tranquilo.", duration: "7 min", icon: "book" },
    { title: "Abrazo mariposa", detail: "Cruzar brazos y dar toques suaves alternados.", duration: "3 min", icon: "heart" },
  ],
  high: [
    { title: "Respira con conteo", detail: "Inhala 3, mantén 3, exhala 5 mientras miras un punto.", duration: "4 min", icon: "wind" },
    { title: "Rincón seguro", detail: "Ir a un lugar cómodo con luz baja y manta suave.", duration: "6 min", icon: "heart" },
    { title: "Música de lluvia", detail: "Escuchar lluvia suave y balancearse lentamente.", duration: "8 min", icon: "music" },
  ],
};

// Completed breathing exercises
export const COMPLETED_EXERCISES = [
  { date: "2025-12-11", type: "Respiración 4-7-8", duration: "3 min", mood_before: "anxious", mood_after: "calm" },
  { date: "2025-12-10", type: "Respiración 4-4-6", duration: "4 min", mood_before: "stressed", mood_after: "mild" },
  { date: "2025-12-09", type: "Burbujas", duration: "2 min", mood_before: "mild", mood_after: "calm" },
  { date: "2025-12-08", type: "Respiración 4-7-8", duration: "3 min", mood_before: "moderate", mood_after: "calm" },
  { date: "2025-12-07", type: "Música relajante", duration: "10 min", mood_before: "mild", mood_after: "calm" },
];

// Session history for history page
export function getSessionHistory() {
  const sessions = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(Date.now() - i * 86400000);
    const avgStress = Math.max(10, Math.min(85, Math.round(30 + Math.sin(i * 0.7) * 20 + Math.random() * 10)));
    const avgBpm = Math.round(72 + avgStress * 0.3);
    sessions.push({
      date: date.toISOString().slice(0, 10),
      dateFormatted: date.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }),
      avgStress,
      avgBpm,
      peakStress: Math.min(95, avgStress + Math.floor(Math.random() * 20)),
      exercisesCompleted: Math.floor(Math.random() * 4),
      duration: `${Math.floor(6 + Math.random() * 8)}h ${Math.floor(Math.random() * 60)}m`,
    });
  }
  return sessions;
}

export function getStressKey(stress) {
  if (stress <= 30) return "calm";
  if (stress <= 55) return "mild";
  if (stress <= 75) return "moderate";
  return "high";
}
