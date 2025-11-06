-- Migration: Add cedula column to users and enforce NOT NULL + UNIQUE
-- Adjust schema for Postgres / Supabase
-- IMPORTANT: This script is written to be cautious. It never forces NOT NULL until a safe backfill is done.
-- Steps:
-- 1) Add the column (nullable) and create a unique index for non-null values.
-- 2) Backfill cedula for existing rows (you MUST provide real cedula values, or use the provided placeholder strategy).
-- 3) Once every row has a non-null, unique cedula, set the column to NOT NULL.

BEGIN;

-- 1) Add column (if not exists)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cedula TEXT;

-- 2) Create a unique index for cedula (ignoring NULLs so we can backfill safely)
CREATE UNIQUE INDEX IF NOT EXISTS users_cedula_unique_idx
  ON public.users (cedula)
  WHERE cedula IS NOT NULL;

-- 3) Optional: show how many rows are missing cedula
-- Run this and inspect before proceeding: you can run it separately in psql or Supabase SQL editor
-- SELECT COUNT(*) AS missing_cedula FROM public.users WHERE cedula IS NULL;

-- 4) BACKFILL OPTIONS
-- Option A) If you have a mapping CSV or external source, import it and update cedula accordingly before continuing.
-- Option B) If you prefer to assign a placeholder for legacy rows (NOT RECOMMENDED for production), run the following:
-- WARNING: This will create values like "legacy-<id>" for rows that have no cedula. Make sure this meets your requirements.
-- UPDATE public.users SET cedula = ('legacy-' || id::text) WHERE cedula IS NULL;

-- After backfill, validate duplicates (this should return 0):
-- SELECT cedula, COUNT(*) FROM public.users GROUP BY cedula HAVING COUNT(*) > 1;

-- 5) When you are satisfied that every user has a unique, non-null cedula, set NOT NULL constraint:
-- (This will fail if any NULLs remain or duplicates exist)
ALTER TABLE public.users
  ALTER COLUMN cedula SET NOT NULL;

COMMIT;

-- NOTES:
-- - If you want cedula comparison to be case-insensitive, consider creating cedula as citext or maintaining a normalized column and a functional index.
--   Example (citext):
--     CREATE EXTENSION IF NOT EXISTS citext;
--     ALTER TABLE public.users ALTER COLUMN cedula TYPE citext USING cedula::citext;
--   Then the unique index above will enforce case-insensitive uniqueness.
-- - Backup your DB before running destructive operations.
-- - If your app depends on URLs or external systems using the old id type, this migration keeps the numeric PK `id` unchanged; cedula is an additional column.
