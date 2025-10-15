# 🚀 Quick Start - Supabase

## ⚡ Comandos Rápidos (Windows PowerShell)

### 1️⃣ Configurar Backend
```powershell
cd backend

# Copiar template de configuração
copy .env.template .env

# Edite backend/.env com suas credenciais:
# - DATABASE_URL do Supabase
# - (Opcional) FIREBASE_SERVICE_ACCOUNT_JSON do Firebase apenas se você usar integrações legadas (não recomendado)
# Veja SUPABASE_SETUP.md para detalhes
```

### 2️⃣ Executar Migração (primeira vez)
```powershell
cd backend
npm install
npm run migrate
```

### 3️⃣ Iniciar Backend
```powershell
cd backend
npm start
```

### 4️⃣ Iniciar Frontend (em outro terminal)
```powershell
npm run dev
```

### 5️⃣ Abrir no navegador
```
http://localhost:5173
```

---

## 📋 Passo a Passo Completo

### 1. Configurar Supabase
Veja o guia completo em **SUPABASE_SETUP.md**

### 2. Instalar dependências
```powershell
cd backend
npm install
```

### 3. Executar migração
```powershell
npm run migrate
```

### 4. Iniciar backend
```powershell
npm start
```

### 5. Iniciar frontend (outro terminal)
```powershell
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
**Solução:** 
1. Copie o template: `copy backend\.env.template backend\.env`
2. Preencha DATABASE_URL (adicione credenciais necessárias, não inclua segredos no frontend)
3. Veja SUPABASE_SETUP.md para detalhes

### Erro: "Connection refused" ou "ENOTFOUND"
**Solução:** 
1. Verifique se DATABASE_URL está correto no backend/.env
2. Confirme que o projeto Supabase está ativo
3. Teste conexão no Supabase Dashboard → SQL Editor

### Backend mostra (pg=false)
**Solução:** 
1. Verificar DATABASE_URL no `backend/.env`
2. Executar migração: `cd backend; npm run migrate`
3. Reiniciar backend: `npm start`

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
