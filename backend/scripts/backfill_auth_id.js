// Backfill script: populate users.auth_id by matching emails with Supabase Auth users
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
(async () => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const { Client } = require('pg');
    const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !key) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
      process.exit(2);
    }
    const supabaseAdmin = createClient(url, key);
    const pgCfg = (function(){
      if(process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } };
      const host = process.env.PGHOST || process.env.PG_HOST; if(!host) return null;
      return { host, port: Number(process.env.PGPORT || process.env.PG_PORT || 5432), user: process.env.PGUSER || process.env.PG_USER, password: process.env.PGPASSWORD || process.env.PG_PASSWORD, database: process.env.PGDATABASE || process.env.PG_DATABASE, ssl: { rejectUnauthorized: false } };
    })();
    if(!pgCfg) { console.error('Postgres config not found in env'); process.exit(3); }
    const pg = new Client(pgCfg);
    await pg.connect();
    console.log('Connected to Postgres, starting backfill...');

    const res = await pg.query("SELECT id, email FROM users WHERE email IS NOT NULL AND (auth_id IS NULL OR auth_id = '')");
    console.log(`Found ${res.rowCount} candidate rows`);
    for(const row of res.rows){
      try{
        const email = row.email;
        const listRes = await supabaseAdmin.auth.admin.listUsers();
        const users = (listRes && listRes.data && listRes.data.users) ? listRes.data.users : (listRes && listRes.data) ? listRes.data : [];
        const found = users.find(u => u.email && String(u.email).toLowerCase() === String(email).toLowerCase());
        if(found){
          await pg.query('UPDATE users SET auth_id = $1, atualizado_em = now() WHERE id = $2', [found.id, row.id]);
          console.log(`Backfilled ${row.id} -> ${found.id}`);
        }
      }catch(e){ console.warn('Row failed', row.id, e && e.message ? e.message : e); }
    }
    await pg.end();
    console.log('Backfill complete');
  } catch (err) {
    console.error('Unexpected error', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
