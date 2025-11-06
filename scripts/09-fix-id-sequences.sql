-- Migration: Create sequences and set defaults for integer PKs that lack identity/serial defaults
-- This script is idempotent and can be run safely multiple times.

-- For each table we:
-- 1) create a sequence if not exists
-- 2) setseq to max(id)+1
-- 3) set default nextval(...) on the id column
-- 4) set sequence ownership to table.id

\set ON_ERROR_STOP on

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
    -- create sequence if missing
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', seqname);
    -- compute max id
    EXECUTE format('SELECT COALESCE(MAX(id),0) FROM %I', tbl) INTO maxid;
    -- set sequence value to max(id)+1 so nextval returns a safe new id
    EXECUTE format('SELECT setval(%L, %s, false)', seqname, (maxid + 1)::text);
    -- set default on table.id if not already set
    IF NOT EXISTS (
      SELECT 1 FROM pg_attrdef d JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.adnum = a.attnum
      WHERE a.attrelid = (tbl || '::regclass')::regclass AND a.attname = 'id'
      AND pg_get_expr(d.adbin, d.adrelid) LIKE ('nextval(%' || seqname || '%')
    ) THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT nextval(%L)', tbl, seqname);
    END IF;
    -- ensure sequence ownership
    EXECUTE format('ALTER SEQUENCE %I OWNED BY %I.id', seqname, tbl);
  END LOOP;
END$$;

-- Quick checks (not required): show new defaults
-- SELECT table_name, column_default FROM information_schema.columns WHERE column_name='id' AND table_schema='public';
