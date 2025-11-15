# Script PowerShell para facilitar a migração no Windows
Write-Host "🚀 Assistente de Migração - JSON/localStorage → PostgreSQL`n" -ForegroundColor Cyan

# Verificar Docker
Write-Host "Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Por favor, instale o Docker Desktop primeiro." -ForegroundColor Red
    Write-Host "   Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar docker-compose.yml
$dockerComposePath = Join-Path $PSScriptRoot "..\docker-compose.yml"
if (-not (Test-Path $dockerComposePath)) {
    Write-Host "❌ docker-compose.yml não encontrado na raiz do projeto" -ForegroundColor Red
    exit 1
}
Write-Host "✅ docker-compose.yml encontrado" -ForegroundColor Green

# Verificar/Criar .env
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  Arquivo .env não encontrado, criando..." -ForegroundColor Yellow
    $envContent = @"
# Configuração PostgreSQL
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=pecas_db

# Ou use DATABASE_URL (alternativa)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pecas_db

PORT=3001
"@
    Set-Content -Path $envPath -Value $envContent
    Write-Host "✅ Arquivo .env criado em backend\.env" -ForegroundColor Green
    Write-Host "   Por favor, ajuste as credenciais se necessário`n" -ForegroundColor Yellow
}

# Passo 1: Levantar PostgreSQL
Write-Host "`n📦 Passo 1: Levantar PostgreSQL com Docker..." -ForegroundColor Cyan
try {
    Set-Location (Split-Path $PSScriptRoot)
    docker-compose up -d
    Write-Host "✅ PostgreSQL iniciado`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao iniciar PostgreSQL: $_" -ForegroundColor Red
    exit 1
}

# Aguardar PostgreSQL inicializar
Write-Host "⏳ Aguardando PostgreSQL inicializar (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Passo 2: Instalar dependências
Write-Host "`n📦 Passo 2: Instalando dependências do backend..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
try {
    npm install
    Write-Host "✅ Dependências instaladas`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar dependências: $_" -ForegroundColor Red
    exit 1
}

# Passo 3: Executar migração
Write-Host "📦 Passo 3: Executando migração..." -ForegroundColor Cyan
try {
    node migrate.js
    Write-Host "`n✅ Migração concluída com sucesso!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na migração: $_" -ForegroundColor Red
    Write-Host "`nTente executar manualmente: cd backend; node migrate.js" -ForegroundColor Yellow
    exit 1
}

# Sucesso!
Write-Host "🎉 Setup completo!`n" -ForegroundColor Green
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. cd backend; npm start          (iniciar backend)" -ForegroundColor White
Write-Host "  2. cd ..; npm run dev             (iniciar frontend em outro terminal)" -ForegroundColor White
Write-Host "  3. Abrir http://localhost:5173`n" -ForegroundColor White
Write-Host "Para mais detalhes, veja: MIGRACAO_DB.md`n" -ForegroundColor Yellow
