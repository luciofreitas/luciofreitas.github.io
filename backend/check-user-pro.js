// Script para verificar e atualizar manualmente o status Pro de um usuário
const { Client } = require('pg');
require('dotenv').config();

const userId = '562f8a7c-489d-4953-be94-62ff0a9e2eac'; // ID do usuário

async function checkAndUpdateUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Detecta o nome correto da coluna is_pro
    const colsResult = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'"
    );
    const columnNames = colsResult.rows.map(r => String(r.column_name).toLowerCase());
    const isProCol = columnNames.includes('is_pro') ? 'is_pro' : (columnNames.includes('ispro') ? 'ispro' : null);

    if (!isProCol) {
      console.error('❌ Coluna is_pro não encontrada na tabela users');
      process.exit(1);
    }

    console.log(`📋 Usando coluna: ${isProCol}`);

    // Verifica o status atual do usuário
    console.log(`\n🔍 Verificando usuário: ${userId}`);
    const checkResult = await client.query(
      `SELECT id, email, nome, ${isProCol} FROM users WHERE id = $1 OR auth_id = $1`,
      [userId]
    );

    if (checkResult.rows.length === 0) {
      console.error('❌ Usuário não encontrado no banco de dados');
      process.exit(1);
    }

    const user = checkResult.rows[0];
    console.log('\n📊 Status atual do usuário:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.nome}`);
    console.log(`   is_pro: ${user[isProCol]}`);

    // Atualiza para is_pro = true
    console.log('\n🔄 Atualizando is_pro para true...');
    const updateResult = await client.query(
      `UPDATE users SET ${isProCol} = true, atualizado_em = now() WHERE id = $1 OR auth_id = $1 RETURNING id, email, ${isProCol}`,
      [userId]
    );

    if (updateResult.rowCount > 0) {
      const updated = updateResult.rows[0];
      console.log('✅ Usuário atualizado com sucesso!');
      console.log(`   is_pro: ${updated[isProCol]}`);
    } else {
      console.error('❌ Nenhuma linha foi atualizada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Conexão com banco de dados encerrada');
  }
}

// Executa o script
checkAndUpdateUser();
