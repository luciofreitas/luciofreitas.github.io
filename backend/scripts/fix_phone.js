// Script para adicionar celular ao usuário correto
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function fixPhone() {
  const emailCorrect = 'luciofp@gmail.com';
  const celular = '(21) 99187-0404'; // Copiado do outro usuário
  
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

    // Atualiza o celular do usuário luciofp@gmail.com
    const result = await pgClient.query(
      'UPDATE users SET celular = $1, atualizado_em = now() WHERE LOWER(email) = LOWER($2) RETURNING id, email, nome, celular',
      [celular, emailCorrect]
    );

    if (result.rowCount === 0) {
      console.log(`❌ Usuário ${emailCorrect} não encontrado!`);
      console.log('💡 Faça login primeiro para criar o usuário!');
    } else {
      console.log('✅ Celular atualizado com sucesso!');
      console.log('\n📋 Dados atualizados:');
      console.log('━'.repeat(60));
      console.log('Email:   ', result.rows[0].email);
      console.log('Nome:    ', result.rows[0].nome);
      console.log('Celular: ', result.rows[0].celular);
      console.log('━'.repeat(60));
      console.log('\n🎉 Faça logout e login novamente para ver o celular!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pgClient.end();
  }
}

fixPhone();
