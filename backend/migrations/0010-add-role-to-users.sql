-- Migration: add role column to users to differentiate account type
-- Date: 2026-01-29

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(role);
