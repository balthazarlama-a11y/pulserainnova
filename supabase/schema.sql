-- Habilitar extensión para UUIDs (por si acaso, aunque Supabase lo trae por defecto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Colegios
CREATE TABLE IF NOT EXISTS colegios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    plan TEXT DEFAULT 'básico',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Usuarios (reemplaza profiles)
-- Roles posibles: 'tutor', 'niño', 'admin_colegio'
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT DEFAULT 'tutor' CHECK (rol IN ('tutor', 'niño', 'admin_colegio')),
    colegio_id UUID REFERENCES colegios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Niños (personas que llevan la pulsera)
CREATE TABLE IF NOT EXISTS niños (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    tutor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    colegio_id UUID REFERENCES colegios(id) ON DELETE SET NULL,
    avatar TEXT,
    fecha_nacimiento DATE,
    edad INTEGER,
    bpm_reposo INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Columnas añadidas para perfiles ya existentes
ALTER TABLE niños ADD COLUMN IF NOT EXISTS edad INTEGER;
ALTER TABLE niños ADD COLUMN IF NOT EXISTS bpm_reposo INTEGER;

-- 4. Sesiones Biometria
CREATE TABLE IF NOT EXISTS sesiones_biometria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    niño_id UUID NOT NULL REFERENCES niños(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bpm INTEGER,
    hrv INTEGER,
    nivel_calma INTEGER,
    estado TEXT
);

-- 5. Eventos de Actividad
CREATE TABLE IF NOT EXISTS eventos_actividad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    niño_id UUID NOT NULL REFERENCES niños(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo TEXT NOT NULL,
    descripcion TEXT
);

-- 6. Juegos Completados
CREATE TABLE IF NOT EXISTS juegos_completados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    niño_id UUID NOT NULL REFERENCES niños(id) ON DELETE CASCADE,
    juego_id TEXT NOT NULL,
    duracion_seg INTEGER,
    puntuacion INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Ejercicios de Respiracion
CREATE TABLE IF NOT EXISTS ejercicios_respiracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    niño_id UUID NOT NULL REFERENCES niños(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    duracion_seg INTEGER,
    completado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Dispositivos (pulseras vinculadas a una persona + red WiFi)
CREATE TABLE IF NOT EXISTS dispositivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    niño_id UUID NOT NULL REFERENCES niños(id) ON DELETE CASCADE,
    nombre TEXT,
    modelo TEXT,
    mac_address TEXT,
    wifi_ssid TEXT,
    estado TEXT DEFAULT 'vinculado',
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE niños ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_biometria ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE juegos_completados ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicios_respiracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;

-- Políticas para `usuarios`
-- Un usuario puede ver y editar su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil" ON usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON usuarios FOR UPDATE USING (auth.uid() = id);

-- Políticas para `niños`
-- Tutores pueden ver y modificar solo los niños asociados a su tutor_id
CREATE POLICY "Tutores ven a sus niños" ON niños FOR SELECT USING (tutor_id = auth.uid());
CREATE POLICY "Tutores pueden insertar niños" ON niños FOR INSERT WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "Tutores pueden actualizar a sus niños" ON niños FOR UPDATE USING (tutor_id = auth.uid());
CREATE POLICY "Tutores pueden eliminar a sus niños" ON niños FOR DELETE USING (tutor_id = auth.uid());

-- Políticas para Tablas Biométricas y de Actividad
-- Para estas tablas, el tutor solo puede ver datos si el `niño_id` le pertenece.
-- Niños no tendrán acceso de SELECT debido a que estas políticas filtran estrictamente por tutor_id.

-- sesiones_biometria
CREATE POLICY "Tutores ven biometria de sus niños" ON sesiones_biometria FOR SELECT
USING (niño_id IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));

-- eventos_actividad
CREATE POLICY "Tutores ven actividad de sus niños" ON eventos_actividad FOR SELECT
USING (niño_id IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));

-- juegos_completados
CREATE POLICY "Tutores ven juegos de sus niños" ON juegos_completados FOR SELECT
USING (niño_id IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));

-- ejercicios_respiracion
CREATE POLICY "Tutores ven ejercicios de sus niños" ON ejercicios_respiracion FOR SELECT
USING (niño_id IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));

-- dispositivos: el tutor gestiona solo los dispositivos de sus niños
CREATE POLICY "Tutores ven dispositivos de sus niños" ON dispositivos FOR SELECT
USING (niño_id IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));
CREATE POLICY "Tutores vinculan dispositivos a sus niños" ON dispositivos FOR INSERT
WITH CHECK (niño_id IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));
CREATE POLICY "Tutores actualizan dispositivos de sus niños" ON dispositivos FOR UPDATE
USING (niño_id IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));
CREATE POLICY "Tutores eliminan dispositivos de sus niños" ON dispositivos FOR DELETE
USING (niño_id IN (SELECT id FROM niños WHERE tutor_id = auth.uid()));

-- (La inserción biométrica desde la pulsera se asume que se hará con el service_role key o un rol específico que salta RLS)

-- ==========================================
-- TRIGGER DE AUTENTICACIÓN
-- ==========================================
-- Crea una entrada en `usuarios` automáticamente cuando alguien se registra en `auth.users`

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, rol)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    COALESCE(new.raw_user_meta_data->>'rol', 'tutor')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador después del INSERT en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
