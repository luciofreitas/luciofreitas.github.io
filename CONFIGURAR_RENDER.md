# Configuração do Backend no Render.com

## 🔴 Problema Atual

O backend no Render está retornando **erro 500** porque as **variáveis de ambiente** não estão configuradas.

---

## ✅ Solução: Configurar Variáveis de Ambiente

### 1. Acesse o Painel do Render

1. Vá para https://dashboard.render.com
2. Faça login com sua conta
3. Encontre o serviço do backend: **luciofreitas-github-io** ou similar

### 2. Configure as Variáveis de Ambiente

No painel do serviço, vá em **Environment** → **Environment Variables** e adicione:

#### Variável 1: DATABASE_URL

```
DATABASE_URL=postgresql://postgres.xxxxx:SENHA@xxxxx.pooler.supabase.com:5432/postgres
```

**Como obter:**
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Database**
4. Em **Connection String**, copie a **URI de conexão**
5. **IMPORTANTE:** Use a connection string do **Connection Pooler** (porta 5432 ou 6543)

#### Variável 2: SUPABASE_URL

```
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
```

**Como obter:**
1. No Supabase Dashboard
2. **Settings** → **API**
3. Copie o valor de **Project URL**

#### Variável 3: SUPABASE_SERVICE_ROLE_KEY

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```

**Como obter:**
1. No Supabase Dashboard
2. **Settings** → **API**
3. Copie o valor de **service_role** (⚠️ NÃO use anon key, precisa ser service_role!)
4. ⚠️ **ATENÇÃO:** Esta chave é SECRETA e tem poderes administrativos!

#### (Opcional) Variável 4: NODE_ENV

```
NODE_ENV=production
```

Isso desabilita logs de debug e otimiza o desempenho.

---

## 3. Salvar e Fazer Deploy

1. Depois de adicionar todas as variáveis, clique em **Save Changes**
2. O Render vai **automaticamente fazer redeploy** do backend
3. Aguarde alguns minutos para o deploy completar

---

## 4. Verificar se Funcionou

### Teste 1: Health Check

Abra no navegador:
```
https://luciofreitas-github-io.onrender.com/_health
```

Deve retornar:
```json
{"ok": true, "pid": 123, "uptime": 45.678}
```

### Teste 2: Verificar Logs

No painel do Render:
1. Vá em **Logs**
2. Procure por mensagens de erro
3. Deve ver logs como:
   - `✅ PostgreSQL Pool connected!`
   - `✅ DB schema check passed`
   - `Server listening on port 10000`

### Teste 3: Testar no Site

1. Acesse https://garagemsmart.com.br
2. Faça login
3. Vá em **Meus Carros**
4. Tente adicionar um carro
5. **NÃO deve mais dar erro 500!**

---

## 🔧 Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**
- Verifique se a `DATABASE_URL` está correta
- Certifique-se de que está usando a **Connection Pooler** do Supabase (porta 5432 ou 6543)
- Teste a conexão localmente primeiro:
  ```bash
  cd backend
  node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'SUA_DATABASE_URL' }); pool.query('SELECT NOW()').then(r => console.log(r.rows)).catch(e => console.error(e));"
  ```

### Erro: "supabase admin not configured"

**Solução:**
- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas
- Certifique-se de que usou **service_role** key e NÃO anon key

### Erro 500 continua após configurar

**Solução:**
1. Vá nos **Logs** do Render
2. Procure por erros específicos
3. Verifique se o deploy terminou com sucesso
4. Force um **Manual Deploy** se necessário

---

## 📋 Checklist Completo

- [ ] DATABASE_URL configurada no Render
- [ ] SUPABASE_URL configurada no Render  
- [ ] SUPABASE_SERVICE_ROLE_KEY configurada no Render
- [ ] NODE_ENV=production configurada (opcional)
- [ ] Deploy completou com sucesso
- [ ] `/_health` endpoint retorna `{"ok": true}`
- [ ] Logs mostram conexão com PostgreSQL OK
- [ ] Site funciona sem erro 500

---

## 🔒 Segurança

⚠️ **NUNCA** commite as variáveis de ambiente no Git!
⚠️ **NUNCA** compartilhe o `SUPABASE_SERVICE_ROLE_KEY` publicamente!

Todas essas chaves devem estar **SOMENTE** configuradas no painel do Render.

---

## 📞 Links Úteis

- [Render Dashboard](https://dashboard.render.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação Render - Environment Variables](https://render.com/docs/environment-variables)
- [Documentação Supabase - Database](https://supabase.com/docs/guides/database)
