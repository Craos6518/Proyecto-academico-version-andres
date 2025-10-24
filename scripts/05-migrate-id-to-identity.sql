-- 05-migrate-id-to-identity.sql
-- Objetivo: convertir columnas `id` actualmente definidas como `integer primary key`
-- a columnas con identidad (auto-increment) en PostgreSQL/Supabase.
--
-- Advertencias y pasos previos (leer TODO antes de ejecutar):
-- 1) Hacer backup completo de la base de datos (pg_dump) o usar "Export" en Supabase.
-- 2) Ejecutar en ventana de mantenimiento si hay tráfico concurrido.
-- 3) Probar primero en una copia de la base de datos.
-- 4) Este script intenta ser compatible con Postgres 10+ usando ALTER ... ADD GENERATED
--    si está soportado; si no, crea secuencias manualmente y setea DEFAULT nextval(...).
-- 5) Ajusta los nombres de esquema/tablas si no estás en el esquema público.
--
-- Tablas objetivo: roles, users, subjects, enrollments, assignments, grades
-- Estrategia por tabla:
--  A) Asegurar que no existen constraints que impidan cambiar la columna (p.ej. PK se mantiene)
--  B) Crear secuencia propia si ALTER ... ADD GENERATED no es soportado
--  C) Asociar la secuencia a la columna mediante ALTER SEQUENCE OWNED BY y ALTER TABLE ALTER COLUMN SET DEFAULT
--  D) Alinear la secuencia para comenzar en MAX(id)+1
--
-- NOTA: Supabase usa Postgres; la forma segura general es crear secuencia y SET DEFAULT nextval
-- porque ALTER ... ADD GENERATED puede fallar en versiones o con columnas existentes.

BEGIN;

-- Helper: función auxiliar temporal para crear secuencia y asociarla a una columna
-- (si la columna ya tiene DEFAULT nextval(....) se respetará)

-- Para cada tabla: crear secuencia, setear sequence current value a max(id), setear default

-- roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'roles_id_seq' AND n.nspname = 'public') THEN
    CREATE SEQUENCE public.roles_id_seq;
  END IF;
  -- set sequence to max(id) or 1
  PERFORM setval('public.roles_id_seq', (SELECT COALESCE(MAX(id),0) FROM public.roles) + 1, false);
  -- set default only if not already set to nextval
  IF NOT EXISTS (
    SELECT 1 FROM pg_attrdef ad JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE ad.adrelid = 'public.roles'::regclass AND a.attname = 'id' AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval(%'
  ) THEN
    ALTER TABLE public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq');
  END IF;
  ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;
END$$;

-- users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'users_id_seq' AND n.nspname = 'public') THEN
    CREATE SEQUENCE public.users_id_seq;
  END IF;
  PERFORM setval('public.users_id_seq', (SELECT COALESCE(MAX(id),0) FROM public.users) + 1, false);
  IF NOT EXISTS (
    SELECT 1 FROM pg_attrdef ad JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE ad.adrelid = 'public.users'::regclass AND a.attname = 'id' AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval(%'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq');
  END IF;
  ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
END$$;

-- subjects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'subjects_id_seq' AND n.nspname = 'public') THEN
    CREATE SEQUENCE public.subjects_id_seq;
  END IF;
  PERFORM setval('public.subjects_id_seq', (SELECT COALESCE(MAX(id),0) FROM public.subjects) + 1, false);
  IF NOT EXISTS (
    SELECT 1 FROM pg_attrdef ad JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE ad.adrelid = 'public.subjects'::regclass AND a.attname = 'id' AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval(%'
  ) THEN
    ALTER TABLE public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq');
  END IF;
  ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;
END$$;

-- enrollments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'enrollments_id_seq' AND n.nspname = 'public') THEN
    CREATE SEQUENCE public.enrollments_id_seq;
  END IF;
  PERFORM setval('public.enrollments_id_seq', (SELECT COALESCE(MAX(id),0) FROM public.enrollments) + 1, false);
  IF NOT EXISTS (
    SELECT 1 FROM pg_attrdef ad JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE ad.adrelid = 'public.enrollments'::regclass AND a.attname = 'id' AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval(%'
  ) THEN
    ALTER TABLE public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq');
  END IF;
  ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;
END$$;

-- assignments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'assignments_id_seq' AND n.nspname = 'public') THEN
    CREATE SEQUENCE public.assignments_id_seq;
  END IF;
  PERFORM setval('public.assignments_id_seq', (SELECT COALESCE(MAX(id),0) FROM public.assignments) + 1, false);
  IF NOT EXISTS (
    SELECT 1 FROM pg_attrdef ad JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE ad.adrelid = 'public.assignments'::regclass AND a.attname = 'id' AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval(%'
  ) THEN
    ALTER TABLE public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq');
  END IF;
  ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;
END$$;

-- grades
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'grades_id_seq' AND n.nspname = 'public') THEN
    CREATE SEQUENCE public.grades_id_seq;
  END IF;
  PERFORM setval('public.grades_id_seq', (SELECT COALESCE(MAX(id),0) FROM public.grades) + 1, false);
  IF NOT EXISTS (
    SELECT 1 FROM pg_attrdef ad JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE ad.adrelid = 'public.grades'::regclass AND a.attname = 'id' AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval(%'
  ) THEN
    ALTER TABLE public.grades ALTER COLUMN id SET DEFAULT nextval('public.grades_id_seq');
  END IF;
  ALTER SEQUENCE public.grades_id_seq OWNED BY public.grades.id;
END$$;

-- OPTIONAL: If your Postgres supports GENERATED AS IDENTITY and you prefer that syntax, uncomment
-- the following ALTER statements after verifying sequences are set correctly. Keep in mind that
-- converting an existing column to IDENTITY directly may fail on some versions; the sequence
-- approach above is the most compatible.

-- ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;
-- ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;
-- ALTER TABLE public.subjects ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;
-- ALTER TABLE public.enrollments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;
-- ALTER TABLE public.assignments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;
-- ALTER TABLE public.grades ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;

COMMIT;

-- Verificaciones sugeridas después de ejecutar:
-- 1) INSERT en cada tabla sin especificar id: debe asignarse automáticamente.
--    INSERT INTO public.subjects (name) VALUES ('Prueba');
-- 2) Verificar la secuencia actual: SELECT last_value FROM public.subjects_id_seq;
-- 3) Alinear permisos si necesitas que el rol de la aplicación use la secuencia.

-- Reversión (si fuera necesario): eliminar DEFAULT y drop sequence (haz solo si entiendes el impacto):
-- ALTER TABLE public.subjects ALTER COLUMN id DROP DEFAULT;
-- DROP SEQUENCE public.subjects_id_seq;

-- Fin del script
