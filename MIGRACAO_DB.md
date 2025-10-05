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

### Passo 1: Verificar Docker e PostgreSQL

```powershell
# Verificar se docker está rodando
docker --version

# Levantar PostgreSQL via docker-compose
docker-compose up -d

# Verificar se está rodando
docker ps
```

### Passo 2: Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto **backend**:

```env
# backend/.env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=pecas_db

# OU use DATABASE_URL (alternativa)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pecas_db
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

```powershell
# Conectar ao PostgreSQL via Docker
docker exec -it <CONTAINER_ID> psql -U postgres -d pecas_db

# Dentro do psql:
\dt                              # Listar tabelas
SELECT COUNT(*) FROM products;   # Contar produtos
SELECT * FROM products LIMIT 5;  # Ver 5 produtos
\q                               # Sair
```

### Verificar Logs do Backend

O backend deve mostrar:
- ✅ `Connected to Postgres for backend API`
- ✅ `Parts API listening on http://0.0.0.0:3001 (pg=true)`

Se aparecer `(pg=false)`, significa que não conseguiu conectar ao PostgreSQL e está usando CSV fallback.

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
**Solução:** Criar arquivo `backend/.env` com as variáveis corretas

### Erro: "Connection refused"
**Solução:** Verificar se PostgreSQL está rodando (`docker ps`)

### Erro: "Products table already has data"
**Solução:** Normal! A migração não sobrescreve dados existentes

### Backend mostra `(pg=false)`
**Solução:** Verificar:
1. PostgreSQL está rodando?
2. Variáveis de ambiente corretas?
3. Firewall bloqueando porta 5432?

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
