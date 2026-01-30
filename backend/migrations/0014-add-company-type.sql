-- Migration: add company_type to companies
-- Date: 2026-01-30

DO $$
BEGIN
  -- Add column with safe default
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'companies'
      AND column_name = 'company_type'
  ) THEN
    ALTER TABLE public.companies
      ADD COLUMN company_type TEXT NOT NULL DEFAULT 'oficina';
  END IF;
END$$;

-- Backfill any nulls (in case column existed without NOT NULL in some env)
UPDATE public.companies
SET company_type = 'oficina'
WHERE company_type IS NULL;

-- Enforce allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_company_type_chk'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_company_type_chk
      CHECK (company_type IN ('concessionaria','oficina','autopecas','centro_automotivo'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_companies_company_type ON public.companies(company_type);
