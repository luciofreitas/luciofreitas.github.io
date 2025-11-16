# 🔐 Configurar Secrets (ATENÇÃO: evitar VITE_ em secrets de build)

Este documento explica como configurar variáveis de ambiente e *secrets* para deploys automáticos, evitando que segredos sejam embutidos em bundles do cliente.

Resumo rápido:
- Nunca adicione segredos sensíveis com prefixo `VITE_` nas variáveis de ambiente do provedor de CI (GitHub Actions / Vercel / Render). Variáveis com `VITE_` podem acabar embutidas no bundle do frontend. Em vez disso, adicione variáveis server-only (sem `VITE_`) e exponha apenas um conjunto controlado via `api/runtime-config` em runtime.

1) Acessar Settings → Secrets
- Abra: https://github.com/luciofreitas/luciofreitas.github.io → Settings → Secrets and variables → Actions

2) Quais secrets adicionar (nomes sugeridos)
- `EMAILJS_PUBLIC_KEY` (público)
- `EMAILJS_SERVICE_ID` (server-only)
- `EMAILJS_TEMPLATE_CONTACT` (server-only)
- `EMAILJS_TEMPLATE_RESET` (server-only)
- `SUPABASE_URL` (server-only)
- `SUPABASE_ANON_KEY` (se usado no servidor; trate como sensível)
- `SUPABASE_SERVICE_ROLE` (SOMENTE server-side, sensível)
- `FIREBASE_API_KEY` (web key — trate com cuidado)
- `FIREBASE_AUTH_DOMAIN`
- `API_URL` (URL do backend, se aplicável)
- `RUNTIME_CONFIG_AUDIT_TOKEN` (token para proteger o modo de auditoria `?keysOnly`)

Importante: não use o prefixo `VITE_` para esses names. Use os nomes acima (sem `VITE_`) para que não sejam automaticamente expostos ao build do frontend.

3) O que muda no fluxo de deploy
- Desenvolvimento local: você pode continuar usando `VITE_` em `./.env.local` para conveniência local.
- Em CI/prod: coloque as credenciais sensíveis como *repository secrets* com os nomes acima (SEM `VITE_`). O código do frontend NÃO deve depender de `import.meta.env.VITE_*` para valores sensíveis — use `api/runtime-config` para retornar apenas o que é seguro para o cliente.

4) Mitigação automática no CI
- O workflow de build foi atualizado para verificar se o artefato gerado contém strings `VITE_` e abortar o deploy caso encontre, evitando publicar bundles que contenham segredos.

5) Se você já adicionou secrets com `VITE_`
- Renomeie-os na interface do GitHub (ou exclua e adicione novamente) para os nomes sem `VITE_` indicados acima.
- Após renomear, remova as referências a `VITE_` em configurações de build do provedor (Vercel envs, GitHub Actions, etc.).

6) Teste e verificação
- Faça um deploy de teste; se o workflow falhar com uma mensagem referente a `VITE_`, isso indica que algum valor com `VITE_` foi embutido — reveja os secrets e remova quaisquer `VITE_` sensíveis antes de prosseguir.

7) Checklist rápido
- [ ] Remover/renomear secrets com prefixo `VITE_` no GitHub
- [ ] Adicionar secrets server-only com os nomes não-`VITE_` listados acima
- [ ] Definir `RUNTIME_CONFIG_AUDIT_TOKEN` no ambiente de produção
- [ ] Rodar um deploy de teste e confirmar que o step de verificação não encontra `VITE_`

Se quiser, eu posso gerar instruções passo-a-passo (com cliques e URLs) para renomear os secrets no GitHub e para configurar equivalentes no Vercel/Render. Mantemos a segurança primeiro: trate qualquer `VITE_` encontrado em bundles como comprometido e rotacione as chaves imediatamente.
