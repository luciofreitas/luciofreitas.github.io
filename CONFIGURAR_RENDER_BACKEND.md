# Como Configurar o Backend no Render

## Problema Atual
O serviço `luciofreitas-github-io.onrender.com` está configurado como **site estático** (servindo apenas o frontend). Precisamos de um serviço Node.js separado para o backend.

## Solução: Criar Novo Serviço Backend no Render

### 1. Acessar Dashboard do Render
- Vá para: https://dashboard.render.com
- Faça login

### 2. Criar Novo Web Service
- Clique em **"New +"** → **"Web Service"**
- Conecte ao repositório: `luciofreitas/luciofreitas.github.io`
- Clique em **"Connect"**

### 3. Configurar o Serviço

**Name:** `garagemsmart-backend` (ou outro nome de sua escolha)

**Region:** Oregon (US West) ou a mais próxima

**Branch:** `master`

**Root Directory:** `backend` (IMPORTANTE!)

**Runtime:** `Node`

**Build Command:** `npm install`

**Start Command:** `npm start`

**Instance Type:** `Free` (ou conforme sua preferência)

### 4. Adicionar Variáveis de Ambiente

Clique em **"Advanced"** → **"Add Environment Variable"** e adicione:

```
VITE_SUPABASE_URL=https://nishmqdbtcqrnxbvssvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pc2htcWRidGNxcm54YnZzc3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjQ2MzAsImV4cCI6MjA3NTIwMDYzMH0.GI44PF1t5VyJZ74RMJjQrkoxW3BmBL7lD3NnqxMEIsI
PORT=3001
NODE_ENV=production
```

### 5. Criar o Serviço

- Clique em **"Create Web Service"**
- Aguarde o deploy (2-5 minutos)
- Anote a URL do backend (será algo como `garagemsmart-backend.onrender.com`)

### 6. Atualizar index.html

Após criar o backend, você precisa atualizar a URL do backend no `index.html`:

```html
var prod = 'https://SEU-NOVO-BACKEND.onrender.com';
```

### 7. Testar

Após o deploy:
```bash
curl -X POST https://SEU-NOVO-BACKEND.onrender.com/api/pecas/filtrar \
  -H "Content-Type: application/json" \
  -d '{"grupo":"Direção"}'
```

Deve retornar: `{"pecas":[...],"total":1}`

## Alternativa: Usar o Mesmo Serviço

Se preferir usar apenas um serviço que serve frontend E backend:

1. Edite o serviço existente `luciofreitas-github-io`
2. Mude de **Static Site** para **Web Service**
3. Configure:
   - Build Command: `npm install && cd backend && npm install && cd .. && npm run build`
   - Start Command: `cd backend && npm start`
   - Root Directory: deixe vazio

Porém, essa abordagem é mais complexa e menos recomendada.
