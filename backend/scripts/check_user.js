// Script para ver os dados de um usuário específico
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function checkUser() {
  const email = 'luciofp@gmail.com';
  
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

    const result = await pgClient.query(
      'SELECT id, email, nome, celular, is_pro, criado_em FROM users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      console.log('❌ Usuário não encontrado:', email);
    } else {
      console.log('📋 Dados do usuário:');
      console.log('━'.repeat(60));
      const user = result.rows[0];
      console.log('ID:       ', user.id);
      console.log('Email:    ', user.email);
      console.log('Nome:     ', user.nome);
      console.log('Celular:  ', user.celular || '(vazio)');
      console.log('Is Pro:   ', user.is_pro);
      console.log('Criado em:', user.criado_em);
      console.log('━'.repeat(60));
      
      if (!user.celular) {
        console.log('\n💡 O campo celular está vazio!');
        console.log('   Para adicionar um número, edite o script backend/scripts/update_phone.js');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pgClient.end();
  }
}

checkUser();
