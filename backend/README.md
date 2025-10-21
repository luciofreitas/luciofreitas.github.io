Parts API (PostgreSQL + CSV fallback)

Este backend Node.js serve dados de peças automotivas e agora suporta **PostgreSQL** com fallback para CSV.

## 🚀 Quick Start - Migração para PostgreSQL

### Opção 1: Script Automático (Recomendado - Windows)
```powershell
cd backend
.\setup-migration.ps1
```

### Opção 2: Manual

1. Instalar dependências:
   ```powershell
   cd backend
   npm install
   ```

2. Configurar PostgreSQL:
   ```powershell
   # Criar arquivo .env com:
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=postgres
   PGDATABASE=pecas_db
   ```

3. Levantar PostgreSQL:
   ```powershell
   docker-compose up -d
   ```

4. Executar migração:
   ```powershell
   npm run migrate
   # ou: node migrate.js
   ```

5. Iniciar backend:
   ```powershell
   npm start
   ```

Default port: **3001**

## 📡 Endpoints

### Produtos/Peças (legado - mantido para compatibilidade)
- `GET /api/pecas/todas` - Todas as peças
- `GET /api/pecas/meta` - Metadados (grupos, marcas, modelos, anos)
- `POST /api/pecas/filtrar` - Filtrar peças
- `GET /api/pecas/:id` - Peça por ID

### Novos Endpoints (PostgreSQL)
- **Guias**
   - `GET /api/guias` - Listar guias ativos
   - `POST /api/guias` - Criar guia
   - `PUT /api/guias/:id` - Atualizar guia
   - `DELETE /api/guias/:id` - Deletar guia

Note: the implementation for the `guias` endpoints was moved to `backend/routes/guias.js` as part of a refactor.
The inline handlers that used to live in `backend/index.js` were removed and the router is now mounted from that file.

- **Carros do Usuário**
  - `GET /api/users/:userId/cars` - Carros do usuário
  - `POST /api/users/:userId/cars` - Adicionar carro
  - `PUT /api/users/:userId/cars` - Atualizar carros (batch)
  - `DELETE /api/users/:userId/cars/:carId` - Remover carro

- **Pagamentos**
  - `POST /api/payments` - Registrar pagamento
  - `GET /api/users/:userEmail/payments` - Histórico de pagamentos

### Legado CSV (mantido para compatibilidade)
- `GET /api/products`
- `GET /api/product/:id`
- `GET /api/product/sku/:sku`
- `GET /api/vehicles`
- `GET /api/fitments`
- `GET /api/equivalences`
- `GET /api/compatibility/sku/:sku`

If you prefer a Postgres-ready environment, start the DB with Docker Compose:

  docker-compose up -d

This mounts `db/schema.sql` into Postgres initialization; you can import CSV seeds manually or extend the compose setup to run import scripts.

Postgres mode
---------------
The backend will attempt to connect to Postgres if `DATABASE_URL` is set. When connected it serves data directly from the database. If no Postgres is available it falls back to the CSV files in `db/seeds` (useful for quick local prototyping).

To run in Postgres mode (example):

   export DATABASE_URL=postgresql://parts:parts_pass@localhost:5432/partsdb
   npm start

Or on Windows PowerShell:

   $env:DATABASE_URL = 'postgresql://parts:parts_pass@localhost:5432/partsdb'
   npm start

The API endpoints remain the same whether using Postgres or CSV fallback.
