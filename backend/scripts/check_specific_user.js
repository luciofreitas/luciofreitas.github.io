// Script para verificar um usuário específico por ID
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function checkSpecificUser() {
  // ID do seu usuário visto no console
  const userId = 'qRyVlb3M5qcfmLqCaKx7QJbwbz1';
  
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

    // Busca o usuário pelo ID
    const result = await pgClient.query(
      'SELECT id, email, nome, celular, photo_url, auth_id, criado_em FROM users WHERE id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      console.log(`❌ Usuário não encontrado com ID: ${userId}`);
      console.log('\n🔍 Procurando pelo email luciofp@gmail.com...');
      
      const emailResult = await pgClient.query(
        'SELECT id, email, nome, celular, photo_url, auth_id, criado_em FROM users WHERE LOWER(email) = LOWER($1)',
        ['luciofp@gmail.com']
      );
      
      if (emailResult.rowCount === 0) {
        console.log('❌ Também não encontrado por email!');
        console.log('\n📋 Listando todos os usuários com email similar:');
        
        const similarResult = await pgClient.query(
          "SELECT id, email, nome, celular FROM users WHERE email ILIKE '%lucio%' ORDER BY criado_em DESC LIMIT 5"
        );
        
        similarResult.rows.forEach(u => {
          console.log(`\n  ID: ${u.id}`);
          console.log(`  Email: ${u.email}`);
          console.log(`  Nome: ${u.nome}`);
          console.log(`  Celular: ${u.celular || '(vazio)'}`);
        });
      } else {
        console.log('✅ Encontrado por email!');
        const user = emailResult.rows[0];
        console.log('\n📋 Dados do usuário:');
        console.log('━'.repeat(60));
        console.log('ID:       ', user.id);
        console.log('Email:    ', user.email);
        console.log('Nome:     ', user.nome);
        console.log('Celular:  ', user.celular ? `"${user.celular}"` : '(NULL ou vazio)');
        console.log('Photo:    ', user.photo_url ? 'Sim' : 'Não');
        console.log('Auth ID:  ', user.auth_id || '(NULL)');
        console.log('Criado:   ', user.criado_em);
        console.log('━'.repeat(60));
      }
    } else {
      const user = result.rows[0];
      console.log('📋 Dados do usuário:');
      console.log('━'.repeat(60));
      console.log('ID:       ', user.id);
      console.log('Email:    ', user.email);
      console.log('Nome:     ', user.nome);
      console.log('Celular:  ', user.celular ? `"${user.celular}"` : '(NULL ou vazio)');
      console.log('Photo:    ', user.photo_url ? 'Sim' : 'Não');
      console.log('Auth ID:  ', user.auth_id || '(NULL)');
      console.log('Criado:   ', user.criado_em);
      console.log('━'.repeat(60));
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pgClient.end();
  }
}

checkSpecificUser();
