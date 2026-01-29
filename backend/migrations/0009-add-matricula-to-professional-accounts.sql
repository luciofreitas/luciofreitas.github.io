-- Migration: add matricula to professional_accounts
-- Date: 2026-01-29

ALTER TABLE IF EXISTS professional_accounts
  ADD COLUMN IF NOT EXISTS matricula TEXT;

CREATE INDEX IF NOT EXISTS idx_professional_accounts_matricula
  ON professional_accounts(matricula);
