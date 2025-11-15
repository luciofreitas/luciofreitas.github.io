-- Create normalized ratings table for guias
CREATE TABLE IF NOT EXISTS guia_ratings (
  id SERIAL PRIMARY KEY,
  guia_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guia_ratings_guia ON guia_ratings(guia_id);
CREATE INDEX IF NOT EXISTS idx_guia_ratings_user ON guia_ratings(user_email);

-- Prevent duplicate ratings per user per guia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_guia_user_rating'
  ) THEN
    ALTER TABLE guia_ratings ADD CONSTRAINT unique_guia_user_rating UNIQUE (guia_id, user_email);
  END IF;
END$$;
