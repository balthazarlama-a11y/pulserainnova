import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos el cliente estándar de supabase-js con la service_role_key
// Esto permite saltarse las políticas RLS, esencial ya que el hardware envía datos de forma remota sin una sesión web de usuario.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const normalizeMac = (mac) => (mac ? String(mac).trim().toUpperCase() : null);

export async function POST(request) {
  try {
    const data = await request.json();
    let { niño_id, mac, bpm, hrv, nivel_calma, estado } = data;

    // La pulsera puede identificarse por su niño_id o, más cómodo para el
    // hardware autoconfigurado, por su MAC (que ya conoce al arrancar).
    let dispositivoId = null;
    if (!niño_id && mac) {
      const { data: disp } = await supabase
        .from('dispositivos')
        .select('id, niño_id')
        .eq('mac_address', normalizeMac(mac))
        .maybeSingle();
      if (disp) {
        niño_id = disp['niño_id'];
        dispositivoId = disp.id;
      }
    }

    if (!niño_id) {
      return NextResponse.json({ error: 'niño_id o mac es requerido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sesiones_biometria')
      .insert([
        {
          niño_id,
          bpm: bpm || null,
          hrv: hrv || null,
          nivel_calma: nivel_calma || null,
          estado: estado || 'activo'
        }
      ]);

    if (error) {
      console.error('Error insertando biometria:', error);
      return NextResponse.json({ error: 'Error interno de base de datos' }, { status: 500 });
    }

    // Cada lectura es también un "heartbeat": mantenemos el dispositivo marcado
    // como en línea para que el estado de conexión en el dashboard sea fiel y
    // en vivo, sin acciones manuales.
    const now = new Date().toISOString();
    const heartbeat = { estado: 'online', last_seen: now, ultima_conexion: now };
    if (dispositivoId) {
      await supabase.from('dispositivos').update(heartbeat).eq('id', dispositivoId);
    } else if (mac) {
      await supabase.from('dispositivos').update(heartbeat).eq('mac_address', normalizeMac(mac));
    } else {
      await supabase.from('dispositivos').update(heartbeat).eq('niño_id', niño_id);
    }

    return NextResponse.json({ success: true, message: 'Datos guardados correctamente' }, { status: 201 });
  } catch (error) {
    console.error('Error procesando request:', error);
    return NextResponse.json({ error: 'Request mal formado' }, { status: 400 });
  }
}
