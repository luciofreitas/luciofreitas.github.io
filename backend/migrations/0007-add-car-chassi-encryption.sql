-- Store user-provided VIN/Chassi securely in the DB.
-- We avoid storing plaintext VIN in JSONB `dados`.

ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS chassi_enc TEXT,
  ADD COLUMN IF NOT EXISTS chassi_last4 TEXT,
  ADD COLUMN IF NOT EXISTS chassi_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_cars_chassi_hash ON cars(chassi_hash);
