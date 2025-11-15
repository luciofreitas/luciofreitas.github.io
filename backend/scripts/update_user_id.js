// Script para atualizar o ID do usuário para corresponder ao Firebase
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function updateUserId() {
  const email = 'luciofp@gmail.com';
  const newId = 'qRyVlb3M5qcfmLqCaKx7QJbwbz1'; // ID do Firebase
  
  const connectionString = process.env.DATABASE_URL;
  const pgClient = new Client(connectionString ? {
    connectionString,
    ssl: { rejectUnauthorized: false }
  } : {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pgClient.connect();
    console.log('✅ Conectado ao PostgreSQL\n');

    // Busca o usuário atual
    const current = await pgClient.query(
      'SELECT id, email, nome, celular FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (current.rowCount === 0) {
      console.log(`❌ Usuário com email ${email} não encontrado!`);
      return;
    }

    const oldId = current.rows[0].id;
    console.log('📋 Dados atuais:');
    console.log('   ID antigo:', oldId);
    console.log('   Email:    ', current.rows[0].email);
    console.log('   Nome:     ', current.rows[0].nome);
    console.log('   Celular:  ', current.rows[0].celular);

    if (oldId === newId) {
      console.log('\n✅ ID já está correto! Nada a fazer.');
      return;
    }

    // Verifica se já existe usuário com o novo ID
    const existing = await pgClient.query(
      'SELECT id, email FROM users WHERE id = $1',
      [newId]
    );

    if (existing.rowCount > 0) {
      console.log(`\n⚠️  Já existe usuário com ID ${newId}!`);
      console.log('   Email do usuário existente:', existing.rows[0].email);
      console.log('   Deletando usuário duplicado...');
      await pgClient.query('DELETE FROM users WHERE id = $1', [newId]);
      console.log('   ✅ Deletado!');
    }

    // Atualiza o ID
    const result = await pgClient.query(
      'UPDATE users SET id = $1, atualizado_em = now() WHERE LOWER(email) = LOWER($2) RETURNING id, email, nome, celular',
      [newId, email]
    );

    console.log('\n✅ ID atualizado com sucesso!');
    console.log('\n📋 Dados atualizados:');
    console.log('━'.repeat(60));
    console.log('ID novo: ', result.rows[0].id);
    console.log('Email:   ', result.rows[0].email);
    console.log('Nome:    ', result.rows[0].nome);
    console.log('Celular: ', result.rows[0].celular);
    console.log('━'.repeat(60));
    console.log('\n🎉 Agora faça logout e login novamente!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('duplicate key')) {
      console.log('\n💡 Dica: Pode haver restrições de chave estrangeira.');
      console.log('   Tente deletar o usuário com o ID antigo primeiro.');
    }
  } finally {
    await pgClient.end();
  }
}

updateUserId();
