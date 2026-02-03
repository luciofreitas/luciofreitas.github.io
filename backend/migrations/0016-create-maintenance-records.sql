-- 0016 - Create maintenance_records (histórico de manutenção)
-- Allows professionals to query histories by company/oficina.

CREATE TABLE IF NOT EXISTS maintenance_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  car_id TEXT,
  vehicle_label TEXT,
  data DATE,
  tipo TEXT,
  descricao TEXT,
  codigo_produto TEXT,
  km_atual INTEGER,
  company_id TEXT,
  oficina TEXT,
  valor NUMERIC(10, 2),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_user_id ON maintenance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_company_id ON maintenance_records(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_data ON maintenance_records(data);
