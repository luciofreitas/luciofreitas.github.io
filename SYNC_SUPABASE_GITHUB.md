# Sincronização de Dados entre Supabase e GitHub Pages

## Problema Identificado

O **localhost** funcionava corretamente ao buscar peças por categoria (ex: "Direção"), mas o **GitHub Pages** retornava zero resultados para a mesma busca.

## Causa Raiz

O sistema possui duas fontes de dados:

1. **Supabase (banco de dados primário)** → 500 registros
2. **Arquivo JSON de fallback** → Usado quando o Supabase não está disponível

### O que estava acontecendo:

- **Localhost**: Consultava o Supabase diretamente ✅ (500 registros)
- **GitHub Pages**: Usava o arquivo JSON em `/data/parts_db.json` ❌ (estava com apenas 100 registros desatualizados)

### Detalhe Técnico:

O GitHub Actions faz build da aplicação e serve o conteúdo da pasta `./dist`. O Vite copia automaticamente o conteúdo de `public/` para `dist/` durante o build. Portanto:

- `public/data/parts_db.json` → Copiado para → `dist/data/parts_db.json` → Servido em produção

## Solução Implementada

### 1. Script de Sincronização

Criado o script `scripts/sync-parts-from-supabase.js` que:

- Conecta ao Supabase usando credenciais do `.env`
- Busca todos os registros da tabela `parts`
- Salva em 3 locais:
  - `public/data/parts_db.json` → Usado pelo GitHub Pages (build)
  - `docs/data/parts_db.json` → Backup
  - `backend/parts_db.json` → Usado pelo backend local

### 2. Comando NPM

Adicionado ao `package.json`:

```bash
npm run sync-parts
```

Este comando sincroniza automaticamente os dados do Supabase para os arquivos locais.

## Como Usar

### Para sincronizar dados do Supabase:

```bash
# 1. Execute o script
npm run sync-parts

# 2. Adicione os arquivos atualizados
git add public/data/parts_db.json docs/data/parts_db.json

# 3. Commit e push
git commit -m "Sync: Atualizar parts_db.json do Supabase"
git push origin master

# 4. Aguarde ~2-3 minutos para o GitHub Pages atualizar
```

## Quando Sincronizar

Execute `npm run sync-parts` sempre que:

- ✅ Adicionar novas peças no Supabase
- ✅ Atualizar informações de peças existentes
- ✅ Remover peças do catálogo
- ✅ Notar diferenças entre localhost e produção

## Verificação

### Verificar dados localmente:

```bash
node -e "const parts = require('./public/data/parts_db.json'); console.log('Total:', parts.length);"
```

### Verificar no GitHub Pages (após deploy):

```bash
curl -I https://garagemsmart.com.br/data/parts_db.json
```

## Estatísticas Atuais

- **Total de peças**: 500
- **Categorias**:
  - Freios: 159 peças
  - Filtros: 150 peças
  - Ignição: 134 peças
  - Motor: 26 peças
  - Suspensão: 20 peças
  - Transmissão: 5 peças
  - Eletrônica: 3 peças
  - Escapamento: 2 peças
  - Direção: 1 peça

## Fluxo de Deploy

```
Supabase (500 registros)
    ↓
npm run sync-parts
    ↓
public/data/parts_db.json
    ↓
npm run build
    ↓
dist/data/parts_db.json
    ↓
GitHub Actions
    ↓
GitHub Pages
    ↓
https://garagemsmart.com.br/data/parts_db.json
```

## Notas

- O arquivo `backend/parts_db.json` está no `.gitignore` (não é versionado)
- Os arquivos `public/data/parts_db.json` e `docs/data/parts_db.json` devem ser versionados
- O GitHub Actions demora ~2-3 minutos para fazer o deploy após o push
