require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
(async () => {
  try {
    const { Client } = require('pg');
    const email = process.argv[2] || 'luciodfp@gmail.com';
    const cfg = (function(){
      if(process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } };
      const host = process.env.PGHOST || process.env.PG_HOST; if(!host) return null;
      return { host, port: Number(process.env.PGPORT || process.env.PG_PORT || 5432), user: process.env.PGUSER || process.env.PG_USER, password: process.env.PGPASSWORD || process.env.PG_PASSWORD, database: process.env.PGDATABASE || process.env.PG_DATABASE, ssl: { rejectUnauthorized: false } };
    })();
    if(!cfg) { console.error('Postgres config not found in env'); process.exit(2); }
    const client = new Client(cfg);
    await client.connect();
    const r = await client.query('SELECT id, email, auth_id, photo_url, senha FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
    if(r && r.rowCount > 0) console.log('User row:', r.rows[0]); else console.log('No row found for', email);
    await client.end();
  } catch (e) { console.error('Error', e && e.message ? e.message : e); process.exit(1); }
})();
