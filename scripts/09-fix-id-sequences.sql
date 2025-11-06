-- Migration: Create sequences and set defaults for integer PKs that lack identity/serial defaults
-- This script is idempotent and can be run safely multiple times.

-- For each table we:
-- 1) create a sequence if not exists
-- 2) setseq to max(id)+1
-- 3) set default nextval(...) on the id column
-- 4) set sequence ownership to table.id

DO $$
DECLARE
  rec RECORD;
  tbl text;
  seqname text;
  maxid bigint;
BEGIN
  FOR rec IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN ('roles','users','subjects','enrollments','assignments','grades')
  LOOP
    tbl := rec.table_name;
    seqname := tbl || '_id_seq';
    -- skip if the table doesn't have an 'id' column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = tbl AND c.column_name = 'id'
    ) THEN
      RAISE NOTICE 'Skipping table % because it has no id column', tbl;
      CONTINUE;
    END IF;
    -- create sequence if missing
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', seqname);
    -- compute max id
    EXECUTE format('SELECT COALESCE(MAX(id),0) FROM %I', tbl) INTO maxid;
    -- set sequence value to max(id)+1 so nextval returns a safe new id
    EXECUTE format('SELECT setval(%L, %s, false)', seqname, (maxid + 1)::text);
    RAISE NOTICE 'Table %: max(id) = %, ensured sequence % start = %', tbl, maxid, seqname, (maxid + 1)::text;
    -- set default on table.id if not already set
    -- Use information_schema to avoid casting issues with ::regclass when table names
    -- contain unusual characters or when the runner does not allow psql metacommands.
    IF NOT EXISTS (
      -- check whether the id column already has a default that references this sequence
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = tbl
        AND c.column_name = 'id'
        AND c.column_default IS NOT NULL
        AND c.column_default LIKE ('%' || seqname || '%')
    ) THEN
      RAISE NOTICE 'Setting default for %.id -> nextval(%).', tbl, seqname;
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT nextval(%L)', tbl, seqname);
      RAISE NOTICE 'Default set for %.id', tbl;
    ELSE
      RAISE NOTICE 'Default already present for %.id, skipping', tbl;
    END IF;
    -- ensure sequence ownership
    EXECUTE format('ALTER SEQUENCE %I OWNED BY %I.id', seqname, tbl);
  END LOOP;
END$$;

-- Quick checks (not required): show new defaults
-- SELECT table_name, column_default FROM information_schema.columns WHERE column_name='id' AND table_schema='public';
