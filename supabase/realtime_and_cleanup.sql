-- ============================================================================
-- CalmBand — Habilitar Realtime + limpiar lecturas de prueba
-- Ejecutar en: Supabase Dashboard → SQL Editor (proyecto kgamvzlehrnvpwwnjamp)
-- ============================================================================

-- 1. Realtime: que el dashboard reciba INSERTs en vivo sin recargar.
--    (Reemplaza al paso manual "Database → Replication" que cambió de lugar.)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sesiones_biometria;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'sesiones_biometria ya estaba en supabase_realtime';
END $$;

-- 2. Limpiar lecturas no fisiológicas de las primeras pruebas
--    (bpm fuera de rango o HRV inflado por el jitter del sensor).
--    Revisá el SELECT antes de borrar si querés ver qué se va.
-- SELECT count(*) FROM sesiones_biometria
--   WHERE bpm IS NULL OR bpm < 40 OR bpm > 180 OR hrv > 150;

DELETE FROM sesiones_biometria
WHERE bpm IS NULL OR bpm < 40 OR bpm > 180 OR hrv > 150;
