-- Migration: drop funcao from professional_accounts (no longer used)
-- Date: 2026-01-29

DROP INDEX IF EXISTS idx_professional_accounts_funcao;

ALTER TABLE IF EXISTS professional_accounts
  DROP COLUMN IF EXISTS funcao;
