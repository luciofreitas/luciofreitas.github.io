-- Create table to store Mercado Livre tokens per user
CREATE TABLE IF NOT EXISTS ml_tokens (
  user_id text PRIMARY KEY,
  access_token text,
  refresh_token text,
  expires_in integer,
  expires_at bigint,
  token_type text,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
