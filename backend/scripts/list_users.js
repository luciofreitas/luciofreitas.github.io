// Script para listar todos os usuários
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function listUsers() {
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

    const result = await pgClient.query(`
      SELECT id, email, nome, celular, is_pro, 
             TO_CHAR(criado_em, 'YYYY-MM-DD HH24:MI') as data_criacao
      FROM users 
      ORDER BY criado_em DESC 
      LIMIT 10
    `);

    console.log(`📋 Últimos ${result.rowCount} usuários cadastrados:`);
    console.log('━'.repeat(80));
    
    result.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.nome || '(sem nome)'}`);
      console.log(`   Email:    ${user.email}`);
      console.log(`   ID:       ${user.id.substring(0, 20)}...`);
      console.log(`   Celular:  ${user.celular || '(vazio)'}`);
      console.log(`   Is Pro:   ${user.is_pro ? 'Sim' : 'Não'}`);
      console.log(`   Criado:   ${user.data_criacao}`);
    });
    
    console.log('\n' + '━'.repeat(80));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pgClient.end();
  }
}

listUsers();
