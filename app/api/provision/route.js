import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptWifiPassword } from "@/lib/wifiCrypto";

// ── Aprovisionamiento automático de la pulsera ────────────────────────────────
//
// Cuando el niño entra al colegio y la pulsera arranca, esta solo conoce su
// propia MAC. Llama a este endpoint con esa MAC y recibe de vuelta:
//   - el niño al que está asignada (niño_id) para enviar su biometría, y
//   - la red WiFi recordada (SSID + contraseña descifrada)
// para reconectarse SOLA a la última red conocida, sin ninguna acción del tutor.
//
// Usa service_role (salta RLS) porque el hardware no tiene sesión web.
// Es el único punto donde la contraseña WiFi vuelve a estar en claro, y solo se
// entrega al propio dispositivo dueño de esa MAC.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const normalizeMac = (mac) => (mac ? String(mac).trim().toUpperCase() : null);

async function provision(mac) {
  if (!mac) {
    return NextResponse.json({ error: "mac es requerida" }, { status: 400 });
  }

  const { data: dispositivo, error } = await supabase
    .from("dispositivos")
    .select("id, niño_id, nombre, wifi_ssid, wifi_password_cifrada, auto_conexion")
    .eq("mac_address", mac)
    .maybeSingle();

  if (error) {
    console.error("[provision] error consultando dispositivo:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  if (!dispositivo) {
    // MAC sin emparejar: el hardware debería entrar en modo de configuración.
    return NextResponse.json(
      { provisioned: false, reason: "no_emparejada" },
      { status: 404 }
    );
  }

  if (dispositivo.auto_conexion === false) {
    return NextResponse.json(
      { provisioned: false, reason: "auto_conexion_desactivada" },
      { status: 200 }
    );
  }

  // Marca el dispositivo como en línea (aprovisionado ahora mismo).
  const now = new Date().toISOString();
  await supabase
    .from("dispositivos")
    .update({ estado: "online", last_seen: now, ultima_conexion: now })
    .eq("id", dispositivo.id);

  return NextResponse.json(
    {
      provisioned: true,
      ninoId: dispositivo["niño_id"],
      nombre: dispositivo.nombre,
      wifi: {
        ssid: dispositivo.wifi_ssid,
        // Contraseña descifrada para que la pulsera se reconecte sola.
        password: decryptWifiPassword(dispositivo.wifi_password_cifrada),
      },
    },
    { status: 200 }
  );
}

// GET /api/provision?mac=F4:8E:38:CB:A3:F2
export async function GET(request) {
  const mac = normalizeMac(request.nextUrl.searchParams.get("mac"));
  return provision(mac);
}

// POST /api/provision  { "mac": "F4:8E:38:CB:A3:F2" }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  return provision(normalizeMac(body?.mac));
}
