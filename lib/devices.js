// Acceso a los dispositivos (pulseras) de una persona.
// La contraseña WiFi cifrada NUNCA se selecciona aquí: el navegador no la necesita.

// Dispositivo más recientemente visto de la persona (o null).
export async function fetchDeviceForChild(supabase, ninoId) {
  if (!ninoId) return null;
  const { data } = await supabase
    .from("dispositivos")
    .select("id, nombre, modelo, wifi_ssid, estado, last_seen, ultima_conexion, auto_conexion")
    .eq("niño_id", ninoId)
    .order("last_seen", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}
