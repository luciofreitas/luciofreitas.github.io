# 🚀 Guia Completo: Configurar Supabase como Banco de Dados

Este guia mostra como configurar o Supabase para usar como banco de dados PostgreSQL cloud para o projeto.

## 📋 Pré-requisitos

- Conta no Supabase (gratuita): https://supabase.com
- Conta Firebase já configurada (para autenticação)
- Node.js instalado
- Backend do projeto com dependências instaladas

---

## Passo 1: Criar Projeto no Supabase

### 1.1 Acessar Supabase
1. Acesse https://supabase.com
2. Clique em **"Start your project"** ou **"Sign in"**
3. Faça login com GitHub, Google ou email

### 1.2 Criar novo projeto
1. Clique em **"New Project"**
2. Preencha:
   - **Name**: `pecas-automotivas` (ou nome de sua preferência)
   - **Database Password**: Escolha uma senha forte (anote!)
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)
   - **Pricing Plan**: Free (ou outra se preferir)
3. Clique em **"Create new project"**
4. Aguarde ~2 minutos enquanto o projeto é provisionado

---

## Passo 2: Obter Credenciais do Banco

### 2.1 Connection String (DATABASE_URL)
1. No Supabase Dashboard, vá em **Settings** (ícone de engrenagem) → **Database**
2. Role até **Connection string** → **URI**
3. Copie a string que parece com:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```
4. **IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você escolheu no Passo 1.2

### 2.2 Service Role Key (opcional, para operações administrativas)
1. No Supabase Dashboard, vá em **Settings** → **API**
2. Em **Project API keys**, copie o **service_role** (secret key)
3. ⚠️ **NUNCA exponha esta chave no frontend!**

---

## Passo 3: Configurar Firebase Admin SDK

### 3.1 Obter credenciais do Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **⚙️ Project Settings** → **Service Accounts**
4. Clique em **"Generate new private key"**
5. Baixe o arquivo JSON (ex: `firebase-adminsdk.json`)

### 3.2 Preparar JSON em linha única
- Abra o arquivo JSON baixado
- Copie todo o conteúdo (é um objeto JSON grande)
- **Importante**: Vai usar isso no arquivo `.env` (uma única linha)

---

## Passo 4: Configurar Backend

### 4.1 Criar arquivo .env
1. No backend, copie o template:
   ```powershell
   cd backend
   copy .env.template .env
   ```

2. Edite `backend/.env` e preencha:

```dotenv
# PostgreSQL via Supabase
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@db.xxxxxx.supabase.co:5432/postgres

# Habilitar SSL (obrigatório para Supabase)
PGSSL=true

# Firebase Admin SDK (cole o JSON completo em uma única linha)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"seu-projeto",...}

# Porta do servidor
PORT=3001
```

### 4.2 Instalar dependências necessárias
```powershell
cd backend
npm install firebase-admin
```

---

## Passo 5: Executar Migração

### 5.1 Rodar script de migração
```powershell
cd backend
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

### 5.2 Verificar no Supabase
1. No Supabase Dashboard, vá em **Table Editor**
2. Você deve ver as tabelas criadas:
   - manufacturers
   - users
   - products
   - applications
   - cars
   - guias
   - reviews
   - payments

---

## Passo 6: Testar Backend

### 6.1 Iniciar servidor
```powershell
cd backend
npm start
```

**Saída esperada:**
```
Firebase Admin SDK initialized
Connected to Postgres for backend API
Parts API listening on http://0.0.0.0:3001 (pg=true)
```

### 6.2 Testar endpoints
Em outro terminal:

```powershell
# Testar produtos
curl http://localhost:3001/api/pecas/todas

# Testar guias
curl http://localhost:3001/api/guias

# Testar verificação de token (precisa de token Firebase válido)
curl -X POST http://localhost:3001/api/auth/verify -H "Content-Type: application/json" -d "{\"idToken\":\"seu-token-aqui\"}"
```

---

## Passo 7: Integrar com Frontend

### 7.1 Atualizar chamada de autenticação
No frontend, após login com Firebase, chame o endpoint de verificação:

```javascript
// Exemplo: src/context/AuthContext.jsx ou similar
import { auth } from './firebase';

async function syncUserWithBackend() {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    const idToken = await user.getIdToken();
    const response = await fetch('http://localhost:3001/api/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Usuário sincronizado:', data.user);
      return data.user;
    }
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
  }
}

// Chamar após login bem-sucedido
auth.onAuthStateChanged(async (user) => {
  if (user) {
    await syncUserWithBackend();
  }
});
```

---

## 📊 Verificar Dados no Supabase

### Via Dashboard
1. Acesse **Table Editor** no Supabase
2. Selecione uma tabela (ex: `products`)
3. Visualize os dados inseridos

### Via SQL Editor
1. Acesse **SQL Editor** no Supabase
2. Execute queries:
```sql
-- Contar produtos
SELECT COUNT(*) FROM products;

-- Ver usuários
SELECT id, email, nome, is_pro, criado_em FROM users;

-- Ver guias
SELECT id, titulo, autor_email, status FROM guias;
```

---

## 🔒 Segurança e Boas Práticas

### ✅ Checklist de Segurança
- [ ] Arquivo `.env` está no `.gitignore` (não commitado)
- [ ] Senha do banco é forte e única
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` nunca exposto no frontend
- [ ] SSL habilitado (`PGSSL=true`)
- [ ] Service Role Key (se usado) mantida em segredo
- [ ] Credenciais rotacionadas regularmente

### 🚨 Nunca faça:
- ❌ Commitar arquivo `.env` no Git
- ❌ Expor `service_role` key no frontend
- ❌ Desabilitar SSL em produção
- ❌ Usar senha fraca no banco

---

## 🐛 Troubleshooting

### Erro: "no pg_hba.conf entry"
**Solução**: Verificar se SSL está habilitado (`PGSSL=true`)

### Erro: "password authentication failed"
**Solução**: Verificar se substituiu `[YOUR-PASSWORD]` na DATABASE_URL pela senha correta

### Erro: "Firebase Admin SDK not configured"
**Solução**: Verificar se `FIREBASE_SERVICE_ACCOUNT_JSON` está correto no `.env`

### Backend mostra (pg=false)
**Solução**: 
1. Verificar DATABASE_URL no `.env`
2. Rodar `node migrate.js` novamente
3. Verificar logs de erro no terminal

### Migração falha com "relation already exists"
**Solução**: Normal se rodar múltiplas vezes. Use `DROP TABLE` no SQL Editor se quiser resetar

---

## 📈 Monitoramento

### Via Supabase Dashboard
- **Database** → **Database Health**: Ver uso de CPU/memória
- **Database** → **Connections**: Ver conexões ativas
- **Logs**: Ver logs de queries

### Limites Free Tier
- 500 MB de armazenamento
- Unlimited API requests
- Pausado após 1 semana de inatividade
- 2 organizações

---

## 🎯 Próximos Passos

1. ✅ Testar todas as funcionalidades do app
2. ✅ Configurar backups automáticos (Supabase faz isso por padrão)
3. ✅ Implementar políticas RLS (Row Level Security) se quiser usar Supabase direto do frontend
4. ✅ Monitorar uso e performance
5. ✅ Considerar upgrade para plano pago se ultrapassar limites

---

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Guia PostgreSQL](https://supabase.com/docs/guides/database)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

Pronto! 🎉 Seu backend agora está conectado ao Supabase e sincronizando usuários do Firebase!
