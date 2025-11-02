#!/usr/bin/env node
/**
 * Script para migrar carros de contas duplicadas para a conta principal
 * 
 * Identifica usuários com mesmo email mas IDs diferentes e migra todos os carros
 * para a conta que tem auth_id (conta OAuth principal).
 * 
 * Uso: node migrate_duplicate_cars.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Configuração do PostgreSQL
function createPgClient() {
  const cfg = (() => {
    if (process.env.DATABASE_URL) {
      return { 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
      };
    }
    const host = process.env.PGHOST || process.env.PG_HOST;
    if (!host) return null;
    return {
      host,
      port: parseInt(process.env.PGPORT || process.env.PG_PORT || '5432'),
      database: process.env.PGDATABASE || process.env.PG_DATABASE || 'postgres',
      user: process.env.PGUSER || process.env.PG_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.PG_PASSWORD || ''
    };
  })();
  
  if (!cfg) {
    console.error('❌ Configuração do banco PostgreSQL não encontrada');
    console.log('Configure DATABASE_URL ou PGHOST, PGUSER, etc. no arquivo .env');
    return null;
  }
  
  return new Client(cfg);
}

// Configuração do Supabase Admin
function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error('❌ Configuração do Supabase não encontrada');
    console.log('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
    return null;
  }
  
  return createClient(url.replace(/\/$/, ''), key);
}

async function main() {
  console.log('🔍 Iniciando migração de carros de contas duplicadas...\n');
  
  // Conectar ao banco
  const pgClient = createPgClient();
  if (!pgClient) process.exit(1);
  
  try {
    await pgClient.connect();
    console.log('✅ Conectado ao PostgreSQL');
  } catch (error) {
    console.error('❌ Erro ao conectar no PostgreSQL:', error.message);
    process.exit(1);
  }
  
  const supabaseAdmin = createSupabaseAdmin();
  if (!supabaseAdmin) {
    console.log('⚠️  Supabase não configurado, continuando apenas com PostgreSQL');
  } else {
    console.log('✅ Cliente Supabase Admin configurado');
  }
  
  try {
    // 1. Identificar usuários duplicados por email
    console.log('\n📊 Identificando usuários duplicados...');
    
    const duplicatesQuery = `
      SELECT 
        email,
        COUNT(*) as count,
        STRING_AGG(id, ', ' ORDER BY auth_id IS NOT NULL DESC, criado_em ASC) as user_ids,
        STRING_AGG(
          CASE 
            WHEN auth_id IS NOT NULL THEN id || ' (OAuth)' 
            ELSE id || ' (senha)' 
          END, 
          ', ' ORDER BY auth_id IS NOT NULL DESC, criado_em ASC
        ) as user_details
      FROM users 
      WHERE email IS NOT NULL 
      GROUP BY LOWER(email) 
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `;
    
    const duplicatesResult = await pgClient.query(duplicatesQuery);
    
    if (duplicatesResult.rowCount === 0) {
      console.log('✅ Nenhum usuário duplicado encontrado!');
      return;
    }
    
    console.log(`📋 Encontrados ${duplicatesResult.rowCount} emails com contas duplicadas:`);
    duplicatesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.email} (${row.count} contas)`);
      console.log(`   IDs: ${row.user_details}`);
    });
    
    // 2. Para cada email duplicado, processar a migração
    for (const row of duplicatesResult.rows) {
      await processDuplicateEmail(pgClient, row.email);
    }
    
    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await pgClient.end();
    console.log('🔌 Conexão com banco encerrada');
  }
}

async function processDuplicateEmail(pgClient, email) {
  console.log(`\n🔄 Processando duplicatas para: ${email}`);
  
  // Buscar todas as contas deste email
  const usersQuery = `
    SELECT id, email, auth_id, criado_em, nome
    FROM users 
    WHERE LOWER(email) = LOWER($1)
    ORDER BY auth_id IS NOT NULL DESC, criado_em ASC
  `;
  
  const usersResult = await pgClient.query(usersQuery, [email]);
  const users = usersResult.rows;
  
  // Identificar conta principal (primeira com auth_id, ou mais antiga)
  const principalUser = users[0];
  const duplicateUsers = users.slice(1);
  
  console.log(`   📌 Conta principal: ${principalUser.id} (${principalUser.auth_id ? 'OAuth' : 'senha'})`);
  console.log(`   🗂️  Contas duplicadas: ${duplicateUsers.map(u => `${u.id} (${u.auth_id ? 'OAuth' : 'senha'})`).join(', ')}`);
  
  // Migrar carros das contas duplicadas para a principal
  for (const duplicateUser of duplicateUsers) {
    await migrateCarsFromUser(pgClient, duplicateUser.id, principalUser.id);
  }
  
  // Opcionalmente, remover contas duplicadas vazias
  await cleanupDuplicateUsers(pgClient, duplicateUsers, principalUser.id);
}

async function migrateCarsFromUser(pgClient, fromUserId, toUserId) {
  console.log(`   🚗 Migrando carros de ${fromUserId} para ${toUserId}...`);
  
  // Verificar quantos carros existem
  const countQuery = `SELECT COUNT(*) as count FROM cars WHERE user_id = $1`;
  const countResult = await pgClient.query(countQuery, [fromUserId]);
  const carCount = parseInt(countResult.rows[0].count);
  
  if (carCount === 0) {
    console.log(`       ℹ️  Nenhum carro encontrado para migrar`);
    return;
  }
  
  console.log(`       📊 ${carCount} carros encontrados`);
  
  // Migrar carros
  const updateQuery = `
    UPDATE cars 
    SET user_id = $1, updated_at = now() 
    WHERE user_id = $2
  `;
  
  const updateResult = await pgClient.query(updateQuery, [toUserId, fromUserId]);
  
  console.log(`       ✅ ${updateResult.rowCount} carros migrados com sucesso`);
}

async function cleanupDuplicateUsers(pgClient, duplicateUsers, principalUserId) {
  console.log(`   🧹 Limpando contas duplicadas...`);
  
  for (const user of duplicateUsers) {
    // Verificar se ainda há dados associados a esta conta
    const checksQueries = [
      `SELECT COUNT(*) as count FROM cars WHERE user_id = $1`,
      `SELECT COUNT(*) as count FROM guias WHERE autor_email = $1`,
      `SELECT COUNT(*) as count FROM payments WHERE user_email = $1`
    ];
    
    let hasData = false;
    for (const checkQuery of checksQueries) {
      const result = await pgClient.query(checkQuery, [user.id]);
      if (parseInt(result.rows[0].count) > 0) {
        hasData = true;
        break;
      }
    }
    
    if (!hasData) {
      // Remover conta duplicada sem dados
      const deleteQuery = `DELETE FROM users WHERE id = $1`;
      await pgClient.query(deleteQuery, [user.id]);
      console.log(`       🗑️  Conta duplicada ${user.id} removida (sem dados)`);
    } else {
      console.log(`       ⚠️  Conta ${user.id} mantida (ainda possui dados não migráveis)`);
    }
  }
}

// Executar script apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { main };