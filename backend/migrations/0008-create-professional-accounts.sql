-- Migration: create professional_accounts table to support separate professional onboarding/dashboard
-- Date: 2026-01-29

-- One-to-one relationship: a user becomes a professional if they have a row in this table.
CREATE TABLE IF NOT EXISTS professional_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'professional',
  status TEXT NOT NULL DEFAULT 'active',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  company_name TEXT,
  cnpj TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_professional_accounts_role ON professional_accounts(role);
CREATE INDEX IF NOT EXISTS idx_professional_accounts_status ON professional_accounts(status);

-- Best-effort backfill: previous schema used users.is_pro for a "Pro" flag.
-- If your project used is_pro to mean "professional", this will migrate those users.
-- If is_pro means only subscription (not a professional account), you can remove this section.
INSERT INTO professional_accounts(user_id, role, status)
SELECT id, 'professional', 'active'
FROM users
WHERE COALESCE(is_pro, false) = true
ON CONFLICT (user_id) DO NOTHING;
