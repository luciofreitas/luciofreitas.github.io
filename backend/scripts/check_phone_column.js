// Script para verificar se as colunas de telefone existem na tabela users
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function checkPhoneColumns() {
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
    console.log('✅ Conectado ao PostgreSQL\n');

    // Lista todas as colunas da tabela users
    const result = await pgClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('📋 Colunas da tabela users:');
    console.log('━'.repeat(60));
    result.rows.forEach(row => {
      const mark = ['celular', 'telefone', 'phone'].includes(row.column_name) ? '📱' : '  ';
      console.log(`${mark} ${row.column_name.padEnd(20)} | ${row.data_type.padEnd(15)} | Nullable: ${row.is_nullable}`);
    });
    console.log('━'.repeat(60));

    // Verifica especificamente as colunas de telefone
    const phoneColumns = result.rows.filter(row => 
      ['celular', 'telefone', 'phone'].includes(row.column_name)
    );

    if (phoneColumns.length === 0) {
      console.log('\n❌ NENHUMA coluna de telefone encontrada!');
      console.log('💡 Você precisa criar uma migração para adicionar essas colunas.');
      console.log('\nSQL sugerido:');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS celular TEXT;');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone TEXT;');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;');
    } else {
      console.log(`\n✅ Encontradas ${phoneColumns.length} colunas de telefone:`);
      phoneColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Mostra alguns usuários de exemplo
    console.log('\n📋 Exemplos de usuários (mostrando campos de telefone):');
    console.log('━'.repeat(60));
    const usersResult = await pgClient.query(`
      SELECT id, email, 
             COALESCE(celular, 'NULL') as celular,
             COALESCE(telefone, 'NULL') as telefone,
             COALESCE(phone, 'NULL') as phone
      FROM users 
      LIMIT 5
    `);

    usersResult.rows.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`  celular:  ${user.celular}`);
      console.log(`  telefone: ${user.telefone}`);
      console.log(`  phone:    ${user.phone}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pgClient.end();
    console.log('\n🔌 Desconectado do PostgreSQL');
  }
}

checkPhoneColumns();
