# 🚀 Quick Start - Migração para PostgreSQL

## Comandos Rápidos (Windows PowerShell)

### 1️⃣ Setup Automático (Mais Fácil)
```powershell
cd backend
.\setup-migration.ps1
```

### 2️⃣ Iniciar Backend
```powershell
cd backend
npm start
```

### 3️⃣ Iniciar Frontend (em outro terminal)
```powershell
npm run dev
```

### 4️⃣ Abrir no navegador
```
http://localhost:5173
```

---

## Comandos Manuais (Passo a Passo)

```powershell
# 1. Levantar PostgreSQL
docker-compose up -d

# 2. Criar arquivo .env no backend (se não existir)
# backend/.env:
# PGHOST=localhost
# PGPORT=5432
# PGUSER=postgres
# PGPASSWORD=postgres
# PGDATABASE=pecas_db

# 3. Instalar dependências
cd backend
npm install

# 4. Executar migração
npm run migrate

# 5. Iniciar backend
npm start

# 6. Em outro terminal, iniciar frontend
cd ..
npm run dev
```

---

## ✅ Verificação

### Backend deve mostrar:
```
Connected to Postgres for backend API
Parts API listening on http://0.0.0.0:3001 (pg=true)
```

### Testar endpoints:
```powershell
# Listar guias
curl http://localhost:3001/api/guias

# Listar produtos
curl http://localhost:3001/api/pecas/todas
```

---

## 🐛 Troubleshooting

### Erro: "No Postgres configuration detected"
**Solução:** Criar `backend/.env` com as variáveis corretas

### Erro: "Connection refused"
**Solução:** 
```powershell
# Verificar se PostgreSQL está rodando
docker ps

# Se não estiver, levantar:
docker-compose up -d
```

### Backend mostra (pg=false)
**Solução:** Verificar arquivo `.env` e executar migração:
```powershell
cd backend
node migrate.js
```

---

## 📚 Documentação Completa

- `MIGRACAO_DB.md` - Guia completo da migração
- `backend/README.md` - Documentação da API
- `backend/migrations/init.sql` - Schema SQL

---

## 🎯 O Que Mudou

### ✅ Agora usa PostgreSQL
- Guias persistidos no banco
- Carros do usuário no banco
- Pagamentos registrados no banco

### ✅ Mantém Fallback
- Se backend não disponível, usa localStorage
- GitHub Pages continua funcionando normalmente
- Sem breaking changes!

### ✅ Novos Endpoints
- `/api/guias` - CRUD completo
- `/api/users/:userId/cars` - Gerenciar carros
- `/api/payments` - Histórico de pagamentos

---

Pronto! 🎉 Execute o script de setup e comece a usar o banco de dados!
