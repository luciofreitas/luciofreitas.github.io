// check-cars-structure.js
const { Client } = require('pg');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('ERROR: DATABASE_URL not set');
    process.exit(2);
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 Checking cars table structure...');
    
    // Get table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'cars' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Cars table columns:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Sample data
    const sample = await client.query('SELECT * FROM cars LIMIT 2');
    console.log('\n📝 Sample data:');
    console.log(sample.rows);
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to check structure:');
    console.error(err.message);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();