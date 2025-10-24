// debug-backfill.js
// Purpose: Inspect why backfill linked 0 users by comparing Supabase admin users
// with Postgres `public.users` rows (no writes). Usage: set env DATABASE_URL,
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and run `node debug-backfill.js`.

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

  const supabase = createClient(process.env.SUPABASE_URL.replace(/\/+$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
  const pg = new Client(pgCfg);
  await pg.connect();
  console.log('Connected to Postgres, starting debug pass...');

  const perPage = 100;
  let page = 1;
  let total = 0;
  let matchedByEmail = 0;
  let matchedByAuthId = 0;
  let noEmail = 0;
  let alreadyLinked = 0;

  while(true){
    console.log(`Fetching supabase users page ${page}`);
    const res = await supabase.auth.admin.listUsers({ per_page: perPage, page });
    if(res.error){
      console.error('Supabase listUsers error:', res.error);
      break;
    }
    const users = (res.data && res.data.users) || res.data || [];
    if(!users || users.length === 0) break;

    for(const u of users){
      total++;
      const uid = u.id;
      const email = (u.email || '').trim().toLowerCase();
      if(!email){
        noEmail++;
        console.log(`#${total} uid=${uid} NO_EMAIL`);
        continue;
      }

      try{
        // try match by auth_id
        const r1 = await pg.query('SELECT id, email, auth_id FROM users WHERE auth_id = $1 LIMIT 1', [uid]);
        if(r1.rowCount > 0){
          matchedByAuthId++;
          const row = r1.rows[0];
          console.log(`#${total} uid=${uid} email=${email} -> MATCH_BY_AUTH_ID (users.id=${row.id}, users.email=${row.email})`);
          continue;
        }

        // try match by email (case-insensitive)
        const r2 = await pg.query('SELECT id, email, auth_id FROM users WHERE lower(trim(email)) = lower(trim($1)) LIMIT 1', [email]);
        if(r2.rowCount > 0){
          matchedByEmail++;
          const row = r2.rows[0];
          if(row.auth_id){ alreadyLinked++; }
          console.log(`#${total} uid=${uid} email=${email} -> MATCH_BY_EMAIL (users.id=${row.id}, users.email=${row.email}, auth_id=${row.auth_id || 'NULL'})`);
          continue;
        }

        // no match
        console.log(`#${total} uid=${uid} email=${email} -> NO_MATCH_IN_POSTGRES`);
      }catch(e){
        console.warn('#'+total+' uid='+uid+' ERROR', e && e.message ? e.message : e);
      }
    }

    if(users.length < perPage) break;
    page++;
  }

  console.log('--- debug summary ---');
  console.log('total_supabase_users:', total);
  console.log('matched_by_auth_id:', matchedByAuthId);
  console.log('matched_by_email:', matchedByEmail);
  console.log('already_linked (had auth_id):', alreadyLinked);
  console.log('no_email_on_supabase_users:', noEmail);

  await pg.end();
}

main().catch(e => { console.error('fatal', e && e.stack ? e.stack : e); process.exit(2); });
