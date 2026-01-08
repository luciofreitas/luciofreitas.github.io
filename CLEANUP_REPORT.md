# Relatório de Limpeza do Projeto

## ❌ Arquivos para EXCLUIR (Seguros)

### Raiz do Projeto:
- `check-user.js` - Script temporário de verificação de usuário
- `clear-local-pro.js` - Script temporário para limpar localStorage
- `dev-server.err` - Log de erro (não deve estar no git)
- `dev-server.log` - Log do servidor (não deve estar no git)
- `e2e-login-logout-fail.png` - Screenshot de teste
- `e2e-login-logout-result.json` - Resultado de teste E2E
- `e2e-login-logout.png` - Screenshot de teste
- `missing_references.txt` - Relatório temporário
- `ml-prod-403.txt` - Debug temporário
- `moved_images.json` - Relatório de migração de imagens
- `oauth-callback-debug.html` - Debug de OAuth (duplicado do public/)
- `oauth-callback.html` - Callback de OAuth (duplicado do public/)
- `restore_missing_from_master.js` - Script de restore temporário
- `restore_report.json` - Relatório temporário
- `scan_missing.js` - Script temporário de scan
- `scan_missing.ps1` - Script PowerShell temporário
- `tmp.json` - Arquivo temporário
- `.htaccess.backup` - Backup do .htaccess
- `render_index.html` - Index alternativo (não usado?)

### Backend:
- `backfill-authids.js` - Script de migração (já executado?)
- `check-cars-structure.js` - Script de debug
- `check-db.js` - Script de debug
- `debug-backfill.js` - Script de debug
- `luzes_painel.json` - Dados temporários?
- `server.err` - Log de erro (não deve estar no git)
- `server.log` - Log do servidor (não deve estar no git)
- `setup-migration.js` - Script de setup (já executado?)
- `setup-migration.ps1` - Script PowerShell
- `test-categories.js` - Script de teste
- `test-pg.js` - Script de teste
- `test_login.js` - Script de teste

### Scripts:
- `check-categories.js` - Debug/teste
- `check-direcao.js` - Debug/teste
- `check-icon-colors.js` - Debug/teste
- `check-schema.js` - Debug/teste
- `collect-ids-for-deletion.js` - Script temporário
- `collect-parts.js` - Script de migração?
- `debug-seed.js` - Debug
- `delete-imported-parts-by-window.js` - Script temporário
- `insert-parts-final.js` - Script de migração (já executado?)
- `insert-parts-from-sql.js` - Script de migração (já executado?)
- `insert-parts-v2.js` - Script de migração (já executado?)
- `list-created-at-stats.js` - Script de análise temporário
- `monitor-deploy.ps1` - Script PowerShell de monitoramento
- `preview-delete-imported-parts.js` - Preview temporário
- `test-api-direcao.js` - Teste
- `test-apps.js` - Teste
- `test-backend-logs.js` - Teste
- `test-backend-supabase.js` - Teste
- `test-fetch.js` - Teste
- `test-search.js` - Teste
- `test-supabase.js` - Teste

### Documentação Duplicada/Obsoleta:
- `CONFIGURAR_GITHUB_SECRETS.md` - (tem versão UPDATED)

## ⚠️ Verificar Antes de Excluir

### Raiz:
- `vercel.json` - Configuração Vercel (você usa Vercel?)
- `render.yaml` - Configuração Render (backend já está no Render?)
- `api/` - Pasta API (Vercel functions?)
- `functions/` - Pasta functions (duplicado de api/?)
- `docs/` - Documentação ou GitHub Pages?

### Backend:
- `migrate.js` - Script de migração (ainda usa?)
- `migrations/` - Pasta de migrações (ainda usa?)
- `tests/` - Pasta de testes (tem testes funcionais?)

### Scripts:
- `001-add-grouping-column.sql` - SQL de migração (já executado?)
- `import-parts-to-supabase.js` - Importação (ainda usa?)
- `sync-parts-from-supabase.js` - Sincronização (ainda usa?)
- `deploy-to-master.js` - Deploy manual (ainda usa?)

## ✅ Manter (Essenciais)

### Backend:
- `cancel-all-pro.js` ✅ (gerenciamento de assinaturas)
- `check-user-pro.js` ✅ (gerenciamento de assinaturas)
- `supabaseRealtime.js` ✅ (funcionalidade real-time)
- `index.js` ✅ (servidor principal)
- `parts_db.json` ✅ (dados)
- `routes/` ✅ (rotas)
- `scripts/` ✅ (scripts essenciais)

### Scripts:
- `generate-components-index.js` ✅ (usado no build)
- `copy-static.js` ✅ (usado no build)
- `recolor-icon.js` ✅ (utilitário de ícones)

### Raiz:
- Todos os arquivos de configuração (.env, package.json, vite.config.js, etc.) ✅
- `src/` ✅ (código fonte)
- `public/` ✅ (assets públicos)
- `images/` ✅ (imagens)
- Arquivos de documentação (.md) ✅

## 📋 Sugestão de .gitignore adicional

Adicionar ao .gitignore:
```
# Logs
*.log
*.err
dev-server.err
dev-server.log
server.err
server.log

# Temporários
tmp.json
*.tmp

# Debug/Test reports
*-result.json
*-report.json
*.png

# Backups
*.backup
```

## 🗑️ Comando para limpeza (revise antes!)

```bash
# Remover arquivos de teste e temporários da raiz
rm check-user.js clear-local-pro.js dev-server.err dev-server.log
rm e2e-*.png e2e-*.json missing_references.txt ml-prod-403.txt
rm moved_images.json oauth-callback-debug.html tmp.json
rm restore_missing_from_master.js restore_report.json
rm scan_missing.js scan_missing.ps1 .htaccess.backup

# Remover logs e scripts de debug do backend
rm backend/server.err backend/server.log
rm backend/check-cars-structure.js backend/check-db.js
rm backend/debug-backfill.js backend/test-*.js

# Remover scripts de teste
rm scripts/check-*.js scripts/test-*.js
rm scripts/debug-seed.js scripts/monitor-deploy.ps1
```
