import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Ingesta de biometría desde el hardware (pulsera CalmBand).
//
// La pulsera NO tiene sesión web de usuario, así que este endpoint usa la
// `service_role_key` para saltarse RLS e insertar lecturas. La clave de servicio
// vive solo en el servidor (nunca se expone al cliente).
//
// Contrato completo del hardware documentado en /api.md.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Token compartido opcional para autenticar al hardware. Si se define en el
// entorno, las peticiones DEBEN incluirlo (Authorization: Bearer <token> o
// cabecera x-device-token). Si no se define, el endpoint queda abierto (útil
// para pruebas locales), pero se recomienda fijarlo en producción.
const DEVICE_TOKEN = process.env.DEVICE_INGEST_TOKEN;

// Rangos de validación fisiológicamente razonables.
const RANGES = {
  bpm: [20, 250],
  hrv: [0, 600],
  nivel_calma: [0, 100],
};

// Crea el cliente de servicio de forma perezosa para no romper el build cuando
// faltan variables de entorno y para devolver un error claro en caliente.
function getServiceClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Valida un número opcional dentro de rango. Devuelve { ok, value } o { ok:false, error }.
function parseMetric(name, raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { ok: false, error: `${name} debe ser numérico` };
  const [min, max] = RANGES[name];
  if (n < min || n > max) return { ok: false, error: `${name} fuera de rango (${min}-${max})` };
  return { ok: true, value: Math.round(n) };
}

function authorized(request) {
  if (!DEVICE_TOKEN) return true; // sin token configurado → abierto (modo prueba)
  const header = request.headers.get('authorization') || '';
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
  const alt = request.headers.get('x-device-token');
  return bearer === DEVICE_TOKEN || alt === DEVICE_TOKEN;
}

export async function POST(request) {
  const supabase = getServiceClient();
  if (!supabase) {
    // No caemos silenciosamente al anon key: sin service_role la inserción
    // sería bloqueada por RLS. Avisamos con un error explícito y 500.
    console.error('[biometria] Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL');
    return NextResponse.json(
      { error: 'Servidor mal configurado: falta la clave de servicio de Supabase' },
      { status: 500 }
    );
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: 'Token de dispositivo inválido' }, { status: 401 });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request mal formado (JSON inválido)' }, { status: 400 });
  }

  // Aceptamos tanto `niño_id` (con ñ) como `nino_id` (ASCII) para firmware
  // que no maneje bien caracteres no-ASCII.
  const ninoId = data.niño_id || data.nino_id;
  if (!ninoId || typeof ninoId !== 'string') {
    return NextResponse.json({ error: 'niño_id es requerido' }, { status: 400 });
  }

  const bpm = parseMetric('bpm', data.bpm);
  const hrv = parseMetric('hrv', data.hrv);
  const calma = parseMetric('nivel_calma', data.nivel_calma);
  for (const m of [bpm, hrv, calma]) {
    if (!m.ok) return NextResponse.json({ error: m.error }, { status: 400 });
  }

  const estado = typeof data.estado === 'string' && data.estado.trim() ? data.estado.trim() : 'activo';

  const { error: insertError } = await supabase.from('sesiones_biometria').insert([
    {
      'niño_id': ninoId,
      bpm: bpm.value,
      hrv: hrv.value,
      nivel_calma: calma.value,
      estado,
    },
  ]);

  if (insertError) {
    console.error('[biometria] Error insertando lectura:', insertError.message);
    // Código 23503 = foreign_key_violation → niño_id no existe.
    if (insertError.code === '23503') {
      return NextResponse.json({ error: 'niño_id no existe' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error interno de base de datos' }, { status: 500 });
  }

  // Heartbeat: marca los dispositivos de esta persona como activos y actualiza
  // last_seen. Best-effort: si falla no rompe la ingesta de la lectura.
  const { error: hbError } = await supabase
    .from('dispositivos')
    .update({ last_seen: new Date().toISOString(), estado: 'activo' })
    .eq('niño_id', ninoId);
  if (hbError) console.warn('[biometria] heartbeat no actualizado:', hbError.message);

  return NextResponse.json(
    { success: true, message: 'Lectura guardada' },
    { status: 201 }
  );
}

// Pequeño health-check para verificar configuración sin insertar nada.
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'biometria-ingest',
    configured: Boolean(getServiceClient()),
    tokenRequired: Boolean(DEVICE_TOKEN),
  });
}
