-- Migration: create professional_accounts table to support professional account identification
-- Date: 2026-01-29

-- One-to-one relationship: a user becomes a professional if they have a row in this table.
CREATE TABLE IF NOT EXISTS professional_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'professional',
  status TEXT NOT NULL DEFAULT 'active',
  company_name TEXT,
  cnpj TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_professional_accounts_role ON professional_accounts(role);
CREATE INDEX IF NOT EXISTS idx_professional_accounts_status ON professional_accounts(status);

-- Best-effort backfill: previous schema used users.is_pro for a "Pro" flag.
-- IMPORTANT: do NOT backfill professional_accounts from users.is_pro by default.
-- In this project, is_pro is used for subscription (Versão Pro), not for "conta profissional".
-- Creating professional_accounts rows for subscribers can incorrectly grant professional UI/features.
-- If you really want to migrate users into professional accounts, do it explicitly via role/account_type.
