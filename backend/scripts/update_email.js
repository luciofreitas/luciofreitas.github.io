// Script para atualizar o email no banco
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function updateEmail() {
  const oldEmail = 'luciodfp@gmail.com';
  const newEmail = 'luciofp@gmail.com'; // Email que o Google retorna
  
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

    // Verifica se existe usuário com email antigo
    const oldUser = await pgClient.query(
      'SELECT id, email, nome, celular FROM users WHERE LOWER(email) = LOWER($1)',
      [oldEmail]
    );

    if (oldUser.rowCount === 0) {
      console.log(`❌ Usuário com email ${oldEmail} não encontrado!`);
      return;
    }

    console.log('📋 Usuário encontrado:');
    console.log('   Email antigo:', oldUser.rows[0].email);
    console.log('   Nome:', oldUser.rows[0].nome);
    console.log('   Celular:', oldUser.rows[0].celular);

    // Verifica se já existe usuário com email novo
    const newUser = await pgClient.query(
      'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)',
      [newEmail]
    );

    if (newUser.rowCount > 0) {
      console.log(`\n⚠️  Já existe usuário com email ${newEmail}!`);
      console.log('   Deletando usuário duplicado...');
      await pgClient.query('DELETE FROM users WHERE LOWER(email) = LOWER($1)', [newEmail]);
      console.log('   ✅ Deletado!');
    }

    // Atualiza o email
    const result = await pgClient.query(
      'UPDATE users SET email = $1, atualizado_em = now() WHERE LOWER(email) = LOWER($2) RETURNING id, email, nome, celular',
      [newEmail, oldEmail]
    );

    console.log('\n✅ Email atualizado com sucesso!');
    console.log('\n📋 Dados atualizados:');
    console.log('━'.repeat(60));
    console.log('Email novo:', result.rows[0].email);
    console.log('Nome:      ', result.rows[0].nome);
    console.log('Celular:   ', result.rows[0].celular);
    console.log('━'.repeat(60));
    console.log('\n🎉 Faça logout e login novamente!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pgClient.end();
  }
}

updateEmail();
