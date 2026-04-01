-- Diagnose migration metadata table existence
-- This script is safe to run in Supabase SQL Editor.

-- 1) Check whether schema exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.schemata
  WHERE schema_name = 'supabase_migrations'
) AS has_supabase_migrations_schema;

-- 2) Check whether table exists
SELECT to_regclass('supabase_migrations.schema_migrations') AS schema_migrations_regclass;

-- 3) Safe read only when table exists (avoids "relation does not exist")
DO $$
DECLARE
  rel regclass;
BEGIN
  rel := to_regclass('supabase_migrations.schema_migrations');
  IF rel IS NULL THEN
    RAISE NOTICE 'supabase_migrations.schema_migrations does not exist.';
    RAISE NOTICE 'If you do not use Supabase CLI migrations, this is usually harmless.';
  ELSE
    RAISE NOTICE 'supabase_migrations.schema_migrations exists.';
  END IF;
END $$;
