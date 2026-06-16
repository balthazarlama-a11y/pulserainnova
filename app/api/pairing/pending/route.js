import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lista las pulseras que se auto-registraron y aún no están asignadas a una
// persona (estado 'pendiente', vistas en los últimos 10 min). Las usa la
// pantalla de vinculación para que el tutor elija cuál conectar sin tipear MAC.
export async function GET() {
  const supabase = createClient();

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("list_pending_devices");
  if (error) {
    console.error("[pairing/pending] error:", error);
    return NextResponse.json({ error: "No se pudieron listar las pulseras" }, { status: 500 });
  }

  return NextResponse.json({ devices: data || [] });
}
