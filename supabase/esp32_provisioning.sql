-- ============================================================================
-- CalmBand — Provisioning + ingesta por MAC (ESP32)
-- Ejecutar en: Supabase Dashboard → SQL Editor (proyecto kgamvzlehrnvpwwnjamp)
--
-- La pulsera se identifica por su MAC, no por niño_id. Se registra sola al
-- conectarse (estado 'pendiente') y el tutor la asigna a una persona desde la
-- web. La biometría se inserta a través de funciones SECURITY DEFINER, de modo
-- que la anon key (pública) solo puede REGISTRAR y ENVIAR lecturas, nunca
-- escribir filas arbitrarias.
-- ============================================================================

-- 1. Una pulsera puede existir antes de asignarse a una persona.
ALTER TABLE dispositivos ALTER COLUMN "niño_id" DROP NOT NULL;

-- 2. La MAC es única (clave de upsert / identidad del dispositivo).
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS firmware TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dispositivos_mac_unique'
  ) THEN
    ALTER TABLE dispositivos ADD CONSTRAINT dispositivos_mac_unique UNIQUE (mac_address);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Auto-registro de la pulsera al conectarse (idempotente por MAC).
--    Si la MAC ya existe, solo refresca last_seen / modelo / firmware.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_device(
  p_mac      text,
  p_modelo   text DEFAULT NULL,
  p_firmware text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO dispositivos (mac_address, modelo, firmware, nombre, estado, last_seen)
  VALUES (p_mac, p_modelo, p_firmware, 'CalmBand', 'pendiente', now())
  ON CONFLICT (mac_address) DO UPDATE
    SET last_seen = now(),
        firmware  = COALESCE(EXCLUDED.firmware, dispositivos.firmware),
        modelo    = COALESCE(EXCLUDED.modelo,   dispositivos.modelo);
  RETURN 'ok';
END $$;

-- ----------------------------------------------------------------------------
-- 4. Ingesta de biometría resuelta por MAC.
--    Si la pulsera aún no está asignada a una persona, no inserta lectura,
--    solo actualiza presencia y responde 'unassigned'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ingest_biometria(
  p_mac    text,
  p_bpm    int,
  p_hrv    int,
  p_calma  int,
  p_estado text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_nino uuid;
BEGIN
  SELECT "niño_id" INTO v_nino FROM dispositivos WHERE mac_address = p_mac;

  IF NOT FOUND THEN
    -- MAC desconocida: la registramos como pendiente y salimos.
    PERFORM public.register_device(p_mac, NULL, NULL);
    RETURN 'unassigned';
  END IF;

  UPDATE dispositivos SET last_seen = now() WHERE mac_address = p_mac;

  IF v_nino IS NULL THEN
    RETURN 'unassigned';
  END IF;

  INSERT INTO sesiones_biometria ("niño_id", bpm, hrv, nivel_calma, estado)
  VALUES (v_nino, p_bpm, p_hrv, p_calma, p_estado);
  RETURN 'ok';
END $$;

-- ----------------------------------------------------------------------------
-- 5. Asignar una pulsera (por MAC) a una persona del tutor autenticado.
--    Comprueba que la persona pertenezca a quien llama (RLS efectiva).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_device(
  p_mac     text,
  p_nino_id uuid,
  p_nombre  text DEFAULT NULL,
  p_wifi    text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM niños WHERE id = p_nino_id AND tutor_id = auth.uid()) THEN
    RAISE EXCEPTION 'La persona no pertenece al tutor autenticado';
  END IF;

  INSERT INTO dispositivos (mac_address, "niño_id", nombre, wifi_ssid, estado, last_seen)
  VALUES (p_mac, p_nino_id, COALESCE(p_nombre,'CalmBand'), p_wifi, 'vinculado', now())
  ON CONFLICT (mac_address) DO UPDATE
    SET "niño_id"  = EXCLUDED."niño_id",
        nombre     = COALESCE(EXCLUDED.nombre, dispositivos.nombre),
        wifi_ssid  = COALESCE(EXCLUDED.wifi_ssid, dispositivos.wifi_ssid),
        estado     = 'vinculado',
        last_seen  = now();
  RETURN 'ok';
END $$;

-- ----------------------------------------------------------------------------
-- 6. Listar pulseras "online" (vistas hace poco) para conectarlas — estén o no
--    ya asignadas a otra cuenta. Modelo de "toma libre": cualquiera puede
--    conectarse a una pulsera; `asignada` indica si hoy la tiene otra persona
--    (al conectarla, claim_device la mueve a quien la reclama). Solo expone
--    MAC/modelo/last_seen, nunca a quién pertenece.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.list_pending_devices();
CREATE OR REPLACE FUNCTION public.list_pending_devices()
RETURNS TABLE (mac_address text, modelo text, last_seen timestamptz, asignada boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT mac_address, modelo, last_seen, ("niño_id" IS NOT NULL) AS asignada
  FROM dispositivos
  WHERE mac_address IS NOT NULL
    AND last_seen > now() - interval '10 minutes'
  ORDER BY last_seen DESC;
$$;

-- ----------------------------------------------------------------------------
-- 7. Permisos: la pulsera (anon) solo puede registrarse y enviar biometría.
--    El tutor autenticado puede listar pendientes y reclamar.
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.register_device(text,text,text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_biometria(text,int,int,int,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_pending_devices()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_device(text,uuid,text,text)      TO authenticated;
