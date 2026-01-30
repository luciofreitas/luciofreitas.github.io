-- Migration: create companies table and link professional_accounts -> companies
-- Date: 2026-01-30

-- Supabase/Postgres: gen_random_uuid() is provided by pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT,
  trade_name TEXT,
  brand TEXT,
  company_code TEXT NOT NULL UNIQUE,
  cnpj TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  matricula_prefix TEXT NOT NULL,
  next_matricula_seq INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT companies_status_chk CHECK (status IN ('active','pending','suspended'))
);

CREATE INDEX IF NOT EXISTS idx_companies_brand ON companies(brand);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_trade_name ON companies(trade_name);

ALTER TABLE IF EXISTS professional_accounts
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_professional_accounts_company_id
  ON professional_accounts(company_id);

-- Enforce unique matricula when present (safe for nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ux_professional_accounts_matricula_not_null'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_professional_accounts_matricula_not_null ON professional_accounts(matricula) WHERE matricula IS NOT NULL';
  END IF;
END$$;
