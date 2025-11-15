#!/usr/bin/env node
// Script helper para facilitar a migração

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Assistente de Migração - JSON/localStorage → PostgreSQL\n');

// Verificar se Docker está instalado
try {
  execSync('docker --version', { stdio: 'ignore' });
  console.log('✅ Docker instalado');
} catch {
  console.error('❌ Docker não encontrado. Por favor, instale o Docker primeiro.');
  process.exit(1);
}

// Verificar se docker-compose.yml existe
const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
if (!fs.existsSync(dockerComposePath)) {
  console.error('❌ docker-compose.yml não encontrado na raiz do projeto');
  process.exit(1);
}
console.log('✅ docker-compose.yml encontrado');

// Verificar se .env existe no backend
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Arquivo .env não encontrado no backend, criando...');
  const envContent = `# Configuração PostgreSQL
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=pecas_db

# Ou use DATABASE_URL (alternativa)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pecas_db

PORT=3001
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado em backend/.env');
  console.log('   Por favor, ajuste as credenciais se necessário\n');
}

console.log('\n📦 Passo 1: Levantar PostgreSQL com Docker...');
try {
  execSync('docker-compose up -d', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit' 
  });
  console.log('✅ PostgreSQL iniciado\n');
} catch (err) {
  console.error('❌ Erro ao iniciar PostgreSQL:', err.message);
  process.exit(1);
}

console.log('⏳ Aguardando PostgreSQL inicializar (5 segundos)...');
setTimeout(() => {
  console.log('\n📦 Passo 2: Instalando dependências do backend...');
  try {
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Dependências instaladas\n');
  } catch (err) {
    console.error('❌ Erro ao instalar dependências:', err.message);
    process.exit(1);
  }

  console.log('📦 Passo 3: Executando migração...');
  try {
    execSync('node migrate.js', { cwd: __dirname, stdio: 'inherit' });
    console.log('\n✅ Migração concluída com sucesso!\n');
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    console.log('\nTente executar manualmente: cd backend && node migrate.js');
    process.exit(1);
  }

  console.log('🎉 Setup completo!\n');
  console.log('Próximos passos:');
  console.log('  1. cd backend && npm start        (iniciar backend)');
  console.log('  2. cd .. && npm run dev            (iniciar frontend em outro terminal)');
  console.log('  3. Abrir http://localhost:5173\n');
  console.log('Para mais detalhes, veja: MIGRACAO_DB.md\n');
}, 5000);
