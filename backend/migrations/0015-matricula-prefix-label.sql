-- Migration: document matricula_prefix as company code
-- Date: 2026-01-30

DO $$
BEGIN
  -- Only apply if companies table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'companies'
  ) THEN
    -- Add/update documentation on the column (does not affect runtime)
    BEGIN
      EXECUTE 'COMMENT ON COLUMN public.companies.matricula_prefix IS ''Código da empresa (usado para gerar matrículas automaticamente)''';
    EXCEPTION WHEN undefined_column THEN
      -- Older DBs might not have the column
      NULL;
    END;
  END IF;
END$$;
