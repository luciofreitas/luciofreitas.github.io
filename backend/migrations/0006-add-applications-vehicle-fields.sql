-- Add extra vehicle compatibility fields to applications

ALTER TABLE applications ADD COLUMN IF NOT EXISTS versao TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS combustivel TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cambio TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS carroceria TEXT;
