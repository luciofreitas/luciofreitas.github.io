// Script para cancelar assinatura Pro de todos os usuários
const { Client } = require('pg');
require('dotenv').config();

async function cancelAllProSubscriptions() {
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

    // Conta quantos usuários Pro existem
    const countResult = await client.query(`SELECT COUNT(*) as total FROM users WHERE ${isProCol} = true`);
    const totalPro = parseInt(countResult.rows[0].total);
    console.log(`📊 Total de usuários Pro encontrados: ${totalPro}`);

    if (totalPro === 0) {
      console.log('ℹ️  Nenhum usuário Pro encontrado. Nada a fazer.');
      process.exit(0);
    }

    // Atualiza todos os usuários para is_pro = false
    const updateResult = await client.query(
      `UPDATE users SET ${isProCol} = false, atualizado_em = now() WHERE ${isProCol} = true RETURNING id, email`
    );

    console.log(`✅ ${updateResult.rowCount} assinaturas Pro canceladas com sucesso!`);
    
    if (updateResult.rows.length > 0) {
      console.log('\n📝 Usuários atualizados:');
      updateResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.email} (ID: ${row.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao cancelar assinaturas:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Conexão com banco de dados encerrada');
  }
}

// Executa o script
cancelAllProSubscriptions();
