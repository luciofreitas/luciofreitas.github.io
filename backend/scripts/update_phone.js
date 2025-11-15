// Script para atualizar o campo celular de um usuário específico
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function updatePhone() {
  const email = 'luciofp@gmail.com';
  const celular = ''; // COLOQUE O NÚMERO AQUI
  
  if (!celular) {
    console.log('❌ Por favor, edite o script e adicione o número de celular');
    process.exit(1);
  }
  
  // Usar DATABASE_URL se disponível
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
    console.log('✅ Conectado ao PostgreSQL');

    // Verifica se o usuário existe
    const checkResult = await pgClient.query(
      'SELECT id, email, name, nome, celular, telefone, phone FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rowCount === 0) {
      console.log('❌ Usuário não encontrado:', email);
      process.exit(1);
    }

    console.log('\n📋 Dados ANTES da atualização:');
    console.log(checkResult.rows[0]);

    // Atualiza o celular
    await pgClient.query(
      'UPDATE users SET celular = $1, telefone = $1, phone = $1, atualizado_em = now() WHERE email = $2',
      [celular, email]
    );

    console.log('\n✅ Celular atualizado!');

    // Verifica os dados atualizados
    const verifyResult = await pgClient.query(
      'SELECT id, email, name, nome, celular, telefone, phone FROM users WHERE email = $1',
      [email]
    );

    console.log('\n📋 Dados DEPOIS da atualização:');
    console.log(verifyResult.rows[0]);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pgClient.end();
    console.log('\n🔌 Desconectado do PostgreSQL');
  }
}

updatePhone();
