import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptWifiPassword } from "@/lib/wifiCrypto";

// Persiste el emparejamiento de una pulsera: asigna el dispositivo a una persona
// (creándola si viene `newPerson`) y a una red WiFi. Usa el cliente con cookies,
// por lo que la sesión del usuario aplica RLS (no service_role).
//
// AUTO-RECONEXIÓN: la contraseña WiFi se cifra (AES-256-GCM) y se guarda junto
// al SSID. Así la red queda "recordada" y la pulsera puede re-aprovisionarse
// sola (endpoint /api/provision) cuando el niño entra al colegio, sin que el
// tutor vuelva a configurar nada. La contraseña nunca se guarda ni se devuelve
// en claro al navegador.
export async function POST(request) {
  const supabase = createClient();

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = userData.user.id;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  let { ninoId, newPerson, device } = body;
  const {
    nombre: devNombre,
    modelo,
    mac,
    wifiSsid,
    wifiPassword,
    autoConexion = true,
  } = device || {};

  // 1. Resolver/crear la persona (niño).
  if (!ninoId) {
    if (!newPerson?.nombre) {
      return NextResponse.json({ error: "Falta la persona" }, { status: 400 });
    }
    const { data: created, error: personError } = await supabase
      .from("niños")
      .insert({
        nombre: newPerson.nombre,
        edad: newPerson.edad ?? null,
        tutor_id: userId,
        avatar: (newPerson.nombre[0] || "?").toUpperCase(),
      })
      .select("id")
      .single();
    if (personError) {
      console.error("[pairing] error creando persona:", personError);
      return NextResponse.json({ error: "No se pudo crear la persona" }, { status: 500 });
    }
    ninoId = created.id;
  }

  // Cifra la contraseña para "recordar" la red (auto-reconexión). Nunca en claro.
  const wifiPasswordCifrada = encryptWifiPassword(wifiPassword);

  const deviceRow = {
    "niño_id": ninoId,
    nombre: devNombre || "CalmBand",
    modelo: modelo || null,
    mac_address: mac || null,
    wifi_ssid: wifiSsid || null,
    wifi_password_cifrada: wifiPasswordCifrada,
    auto_conexion: autoConexion !== false,
    estado: "vinculado",
    last_seen: new Date().toISOString(),
  };

  // 2. Insertar/actualizar el dispositivo. Si la pulsera (por MAC) ya existe,
  // hacemos upsert para que la red recordada se actualice en vez de duplicar.
  const query = mac
    ? supabase.from("dispositivos").upsert(deviceRow, { onConflict: "mac_address" })
    : supabase.from("dispositivos").insert(deviceRow);

  const { data: dispositivo, error: deviceError } = await query.select("*").single();

  if (deviceError) {
    console.error("[pairing] error guardando dispositivo:", deviceError);
    return NextResponse.json({ error: "No se pudo vincular el dispositivo" }, { status: 500 });
  }

  // No devolvemos la contraseña cifrada al cliente.
  if (dispositivo) delete dispositivo.wifi_password_cifrada;

  return NextResponse.json({ success: true, ninoId, dispositivo }, { status: 201 });
}
