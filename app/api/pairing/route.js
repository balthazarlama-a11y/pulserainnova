import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Persiste el emparejamiento de una pulsera: asigna el dispositivo a una persona
// (creándola si viene `newPerson`) y a una red WiFi. Usa el cliente con cookies,
// por lo que la sesión del usuario aplica RLS (no service_role).
//
// La contraseña WiFi NO se persiste: se "provisiona" al hardware en el momento
// del emparejamiento. Solo guardamos el SSID para mostrarlo en el panel.
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
  const { nombre: devNombre, modelo, mac, wifiSsid } = device || {};

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

  // 2. Insertar el dispositivo vinculado.
  const { data: dispositivo, error: deviceError } = await supabase
    .from("dispositivos")
    .insert({
      "niño_id": ninoId,
      nombre: devNombre || "CalmBand",
      modelo: modelo || null,
      mac_address: mac || null,
      wifi_ssid: wifiSsid || null,
      estado: "vinculado",
      last_seen: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (deviceError) {
    console.error("[pairing] error insertando dispositivo:", deviceError);
    return NextResponse.json({ error: "No se pudo vincular el dispositivo" }, { status: 500 });
  }

  return NextResponse.json({ success: true, ninoId, dispositivo }, { status: 201 });
}
