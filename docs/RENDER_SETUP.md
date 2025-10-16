Render deployment checklist and troubleshooting
=============================================

Este arquivo descreve como criar um Web Service no Render para hospedar o backend (pasta `backend/`) e como diagnosticar o problema de 404 no domínio `https://luciofreitas-github-io.onrender.com`.

1) Objetivo
-----------
- Ter um Web Service rodando o Express em `backend/server.js` com start `npm start`.
- Ter health-check ativo em `/api/health` para monitoramento e validação.
- Vincular o domínio desejado ao serviço (opcional).

2) Arquivo `render.yaml`
------------------------
Um scaffold `render.yaml` foi adicionado na raiz para facilitar a criação do serviço via Render. Edite `repo`, `branch`, `root` ou `region` se necessário.

Importante: não coloque chaves secretas no repositório. Configure `DATABASE_URL`, `VITE_SUPABASE_*` e outras variáveis no painel do Render.

3) Passo-a-passo (UI)
----------------------
1. Acesse https://dashboard.render.com e faça login.
2. Clique em "New" → "Web Service".
3. Conecte o repositório `luciofreitas/luciofreitas.github.io` se ainda não estiver conectado.
4. Use as opções:
   - Branch: `gh-pages` (ou branch onde você quer que o Render pegue o `backend/`).
   - Root: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`
5. Crie o serviço e, após deploy, abra a página do serviço para ver os logs.

4) Verificando logs e health via PowerShell (local)
-------------------------------------------------
Rode estes comandos no PowerShell local para testar o health e ver como o Render responde (substitua a URL se usar outra):

```powershell
# Health check (PowerShell)
Invoke-RestMethod -Uri 'https://luciofreitas-github-io.onrender.com/api/health' -UseBasicParsing -ErrorAction SilentlyContinue

# Check root
Invoke-RestMethod -Uri 'https://luciofreitas-github-io.onrender.com' -UseBasicParsing -ErrorAction SilentlyContinue

# If you have the Render service name, you can check service logs in the UI or via the Render CLI (if installed):
# render services logs <SERVICE-NAME>
```

5) Possíveis causas de 404 no domínio customizado
-----------------------------------------------
- O domínio está associado a um Static Site em vez de um Web Service. Static Sites servem apenas arquivos estáticos e não rodam Node/Express.
- A Web Service existe mas falhou no build/start por falta de variáveis de ambiente ou erro no start script.
- O domínio customizado não está vinculado ao serviço correto.

6) O que fazer se o serviço falhar ao iniciar
----------------------------------------------
- Abra os logs do serviço no painel do Render e procure erros de `npm install`, `node server.js`, ou exceptions ao conectar no DB.
- Confirme que `process.env.PORT` é usado (o `backend/server.js` já usa isso por padrão).
- Se o erro for falta de credenciais, defina as variáveis no painel do Render.

9) Supabase: chaves e práticas seguras
-------------------------------------
- Nunca exponha a `SUPABASE_SERVICE_ROLE_KEY` ao frontend — ela tem privilégios administrativos.
- Para uso servidor (backend): defina `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_URL` apenas no painel do Render como variáveis de ambiente (Server-only).
- Para uso cliente (frontend): defina `VITE_SUPABASE_ANON_KEY` e `VITE_SUPABASE_URL` nas configurações de build do frontend. Keys com prefixo `VITE_` serão embutidas no build e expostas ao navegador.
- Se você acidentalmente cometeu chaves no git, rotacione-as imediatamente no painel do Supabase e remova/limpe o histórico do Git (use BFG o git filter-repo). Se quiser, eu posso preparar os comandos para isso.

10) Onde colocar as chaves no Render
------------------------------------
- Na página do serviço (ou na seção Environment) clique em "Environment" → "Add Environment Variable".
- Adicione:
   - `DATABASE_URL` (URL do Postgres/Supabase pooler)
   - `SUPABASE_URL` (ex: https://<projeto>.supabase.co)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key — server only)
   - `VITE_SUPABASE_ANON_KEY` (se o backend também precisar realizar builds ou se você hospedar frontend no Render; caso contrário, no CI do frontend)


7) Alternativas ao Render
-------------------------
- Se preferir não usar Render, use outro provedor com suporte a Node (Railway, Heroku, Fly.io, Vercel Serverless Functions, etc.).

8) Precauções de segurança
--------------------------
- Não coloque secrets em commit. Use as configurações secretas do provedor.
- Se chaves foram comprometidas, roteie/rotacione as chaves no Supabase/Postgres o mais rápido possível.
