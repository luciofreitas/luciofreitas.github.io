require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
(async () => {
  try {
    const { Client } = require('pg');
    const cfg = (function(){
      if(process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } };
      const host = process.env.PGHOST || process.env.PG_HOST; if(!host) return null;
      return { host, port: Number(process.env.PGPORT || process.env.PG_PORT || 5432), user: process.env.PGUSER || process.env.PG_USER, password: process.env.PGPASSWORD || process.env.PG_PASSWORD, database: process.env.PGDATABASE || process.env.PG_DATABASE, ssl: { rejectUnauthorized: false } };
    })();
    if(!cfg) { console.error('Postgres config not found in env'); process.exit(2); }
    const client = new Client(cfg);
    await client.connect();
    const limit = process.argv[2] || 200;
  const r = await client.query('SELECT id, email, auth_id FROM users WHERE auth_id IS NOT NULL ORDER BY id LIMIT $1', [limit]);
    console.log(`Found ${r.rowCount} users with auth_id (showing up to ${limit}):`);
    for(const row of r.rows){
      console.log(row);
    }
    await client.end();
  } catch (e) { console.error('Error', e && e.message ? e.message : e); process.exit(1); }
})();
