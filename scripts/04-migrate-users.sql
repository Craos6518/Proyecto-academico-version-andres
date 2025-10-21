-- Migración: mejoras en tabla users para migración a Supabase Auth / hashing de contraseñas
-- Hacer backup antes de ejecutar

BEGIN;

-- 1) Añadir columnas necesarias para migración segura
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS supabase_id uuid,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2) Crear función y trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- 3) Crear secuencias (si la tabla fue creada sin serial/identity)
CREATE SEQUENCE IF NOT EXISTS roles_id_seq;
ALTER TABLE roles ALTER COLUMN id SET DEFAULT nextval('roles_id_seq');

CREATE SEQUENCE IF NOT EXISTS users_id_seq;
ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');

-- 4) Índices y constraints útiles
-- unique email (activa sólo si tu modelo exige email único)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique'
  ) THEN
    BEGIN
      ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    EXCEPTION WHEN duplicate_table THEN
      -- already exists data that violate constraint; handle manually
      RAISE NOTICE 'users.email may contain duplicates. Resolve manually before enforcing UNIQUE.';
    END;
  END IF;
END$$;

-- índice para búsqueda por supabase_id
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);

-- 5) Ajustar FK role_id con comportamiento ON DELETE
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- 6) Recomposición: NOTA
-- Después de verificar que `password_hash` está correctamente poblado o que
-- los usuarios fueron migrados a Supabase Auth, elimina la columna `password`:
-- ALTER TABLE users DROP COLUMN IF EXISTS password;

-- 7) Políticas (ejemplos) - activar RLS y policies tras revisar y adaptar
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY users_select_own ON users FOR SELECT USING (supabase_id = auth.uid());
-- CREATE POLICY users_update_own ON users FOR UPDATE USING (supabase_id = auth.uid()) WITH CHECK (supabase_id = auth.uid());

COMMIT;

-- FIN migración. Revisa los pasos adicionales en la documentación del proyecto.
