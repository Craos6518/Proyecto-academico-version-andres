-- Migration: Safely drop textual `role` column from users table
-- WARNING: This will remove the free-text `role` column. Only run after verifying
-- that all application code and seed data no longer depend on `users.role`.

BEGIN;

-- 1) Create a backup of existing textual roles (if any)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
    -- Create backup table with id and role for auditing
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users_role_text_backup') THEN
      CREATE TABLE public.users_role_text_backup AS
      SELECT id, role, role_name, role_id FROM public.users WHERE role IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_role_text_backup_id ON public.users_role_text_backup(id);
    ELSE
      -- Append any missing rows to backup
      INSERT INTO public.users_role_text_backup(id, role, role_name, role_id)
      SELECT id, role, role_name, role_id FROM public.users u
      WHERE role IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.users_role_text_backup b WHERE b.id = u.id);
    END IF;
  END IF;
END$$;

-- 2) Drop the textual `role` column if it exists
ALTER TABLE public.users DROP COLUMN IF EXISTS role;

-- 3) Optionally drop role_name as well if you intentionally remove textual copies
-- ALTER TABLE public.users DROP COLUMN IF EXISTS role_name;

COMMIT;

-- Notes:
-- - This script creates a backup table `users_role_text_backup` for auditing before dropping the column.
-- - Review the backup and run any additional synchronization before removing `role_name`.
-- - Make sure to update application code before applying in production.
