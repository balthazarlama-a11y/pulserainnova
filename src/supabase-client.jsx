// Supabase client + real-time hooks for CalmBand

const SUPABASE_URL = 'https://eweokauirbsmjbfuxuuh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZW9rYXVpcmJzbWpiZnV4dXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzg2NDMsImV4cCI6MjA5Mjk1NDY0M30.E9Ypd9je2u2F6f7YLONOq4BvouCXtVY4wafVsm7eRfo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Fetch helpers ───

// Get child profile
const fetchChild = async (childId) => {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single();
  if (error) console.warn('fetchChild error:', error);
  return data;
};

// Get latest N heart readings for a child
const fetchReadings = async (childId, hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('heart_readings')
    .select('*')
    .eq('child_id', childId)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true });
  if (error) console.warn('fetchReadings error:', error);
  return data || [];
};

// Get latest single reading
const fetchLatestReading = async (childId) => {
  const { data, error } = await supabase
    .from('heart_readings')
    .select('*')
    .eq('child_id', childId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  if (error) console.warn('fetchLatestReading error:', error);
  return data;
};

// Get alerts for a child
const fetchAlerts = async (childId, limit = 10) => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) console.warn('fetchAlerts error:', error);
  return data || [];
};

// Get daily averages for the last 7 days
const fetchWeeklyAvg = async (childId) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('heart_readings')
    .select('bpm, stress_level, recorded_at')
    .eq('child_id', childId)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true });
  if (error) console.warn('fetchWeeklyAvg error:', error);
  if (!data || data.length === 0) return [];

  // Group by day
  const days = {};
  data.forEach(r => {
    const day = r.recorded_at.slice(0, 10);
    if (!days[day]) days[day] = { stressSum: 0, bpmSum: 0, count: 0 };
    days[day].stressSum += r.stress_level || 0;
    days[day].bpmSum += r.bpm;
    days[day].count++;
  });

  return Object.entries(days).map(([day, d]) => ({
    day,
    avgStress: Math.round(d.stressSum / d.count),
    avgBpm: Math.round(d.bpmSum / d.count)
  }));
};

// ─── Real-time subscription hook ───

const useRealtimeReadings = (childId, onNewReading) => {
  React.useEffect(() => {
    if (!childId) return;
    const channel = supabase
      .channel('heart_readings_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'heart_readings', filter: `child_id=eq.${childId}` },
        (payload) => {
          if (onNewReading) onNewReading(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [childId]);
};

const useRealtimeAlerts = (childId, onNewAlert) => {
  React.useEffect(() => {
    if (!childId) return;
    const channel = supabase
      .channel('alerts_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts', filter: `child_id=eq.${childId}` },
        (payload) => {
          if (onNewAlert) onNewAlert(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [childId]);
};

// ─── Computed helpers ───

// Calculate stress from BPM and baseline
const computeStress = (bpm, baselineBpm = 80) => {
  const diff = bpm - baselineBpm;
  if (diff <= 0) return Math.max(0, 5 + Math.random() * 10);
  // Gradual curve: small diff = low stress, big diff = high stress
  const stress = Math.min(100, (diff / baselineBpm) * 200);
  return Math.round(stress);
};

// Group readings into hourly buckets for chart
const groupByHour = (readings) => {
  const hours = {};
  readings.forEach(r => {
    const h = new Date(r.recorded_at).getHours();
    if (!hours[h]) hours[h] = { stressSum: 0, bpmSum: 0, count: 0 };
    hours[h].stressSum += r.stress_level || 0;
    hours[h].bpmSum += r.bpm;
    hours[h].count++;
  });
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    avgStress: hours[i] ? Math.round(hours[i].stressSum / hours[i].count) : null,
    avgBpm: hours[i] ? Math.round(hours[i].bpmSum / hours[i].count) : null
  }));
};

Object.assign(window, {
  supabase, SUPABASE_URL, SUPABASE_ANON_KEY,
  fetchChild, fetchReadings, fetchLatestReading, fetchAlerts, fetchWeeklyAvg,
  useRealtimeReadings, useRealtimeAlerts,
  computeStress, groupByHour
});
