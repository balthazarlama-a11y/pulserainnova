-- ============================================================================
-- CalmBand — Horario semanal de actividades por persona
-- Ejecutar en: Supabase Dashboard → SQL Editor (proyecto kgamvzlehrnvpwwnjamp)
-- ============================================================================

CREATE TABLE IF NOT EXISTS horario_actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    niño_id UUID NOT NULL REFERENCES niños(id) ON DELETE CASCADE,
    dia SMALLINT NOT NULL CHECK (dia BETWEEN 0 AND 6),   -- 0 = Lun … 6 = Dom
    hora TIME NOT NULL,                                  -- hora de inicio
    hora_fin TIME,                                       -- hora de fin (opcional → bloque de clase)
    titulo TEXT NOT NULL,                                -- nombre de la clase / actividad
    categoria TEXT NOT NULL DEFAULT 'clase',             -- clase | comida | terapia | recreo | otro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Para instalaciones que ya tenían la tabla sin estas columnas:
ALTER TABLE horario_actividades ADD COLUMN IF NOT EXISTS hora_fin TIME;
ALTER TABLE horario_actividades ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'clase';

CREATE INDEX IF NOT EXISTS idx_horario_nino_dia ON horario_actividades ("niño_id", dia);

ALTER TABLE horario_actividades ENABLE ROW LEVEL SECURITY;

-- El tutor gestiona solo las actividades de sus niños.
DROP POLICY IF EXISTS "Tutores ven horario de sus niños"        ON horario_actividades;
DROP POLICY IF EXISTS "Tutores agregan horario a sus niños"     ON horario_actividades;
DROP POLICY IF EXISTS "Tutores actualizan horario de sus niños" ON horario_actividades;
DROP POLICY IF EXISTS "Tutores borran horario de sus niños"     ON horario_actividades;

CREATE POLICY "Tutores ven horario de sus niños" ON horario_actividades FOR SELECT
  USING ("niño_id" IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));
CREATE POLICY "Tutores agregan horario a sus niños" ON horario_actividades FOR INSERT
  WITH CHECK ("niño_id" IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));
CREATE POLICY "Tutores actualizan horario de sus niños" ON horario_actividades FOR UPDATE
  USING ("niño_id" IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));
CREATE POLICY "Tutores borran horario de sus niños" ON horario_actividades FOR DELETE
  USING ("niño_id" IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));
