// Capa de acceso a datos biométricos reales (Supabase).
// Reemplaza a los generadores ficticios de lib/mockData.js.
// Tabla `sesiones_biometria`: { niño_id, timestamp, bpm, hrv, nivel_calma, estado }
// Nota: nivel_calma es 0-100 (mayor = más calma). estrés = 100 - nivel_calma.

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const stressFromCalma = (calma) =>
  calma == null ? null : Math.max(0, Math.min(100, Math.round(100 - calma)));

// Última lectura de la persona (o null si no hay ninguna).
export async function fetchLatestSession(supabase, ninoId) {
  if (!ninoId) return null;
  const { data } = await supabase
    .from("sesiones_biometria")
    .select("timestamp, bpm, nivel_calma, estado")
    .eq("niño_id", ninoId)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

// Lecturas de las últimas 24 horas (orden ascendente).
export async function fetch24hSessions(supabase, ninoId) {
  if (!ninoId) return [];
  const since = new Date(Date.now() - 24 * 3600000).toISOString();
  const { data } = await supabase
    .from("sesiones_biometria")
    .select("timestamp, bpm, nivel_calma")
    .eq("niño_id", ninoId)
    .gte("timestamp", since)
    .order("timestamp", { ascending: true });
  return data || [];
}

// Serie para el gráfico del día: [{ t: Date, stress, bpm }] a partir de lecturas crudas.
export function toStressSeries(sessions) {
  return (sessions || [])
    .map((s) => ({
      t: new Date(s.timestamp),
      stress: stressFromCalma(s.nivel_calma),
      bpm: s.bpm ?? null,
    }))
    .filter((p) => p.stress != null);
}

// Promedios por día de la semana de los últimos 7 días → [{ day, avgStress, isToday }].
export async function fetchWeeklyData(supabase, ninoId) {
  if (!ninoId) return [];
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await supabase
    .from("sesiones_biometria")
    .select("timestamp, nivel_calma")
    .eq("niño_id", ninoId)
    .gte("timestamp", since);

  const buckets = Array.from({ length: 7 }, () => []);
  (data || []).forEach((s) => {
    const stress = stressFromCalma(s.nivel_calma);
    if (stress == null) return;
    const idx = (new Date(s.timestamp).getDay() + 6) % 7; // Lun = 0
    buckets[idx].push(stress);
  });

  const todayIdx = (new Date().getDay() + 6) % 7;
  return DAY_LABELS.map((day, i) => ({
    day,
    avgStress: buckets[i].length
      ? Math.round(buckets[i].reduce((a, b) => a + b, 0) / buckets[i].length)
      : null,
    isToday: i === todayIdx,
  }));
}

// Eventos de actividad de hoy → [{ time, descripcion, tipo }].
export async function fetchTodayActivity(supabase, ninoId) {
  if (!ninoId) return [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("eventos_actividad")
    .select("timestamp, tipo, descripcion")
    .eq("niño_id", ninoId)
    .gte("timestamp", start.toISOString())
    .order("timestamp", { ascending: true });
  return (data || []).map((e) => ({
    time: new Date(e.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    tipo: e.tipo,
    descripcion: e.descripcion,
  }));
}

// Presencia de la pulsera: el dispositivo refresca `last_seen` cada pocos segundos
// (al auto-registrarse), aunque el sensor todavía no haya logrado una lectura de
// pulso. Devuelve el last_seen más reciente entre los dispositivos de la persona
// (ms epoch) o null si no hay ninguno vinculado.
export async function fetchDevicePresence(supabase, ninoId) {
  if (!ninoId) return null;
  const { data } = await supabase
    .from("dispositivos")
    .select("last_seen")
    .eq("niño_id", ninoId)
    .order("last_seen", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.last_seen ? new Date(data.last_seen).getTime() : null;
}

// Sesiones agrupadas por día para el historial → [{ date, dateFormatted, avgStress, avgBpm, peakStress, count }].
export async function fetchSessionHistory(supabase, ninoId, days = 30) {
  if (!ninoId) return [];
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("sesiones_biometria")
    .select("timestamp, bpm, nivel_calma")
    .eq("niño_id", ninoId)
    .gte("timestamp", since)
    .order("timestamp", { ascending: false });

  const byDay = new Map();
  (data || []).forEach((s) => {
    const date = new Date(s.timestamp).toISOString().slice(0, 10);
    if (!byDay.has(date)) byDay.set(date, { stress: [], bpm: [] });
    const stress = stressFromCalma(s.nivel_calma);
    if (stress != null) byDay.get(date).stress.push(stress);
    if (s.bpm != null) byDay.get(date).bpm.push(s.bpm);
  });

  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

  return Array.from(byDay.entries()).map(([date, v]) => ({
    date,
    dateFormatted: new Date(`${date}T00:00:00`).toLocaleDateString("es", {
      weekday: "short", day: "numeric", month: "short",
    }),
    avgStress: avg(v.stress),
    avgBpm: avg(v.bpm),
    peakStress: v.stress.length ? Math.max(...v.stress) : 0,
    count: v.stress.length,
  }));
}

// Detalle hora a hora de un día concreto → [{ hour, stress }] (24 posiciones, null si sin dato).
export async function fetchDayDetail(supabase, ninoId, dateStr) {
  if (!ninoId || !dateStr) return [];
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59`);
  const { data } = await supabase
    .from("sesiones_biometria")
    .select("timestamp, nivel_calma")
    .eq("niño_id", ninoId)
    .gte("timestamp", start.toISOString())
    .lte("timestamp", end.toISOString());

  const buckets = Array.from({ length: 24 }, () => []);
  (data || []).forEach((s) => {
    const stress = stressFromCalma(s.nivel_calma);
    if (stress == null) return;
    buckets[new Date(s.timestamp).getHours()].push(stress);
  });

  return buckets.map((vals, hour) => ({
    hour,
    stress: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
  }));
}

// Ejercicios de respiración completados de la persona.
export async function fetchCompletedExercises(supabase, ninoId, limit = 30) {
  if (!ninoId) return [];
  const { data } = await supabase
    .from("ejercicios_respiracion")
    .select("tipo, duracion_seg, completado, created_at")
    .eq("niño_id", ninoId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).map((e) => ({
    type: e.tipo,
    duration: e.duracion_seg ? `${Math.round(e.duracion_seg / 60)} min` : "—",
    completado: e.completado,
    date: new Date(e.created_at).toLocaleDateString("es", { day: "numeric", month: "short" }),
  }));
}
