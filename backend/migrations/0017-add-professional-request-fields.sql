-- 0017 - Add professional request fields (company join approval workflow)
-- Date: 2026-02-03

-- Adds requested_* columns so a user can request a company association
-- without being granted professional access until approved.

ALTER TABLE IF EXISTS professional_accounts
  ADD COLUMN IF NOT EXISTS requested_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS professional_accounts
  ADD COLUMN IF NOT EXISTS requested_company_name TEXT;

ALTER TABLE IF EXISTS professional_accounts
  ADD COLUMN IF NOT EXISTS requested_matricula TEXT;

ALTER TABLE IF EXISTS professional_accounts
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP DEFAULT now();

ALTER TABLE IF EXISTS professional_accounts
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

ALTER TABLE IF EXISTS professional_accounts
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

CREATE INDEX IF NOT EXISTS idx_professional_accounts_requested_company_id
  ON professional_accounts(requested_company_id);

CREATE INDEX IF NOT EXISTS idx_professional_accounts_requested_at
  ON professional_accounts(requested_at);
