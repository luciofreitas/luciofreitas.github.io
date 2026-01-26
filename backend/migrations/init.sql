-- Schema inicial para migração de JSON/localStorage para PostgreSQL
-- Criado em: 2025-10-04

-- Tabela de fabricantes
CREATE TABLE IF NOT EXISTS manufacturers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE NOT NULL,
  senha TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now()
);

-- Tabela de produtos/peças
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  fabricante_id INTEGER REFERENCES manufacturers(id),
  part_number TEXT,
  imagens JSONB,
  codigos_oem JSONB,
  especificacoes JSONB,
  instalacao JSONB,
  recall_relacionado BOOLEAN DEFAULT FALSE,
  recall_detalhes JSONB,
  pecas_relacionadas JSONB,
  perguntas_frequentes JSONB,
  dados_extra JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabela de aplicações (compatibilidade veículo-peça)
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano_inicio INT,
  ano_fim INT,
  motor TEXT,
  versao TEXT,
  combustivel TEXT,
  cambio TEXT,
  carroceria TEXT,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Índices para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_applications_product ON applications(product_id);
CREATE INDEX IF NOT EXISTS idx_applications_vehicle ON applications(marca, modelo, ano_inicio, ano_fim);

-- Tabela de carros do usuário
CREATE TABLE IF NOT EXISTS cars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INT,
  dados JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cars_user ON cars(user_id);

-- Tabela de guias
CREATE TABLE IF NOT EXISTS guias (
  id TEXT PRIMARY KEY,
  autor_email TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  conteudo TEXT,
  imagem TEXT,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now(),
  status TEXT DEFAULT 'ativo',
  ratings JSONB DEFAULT '[]'::jsonb,
  views INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_guias_status ON guias(status);
CREATE INDEX IF NOT EXISTS idx_guias_categoria ON guias(categoria);
CREATE INDEX IF NOT EXISTS idx_guias_autor ON guias(autor_email);

-- Tabela de avaliações de produtos
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  usuario TEXT NOT NULL,
  nota INT CHECK (nota >= 1 AND nota <= 5),
  texto TEXT,
  data TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  date TIMESTAMP DEFAULT now(),
  card_last4 TEXT,
  status TEXT DEFAULT 'completed',
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- Inserir fabricante padrão se não existir
INSERT INTO manufacturers (name, code) 
VALUES ('Genérico', 'GEN')
ON CONFLICT (code) DO NOTHING;
