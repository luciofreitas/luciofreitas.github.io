-- 0018 - Create company_users (employees) table
-- Date: 2026-02-03

-- Links a user to a company with an explicit membership record.
-- This avoids trusting self-declared company selection and allows audits/history.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  matricula TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  role TEXT NOT NULL DEFAULT 'employee',
  job_title TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT company_users_status_chk CHECK (status IN ('pending','active','blocked')),
  CONSTRAINT company_users_role_chk CHECK (role IN ('owner','admin','employee')),
  CONSTRAINT ux_company_users_user_company UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON company_users(status);
CREATE INDEX IF NOT EXISTS idx_company_users_role ON company_users(role);
