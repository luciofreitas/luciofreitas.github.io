-- Migration: add auth_id column to users for linking to Supabase/Firebase auth ids
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS auth_id text;

-- Optionally index for faster lookups
CREATE INDEX IF NOT EXISTS users_auth_id_idx ON users (auth_id);
