-- Adds heuristic fitment hint columns extracted from parts.description
-- Run this in Supabase SQL editor (or via migration tooling).

ALTER TABLE parts
  ADD COLUMN IF NOT EXISTS fit_motor_hint TEXT,
  ADD COLUMN IF NOT EXISTS fit_versao_hint TEXT,
  ADD COLUMN IF NOT EXISTS fit_combustivel_hint TEXT,
  ADD COLUMN IF NOT EXISTS fit_cambio_hint TEXT,
  ADD COLUMN IF NOT EXISTS fit_carroceria_hint TEXT,
  ADD COLUMN IF NOT EXISTS fit_engine_l NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS fit_valvulas INT,
  ADD COLUMN IF NOT EXISTS fit_cilindros INT;

CREATE INDEX IF NOT EXISTS idx_parts_fit_motor_hint ON parts (fit_motor_hint);
CREATE INDEX IF NOT EXISTS idx_parts_fit_versao_hint ON parts (fit_versao_hint);
CREATE INDEX IF NOT EXISTS idx_parts_fit_combustivel_hint ON parts (fit_combustivel_hint);
