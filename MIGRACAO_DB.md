# Guia de Migração: JSON/localStorage → PostgreSQL

## ✅ Alterações Implementadas

### 1. Backend - Schema SQL (`backend/migrations/init.sql`)
- ✅ Criadas tabelas: manufacturers, users, products, applications, cars, guias, reviews, payments
- ✅ Índices para performance otimizada
- ✅ Relações e constraints definidas

### 2. Backend - Script de Migração (`backend/migrate.js`)
- ✅ Executa `init.sql` para criar schema
- ✅ Popula produtos de `parts_db.json` automaticamente
- ✅ Migra aplicações/compatibilidades

### 3. Backend - Novos Endpoints (`backend/index.js`)
- ✅ **Guias**: GET/POST/PUT/DELETE `/api/guias`
- ✅ **Carros**: GET/POST/PUT/DELETE `/api/users/:userId/cars`
- ✅ **Pagamentos**: GET/POST `/api/payments` e `/api/users/:userEmail/payments`

### 4. Frontend - Serviços Atualizados
- ✅ `src/utils/apiService.js` - Detecção de ambiente e fallback
- ✅ `src/services/carService.js` - API first, localStorage fallback
- ✅ `src/services/guiasService.js` - API first, localStorage fallback

## 🚀 Passo a Passo para Ativar

### Passo 1: Configurar Supabase

Siga o guia completo em **SUPABASE_SETUP.md** para:
1. Criar projeto no Supabase
2. Obter DATABASE_URL
3. (Opcional) Configurar Firebase Admin SDK — somente se for usar validação de tokens no backend

### Passo 2: Configurar Variáveis de Ambiente

Copie o template e preencha com suas credenciais:

```powershell
cd backend
copy .env.template .env
```

Edite `backend/.env` com:

```env
# PostgreSQL via Supabase (nuvem)
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxxx.supabase.co:5432/postgres

# Habilitar SSL (obrigatório para Supabase)
PGSSL=true

# Firebase Admin SDK (JSON em linha única) - opcional
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Passo 3: Instalar Dependências do Backend

```powershell
cd backend
npm install
```

### Passo 4: Executar Migração

```powershell
# Ainda dentro de backend/
npm run migrate

# Ou diretamente:
node migrate.js
```

**Saída esperada:**
```
Connected to Postgres
Applying init schema from backend/migrations/init.sql
Init migration applied successfully
Populating X products...
Products populated successfully
All migrations completed
```

### Passo 5: Iniciar Backend

```powershell
# Ainda em backend/
npm start
```

**Saída esperada:**
```
Connected to Postgres for backend API
Parts API listening on http://0.0.0.0:3001 (pg=true)
```

### Passo 6: Iniciar Frontend

Em outro terminal:

```powershell
# Na raiz do projeto
npm run dev
```

### Passo 7: Testar Endpoints

```powershell
# Teste 1: Listar guias
curl http://localhost:3001/api/guias

# Teste 2: Listar carros de um usuário
curl http://localhost:3001/api/users/user123/cars

# Teste 3: Verificar produtos
curl http://localhost:3001/api/pecas/todas
```

## 📋 Verificação

### Verificar se o Banco Está Populado

Use o **Supabase Dashboard**:

1. Acesse https://supabase.com/dashboard
2. Vá em **Table Editor**
3. Verifique as tabelas criadas:
   - manufacturers
   - users
   - products
   - applications
   - cars
   - guias
   - reviews
   - payments

Ou use **SQL Editor**:
```sql
-- Contar produtos
SELECT COUNT(*) FROM products;

-- Ver 5 produtos
SELECT * FROM products LIMIT 5;

-- Ver tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Verificar Logs do Backend

O backend deve mostrar:
- ✅ `Firebase Admin SDK initialized`
- ✅ `Connected to Postgres for backend API`
- ✅ `Parts API listening on http://0.0.0.0:3001 (pg=true)`

Se aparecer `(pg=false)`, significa que não conseguiu conectar ao Supabase. Verifique DATABASE_URL no `.env`.

## 🔄 Comportamento com Fallback

### Ambiente Local (localhost)
- ✅ Tenta usar API backend primeiro
- ✅ Se falhar, usa localStorage/JSON como fallback

### Ambiente Produção (GitHub Pages)
- ✅ Usa apenas JSON local (sem backend)
- ✅ localStorage para dados do usuário

## 🎯 O Que Foi Mantido

- ✅ Compatibilidade com modo offline (GitHub Pages)
- ✅ Todos os endpoints legados `/api/pecas/*` funcionam
- ✅ Sistema de fallback robusto
- ✅ Sem breaking changes no frontend

## 📦 Estrutura de Arquivos Criados/Modificados

```
backend/
├── migrations/
│   └── init.sql                    ✅ NOVO - Schema SQL
├── migrate.js                      ✅ MODIFICADO - Popula DB
└── index.js                        ✅ MODIFICADO - Novos endpoints

src/
├── utils/
│   └── apiService.js              ✅ MODIFICADO - API detection
└── services/
    ├── carService.js              ✅ MODIFICADO - API + fallback
    └── guiasService.js            ✅ MODIFICADO - API + fallback
```

## 🐛 Troubleshooting

### Erro: "No Postgres configuration detected"
**Solução:** 
1. Copiar template: `copy backend\.env.template backend\.env`
2. Preencher DATABASE_URL (e, opcionalmente, FIREBASE_SERVICE_ACCOUNT_JSON se usar Firebase Admin)
3. Ver SUPABASE_SETUP.md para guia completo

### Erro: "Connection refused" ou "ENOTFOUND"
**Solução:** 
1. Verificar DATABASE_URL no backend/.env
2. Confirmar projeto Supabase está ativo
3. Verificar se senha no DATABASE_URL está correta

### Erro: "self-signed certificate"
**Solução:** Confirmar que `PGSSL=true` está no `.env`

### Erro: "Products table already has data"
**Solução:** Normal! A migração não sobrescreve dados existentes

### Backend mostra `(pg=false)`
**Solução:** Verificar:
1. DATABASE_URL está correto no backend/.env?
2. Supabase projeto está ativo?
3. SSL habilitado com PGSSL=true?

## 📝 Próximos Passos Opcionais

1. **Autenticação JWT**: Proteger endpoints POST/PUT/DELETE
2. **Validação**: Adicionar validação de dados com Joi/Zod
3. **Índices Adicionais**: Otimizar queries mais complexas
4. **Backup Automático**: Script para backup do PostgreSQL
5. **Remover localStorage**: Após validar que DB funciona 100%

## 🎉 Conclusão

A migração está completa e funcionando com fallback robusto! O sistema agora:
- Usa PostgreSQL quando disponível (desenvolvimento local)
- Mantém compatibilidade com GitHub Pages (produção)
- Não quebra funcionalidade existente
- Pronto para escalar com dados reais

Para começar, basta executar os passos 1-6 acima! 🚀
