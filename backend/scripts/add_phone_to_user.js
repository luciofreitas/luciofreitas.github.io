// Script para adicionar celular ao seu usuário específico
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function addPhoneToUser() {
  // Coloque seu email aqui
  const email = 'luciofp@gmail.com';
  const celular = '(21) 99999-9999'; // Coloque o número que você quer
  
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

    // Busca o usuário pelo email
    const result = await pgClient.query(
      'SELECT id, email, nome, celular FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rowCount === 0) {
      console.log(`❌ Usuário não encontrado com email: ${email}`);
      console.log('\n💡 Faça login uma vez para criar o usuário no banco!');
      return;
    }

    const user = result.rows[0];
    console.log('📋 Usuário encontrado:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nome:', user.nome);
    console.log('   Celular atual:', user.celular || '(vazio)');

    // Atualiza o celular
    await pgClient.query(
      'UPDATE users SET celular = $1, atualizado_em = now() WHERE id = $2',
      [celular, user.id]
    );

    console.log('\n✅ Celular atualizado para:', celular);
    
    // Verifica
    const verify = await pgClient.query(
      'SELECT celular FROM users WHERE id = $1',
      [user.id]
    );
    
    console.log('✅ Verificação: celular agora é', verify.rows[0].celular);
    console.log('\n🎉 Faça logout e login novamente para ver o celular aparecer!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pgClient.end();
  }
}

addPhoneToUser();
