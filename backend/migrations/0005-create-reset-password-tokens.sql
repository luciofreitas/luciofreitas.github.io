-- Tabela para tokens de redefinição de senha
CREATE TABLE IF NOT EXISTS reset_password_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_reset_password_token ON reset_password_tokens(token);