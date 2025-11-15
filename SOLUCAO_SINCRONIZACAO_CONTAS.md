# Solução para Sincronização de Contas Gmail/Senha

## Problema Identificado

O usuário reportou que ao fazer login com Gmail, os carros cadastrados aparecem normalmente, mas ao fazer login com a mesma conta usando senha, os carros não aparecem. Isso acontecia porque:

1. **Contas Duplicadas**: O sistema criava contas separadas para login OAuth (Gmail) e login com senha, mesmo tendo o mesmo email
2. **IDs Diferentes**: Cada método de login gerava um ID de usuário diferente
3. **Dados Isolados**: Os carros ficavam associados ao ID específico de cada método de login

## Soluções Implementadas

### 1. Script de Migração de Dados (`migrate_duplicate_cars.js`)

**Localização**: `backend/scripts/migrate_duplicate_cars.js`

**Funcionalidade**:
- Identifica usuários duplicados com o mesmo email
- Migra todos os carros da conta OAuth para a conta de senha (conta principal)
- Define a conta de senha como principal e vincula o `auth_id` OAuth
- Remove contas duplicadas vazias automaticamente

**Como usar**:
```bash
cd backend
node scripts/migrate_duplicate_cars.js
```

### 2. Auto-Vinculação Durante Login com Senha

**Localização**: Função `autoLinkDuplicateAccounts()` em `backend/index.js`

**Funcionalidade**:
- Quando usuário faz login com senha, automaticamente verifica se existe conta OAuth com mesmo email
- Migra carros da conta OAuth para conta de senha
- Vincula `auth_id` na conta de senha
- Remove conta OAuth duplicada se vazia

**Ativação**: Automática durante `POST /api/auth/login`

### 3. Auto-Vinculação Durante Login OAuth

**Localização**: Função `autoLinkFromPasswordToOAuth()` em `backend/index.js`

**Funcionalidade**:
- Quando usuário faz login OAuth, verifica se existe conta de senha com mesmo email
- Migra carros da conta de senha para conta OAuth
- Remove conta de senha duplicada se vazia
- Mantém conta OAuth como principal

**Ativação**: Automática durante `POST /api/auth/supabase-verify`

### 4. Sistema de Link Manual (`/api/auth/link-account`)

**Funcionalidade Existente Melhorada**:
- Permite vincular manualmente contas OAuth e senha
- Requer token OAuth e senha da conta local para segurança
- Suporta detecção automática de emails diferentes entre token e formulário

## Fluxo de Funcionamento

### Cenário 1: Login com Senha Após OAuth
1. Usuário faz login com senha
2. Sistema detecta que não há `auth_id` na conta
3. Busca conta OAuth com mesmo email
4. Migra carros da conta OAuth → conta senha
5. Define `auth_id` na conta senha
6. Remove conta OAuth vazia
7. **Resultado**: Uma única conta com todos os dados

### Cenário 2: Login OAuth Após Senha
1. Usuário faz login com Google
2. Sistema detecta conta de senha existente com mesmo email
3. Migra carros da conta senha → conta OAuth
4. Remove conta senha vazia
5. **Resultado**: Uma única conta OAuth com todos os dados

### Cenário 3: Dados Existentes (Script de Migração)
1. Executa script de migração
2. Identifica todas as duplicatas por email
3. Prioriza conta OAuth se existir, senão conta mais antiga
4. Migra todos os carros para conta principal
5. **Resultado**: Dados históricos consolidados

## Segurança

- **Verificação de Email**: Só migra contas com emails exatamente iguais
- **Verificação de Senha**: Login com senha exige senha correta
- **Verificação de Token**: Login OAuth exige token válido
- **Auditoria**: Logs detalhados de todas as operações de vinculação
- **Reversibilidade**: Dados não são perdidos, apenas migrados

## Benefícios

✅ **Experiência Unificada**: Login Gmail e senha mostram os mesmos dados
✅ **Migração Automática**: Não requer ação manual do usuário
✅ **Retroativo**: Resolve casos existentes com script
✅ **Seguro**: Mantém validações de autenticação
✅ **Transparente**: Usuário não percebe a migração
✅ **Performático**: Operações em segundo plano

## Monitoramento

Logs importantes a observar:
- `auto-link: checking for duplicates for email=...`
- `auto-link: migrated X cars from Y to Z`
- `auto-link: successfully merged accounts for...`

## Validação

Para validar que a solução está funcionando:
1. Faça login com Gmail → cadastre um carro
2. Faça logout
3. Faça login com senha da mesma conta
4. Verifique se o carro aparece em "Meus Carros"
5. Vice-versa também deve funcionar

## Rollback

Se necessário reverter:
1. As funções de auto-link podem ser comentadas
2. O script de migração gera logs detalhados para auditoria
3. Dados originais são preservados durante migração