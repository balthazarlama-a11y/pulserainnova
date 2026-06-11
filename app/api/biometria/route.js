import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos el cliente estándar de supabase-js con la service_role_key
// Esto permite saltarse las políticas RLS, esencial ya que el hardware envía datos de forma remota sin una sesión web de usuario.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request) {
  try {
    const data = await request.json();
    const { niño_id, bpm, hrv, nivel_calma, estado } = data;

    if (!niño_id) {
      return NextResponse.json({ error: 'niño_id es requerido' }, { status: 400 });
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

    return NextResponse.json({ success: true, message: 'Datos guardados correctamente' }, { status: 201 });
  } catch (error) {
    console.error('Error procesando request:', error);
    return NextResponse.json({ error: 'Request mal formado' }, { status: 400 });
  }
}
