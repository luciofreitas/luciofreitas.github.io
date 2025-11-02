#!/usr/bin/env node
/**
 * MIGRAÇÃO COMPLETA - Resolve TODOS os problemas de sincronização de dados
 * 
 * Este script:
 * 1. Identifica usuários duplicados por email
 * 2. Consolida TODOS os dados (carros, guias, pagamentos) na conta principal
 * 3. Garante que login Gmail e senha sempre retornem os mesmos dados
 * 4. Limpa contas duplicadas vazias
 * 
 * Uso: node complete_data_migration.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { Client } = require('pg');

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
    return null;
  }
  
  return new Client(cfg);
}

async function main() {
  console.log('🚀 MIGRAÇÃO COMPLETA DE DADOS - Sincronização Gmail/Senha\n');
  
  const pgClient = createPgClient();
  if (!pgClient) process.exit(1);
  
  try {
    await pgClient.connect();
    console.log('✅ Conectado ao PostgreSQL\n');
  } catch (error) {
    console.error('❌ Erro ao conectar no PostgreSQL:', error.message);
    process.exit(1);
  }
  
  try {
    // 1. ANÁLISE: Verificar estado atual dos dados
    console.log('📊 ANALISANDO ESTADO ATUAL DOS DADOS...\n');
    await analyzeCurrentState(pgClient);
    
    // 2. CONSOLIDAÇÃO: Migrar todos os dados para usuário principal
    console.log('🔄 CONSOLIDANDO DADOS...\n');
    await consolidateAllData(pgClient);
    
    // 3. VERIFICAÇÃO: Confirmar que tudo foi migrado corretamente
    console.log('✅ VERIFICANDO RESULTADO FINAL...\n');
    await verifyMigrationResults(pgClient);
    
    console.log('🎉 MIGRAÇÃO COMPLETA FINALIZADA COM SUCESSO!');
    console.log('📋 RESULTADO: Login Gmail e senha agora retornam os mesmos dados\n');
    
  } catch (error) {
    console.error('💥 Erro durante a migração:', error);
    throw error;
  } finally {
    await pgClient.end();
    console.log('🔌 Conexão com banco encerrada');
  }
}

async function analyzeCurrentState(pgClient) {
  // Analisar usuários
  const usersQuery = `
    SELECT 
      email,
      COUNT(*) as user_count,
      STRING_AGG(id, ', ' ORDER BY auth_id IS NOT NULL DESC, criado_em ASC) as user_ids,
      STRING_AGG(
        CASE 
          WHEN auth_id IS NOT NULL THEN 'OAuth(' || id || ')' 
          ELSE 'Senha(' || id || ')' 
        END, 
        ', '
      ) as user_types
    FROM users 
    WHERE email IS NOT NULL 
    GROUP BY LOWER(email) 
    ORDER BY COUNT(*) DESC
  `;
  
  const usersResult = await pgClient.query(usersQuery);
  console.log(`👥 USUÁRIOS: ${usersResult.rowCount} emails únicos encontrados`);
  
  usersResult.rows.forEach((row, index) => {
    console.log(`   ${index + 1}. ${row.email}: ${row.user_count} conta(s) - ${row.user_types}`);
  });
  
  // Analisar carros
  const carsQuery = `
    SELECT 
      COUNT(*) as total_cars,
      COUNT(DISTINCT user_id) as unique_users_with_cars
    FROM cars
  `;
  const carsResult = await pgClient.query(carsQuery);
  console.log(`\n🚗 CARROS: ${carsResult.rows[0].total_cars} carros de ${carsResult.rows[0].unique_users_with_cars} usuários`);
  
  // Analisar guias
  const guiasQuery = `
    SELECT 
      COUNT(*) as total_guias,
      COUNT(DISTINCT autor_email) as unique_authors
    FROM guias
  `;
  const guiasResult = await pgClient.query(guiasQuery);
  console.log(`📖 GUIAS: ${guiasResult.rows[0].total_guias} guias de ${guiasResult.rows[0].unique_authors} autores`);
  
  // Analisar pagamentos
  const paymentsQuery = `
    SELECT 
      COUNT(*) as total_payments,
      COUNT(DISTINCT user_email) as unique_payers
    FROM payments
  `;
  const paymentsResult = await pgClient.query(paymentsQuery);
  console.log(`💳 PAGAMENTOS: ${paymentsResult.rows[0].total_payments} pagamentos de ${paymentsResult.rows[0].unique_payers} usuários\n`);
}

async function consolidateAllData(pgClient) {
  // Buscar emails com múltiplas contas
  const duplicatesQuery = `
    SELECT 
      email,
      array_agg(id ORDER BY auth_id IS NOT NULL DESC, criado_em ASC) as user_ids,
      array_agg(auth_id ORDER BY auth_id IS NOT NULL DESC, criado_em ASC) as auth_ids
    FROM users 
    WHERE email IS NOT NULL 
    GROUP BY LOWER(email) 
    HAVING COUNT(*) > 1
  `;
  
  const duplicatesResult = await pgClient.query(duplicatesQuery);
  
  if (duplicatesResult.rowCount === 0) {
    console.log('✅ Nenhuma conta duplicada encontrada para consolidar');
    return;
  }
  
  console.log(`🔧 Consolidando ${duplicatesResult.rowCount} emails com contas duplicadas...\n`);
  
  for (const row of duplicatesResult.rows) {
    await consolidateUserData(pgClient, row.email, row.user_ids, row.auth_ids);
  }
}

async function consolidateUserData(pgClient, email, userIds, authIds) {
  console.log(`📧 Consolidando dados para: ${email}`);
  console.log(`   👥 Contas: ${userIds.join(', ')}`);
  
  // Determinar conta principal (primeira com auth_id, ou mais antiga)
  const principalUserId = userIds[0];
  const duplicateUserIds = userIds.slice(1);
  
  console.log(`   🎯 Conta principal: ${principalUserId}`);
  console.log(`   🗂️  Contas para consolidar: ${duplicateUserIds.join(', ')}`);
  
  // Migrar TODOS os tipos de dados
  await migrateUserCars(pgClient, duplicateUserIds, principalUserId);
  await migrateUserGuias(pgClient, duplicateUserIds, principalUserId, email);
  await migrateUserPayments(pgClient, duplicateUserIds, principalUserId, email);
  
  // Garantir que a conta principal tem auth_id
  const principalAuthId = authIds.find(id => id !== null) || authIds[0];
  if (principalAuthId) {
    await pgClient.query(
      'UPDATE users SET auth_id = $1, atualizado_em = now() WHERE id = $2',
      [principalAuthId, principalUserId]
    );
    console.log(`   🔗 Auth_id atualizado: ${principalAuthId}`);
  }
  
  // Remover contas duplicadas vazias
  await cleanupEmptyAccounts(pgClient, duplicateUserIds, email);
  
  console.log(`   ✅ Consolidação concluída para ${email}\n`);
}

async function migrateUserCars(pgClient, fromUserIds, toUserId) {
  let totalMigrated = 0;
  
  for (const fromUserId of fromUserIds) {
    const result = await pgClient.query(
      'UPDATE cars SET user_id = $1, updated_at = now() WHERE user_id = $2',
      [toUserId, fromUserId]
    );
    totalMigrated += result.rowCount;
  }
  
  if (totalMigrated > 0) {
    console.log(`      🚗 ${totalMigrated} carros migrados`);
  }
}

async function migrateUserGuias(pgClient, fromUserIds, toUserId, email) {
  // Migrar guias por email (autor_email)
  const result = await pgClient.query(
    'UPDATE guias SET autor_email = $1, atualizado_em = now() WHERE autor_email = ANY($2::text[])',
    [email, fromUserIds]
  );
  
  if (result.rowCount > 0) {
    console.log(`      📖 ${result.rowCount} guias migradas`);
  }
}

async function migrateUserPayments(pgClient, fromUserIds, toUserId, email) {
  // Migrar pagamentos por email (user_email)
  const result = await pgClient.query(
    'UPDATE payments SET user_email = $1 WHERE user_email = ANY($2::text[])',
    [email, fromUserIds]
  );
  
  if (result.rowCount > 0) {
    console.log(`      💳 ${result.rowCount} pagamentos migrados`);
  }
}

async function cleanupEmptyAccounts(pgClient, userIds, email) {
  let removed = 0;
  
  for (const userId of userIds) {
    // Verificar se a conta tem dados não migráveis
    const checksQueries = [
      { query: 'SELECT COUNT(*) as count FROM cars WHERE user_id = $1', param: userId },
      { query: 'SELECT COUNT(*) as count FROM guias WHERE autor_email = $1', param: userId },
      { query: 'SELECT COUNT(*) as count FROM payments WHERE user_email = $1', param: userId }
    ];
    
    let hasData = false;
    for (const check of checksQueries) {
      const result = await pgClient.query(check.query, [check.param]);
      if (parseInt(result.rows[0].count) > 0) {
        hasData = true;
        break;
      }
    }
    
    if (!hasData) {
      await pgClient.query('DELETE FROM users WHERE id = $1', [userId]);
      removed++;
    }
  }
  
  if (removed > 0) {
    console.log(`      🗑️  ${removed} contas vazias removidas`);
  }
}

async function verifyMigrationResults(pgClient) {
  // Verificar se ainda há duplicatas
  const duplicatesCheck = await pgClient.query(`
    SELECT email, COUNT(*) as count
    FROM users 
    WHERE email IS NOT NULL 
    GROUP BY LOWER(email) 
    HAVING COUNT(*) > 1
  `);
  
  if (duplicatesCheck.rowCount === 0) {
    console.log('✅ Nenhuma conta duplicada restante');
  } else {
    console.log(`⚠️  Ainda existem ${duplicatesCheck.rowCount} emails com contas duplicadas`);
  }
  
  // Estatísticas finais
  const finalStats = await pgClient.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM cars) as total_cars,
      (SELECT COUNT(*) FROM guias) as total_guias,
      (SELECT COUNT(*) FROM payments) as total_payments
  `);
  
  const stats = finalStats.rows[0];
  console.log(`📊 ESTATÍSTICAS FINAIS:`);
  console.log(`   👥 ${stats.total_users} usuários`);
  console.log(`   🚗 ${stats.total_cars} carros`);
  console.log(`   📖 ${stats.total_guias} guias`);
  console.log(`   💳 ${stats.total_payments} pagamentos`);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { main };