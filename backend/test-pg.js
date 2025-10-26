// Simple Postgres connection tester for Render/CI
// Usage: node -r dotenv/config test-pg.js
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function buildPgConfig(){
  if(process.env.DATABASE_URL) {
    const cfg = { connectionString: process.env.DATABASE_URL };
    const wantsSsl = (process.env.PGSSL && String(process.env.PGSSL).toLowerCase() === 'true')
      || (process.env.PGSSLMODE && String(process.env.PGSSLMODE).toLowerCase() === 'require')
      || (/([?&])sslmode=require/i).test(String(process.env.DATABASE_URL || ''));
    if (wantsSsl) cfg.ssl = { rejectUnauthorized: false };
    return cfg;
  }
  // fallback to individual PG envs
  const host = process.env.PGHOST || process.env.PG_HOST;
  const port = process.env.PGPORT || process.env.PG_PORT || 5432;
  const user = process.env.PGUSER || process.env.PG_USER;
  const password = process.env.PGPASSWORD || process.env.PG_PASSWORD;
  const database = process.env.PGDATABASE || process.env.PG_DATABASE;
  if(!host || !user || !password || !database) return null;
  const cfg = { host, port: Number(port), user, password, database };
  if(process.env.PGSSL === 'true') cfg.ssl = { rejectUnauthorized: false };
  return cfg;
}

async function run(){
  const cfg = buildPgConfig();
  console.log('Using PG config:', Object.assign({}, cfg, { ssl: cfg && cfg.ssl ? '[ssl]' : undefined }));
  if(!cfg){
    console.error('No Postgres configuration found in env. Check DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE');
    process.exit(2);
  }
  const client = new Client(cfg);
  try{
    await client.connect();
    const r = await client.query('SELECT version() as v, current_database() as db');
    console.log('Connected. Meta:', r.rows[0]);
    await client.end();
    process.exit(0);
  }catch(err){
    console.error('Postgres connect failed:');
    console.error(err && err.stack ? err.stack : err);
    try { await client.end().catch(()=>{}); } catch(e){}
    process.exit(3);
  }
}

run();
