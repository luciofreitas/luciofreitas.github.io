// backfill-authids.js
// Usage: set env DATABASE_URL (or PGHOST/PGUSER/PGPASSWORD/PGDATABASE), SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// node backfill-authids.js

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

function buildPgConfigFromEnv(){
  if(process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  const host = process.env.PGHOST || process.env.PG_HOST;
  const port = process.env.PGPORT || process.env.PG_PORT || 5432;
  const user = process.env.PGUSER || process.env.PG_USER;
  const password = process.env.PGPASSWORD || process.env.PG_PASSWORD;
  const database = process.env.PGDATABASE || process.env.PG_DATABASE;
  if(!host || !user || !password || !database) return null;
  return { host, port: Number(port), user, password, database };
}

async function main(){
  const pgCfg = buildPgConfigFromEnv();
  if(!pgCfg){
    console.error('No Postgres configuration found in env (DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE)');
    process.exit(1);
  }
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY){
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
  const pg = new Client(pgCfg);
  await pg.connect();
  console.log('Connected to Postgres, starting backfill...');

  // Paginate through Supabase auth users
  let page = 1;
  const perPage = 100;
  let processed = 0;
  while(true){
    console.log(`Fetching supabase users page ${page}`);
    const resp = await supabase.auth.admin.listUsers({ per_page: perPage, page });
    if(resp.error){
      console.error('Supabase listUsers error:', resp.error);
      break;
    }
    const users = (resp.data && resp.data.users) || resp.data || [];
    if(!users || users.length === 0) break;

    for(const u of users){
      try{
        const email = (u.email || '').trim().toLowerCase();
        if(!email) continue;
        // find matching users row by email
        const r = await pg.query('SELECT id, auth_id FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
        if(r.rowCount === 0) continue;
        const row = r.rows[0];
        if(row.auth_id) continue; // already linked
        const uid = u.id;
        // Update users.auth_id
        await pg.query('UPDATE users SET auth_id = $1, atualizado_em = now() WHERE id = $2', [uid, row.id]);
        console.log('Linked user', row.id, 'email=', email, '-> auth_id=', uid);
        processed++;
      }catch(e){
        console.warn('Error processing user', u && u.id, e && e.message ? e.message : e);
      }
    }

    // If less than perPage, we're done
    if(users.length < perPage) break;
    page++;
  }

  console.log('Backfill complete. total linked:', processed);
  await pg.end();
}

main().catch(e => { console.error('fatal', e && e.stack ? e.stack : e); process.exit(2); });
