// Script para criar o usuário luciofp com celular
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');
const crypto = require('crypto');

async function createUser() {
  const email = 'luciofp@gmail.com'; // Email que o Google está retornando
  const nome = 'Lucio Freitas';
  const celular = '(21) 99187-0404';
  const userId = 'qRyVlb3M5qcfmLqCaKx7QJbwbz1'; // ID do Firebase
  
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

    // Verifica se já existe
    const check = await pgClient.query(
      'SELECT id, email, celular FROM users WHERE id = $1 OR LOWER(email) = LOWER($2)',
      [userId, email]
    );

    if (check.rowCount > 0) {
      console.log('⚠️  Usuário já existe! Atualizando celular...');
      const result = await pgClient.query(
        'UPDATE users SET celular = $1, nome = $2, atualizado_em = now() WHERE id = $3 OR LOWER(email) = LOWER($4) RETURNING id, email, nome, celular',
        [celular, nome, userId, email]
      );
      
      console.log('✅ Usuário atualizado!');
      console.log('\n📋 Dados:');
      console.log('━'.repeat(60));
      console.log('ID:      ', result.rows[0].id);
      console.log('Email:   ', result.rows[0].email);
      console.log('Nome:    ', result.rows[0].nome);
      console.log('Celular: ', result.rows[0].celular);
      console.log('━'.repeat(60));
    } else {
      console.log('➕ Criando novo usuário...');
      const result = await pgClient.query(
        `INSERT INTO users (id, email, nome, celular, criado_em, atualizado_em) 
         VALUES ($1, $2, $3, $4, now(), now()) 
         RETURNING id, email, nome, celular`,
        [userId, email, nome, celular]
      );
      
      console.log('✅ Usuário criado com sucesso!');
      console.log('\n📋 Dados:');
      console.log('━'.repeat(60));
      console.log('ID:      ', result.rows[0].id);
      console.log('Email:   ', result.rows[0].email);
      console.log('Nome:    ', result.rows[0].nome);
      console.log('Celular: ', result.rows[0].celular);
      console.log('━'.repeat(60));
    }

    console.log('\n🎉 Agora faça logout e login novamente!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
  } finally {
    await pgClient.end();
  }
}

createUser();
