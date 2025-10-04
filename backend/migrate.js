#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function buildPgConfig(){
  if(process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  const host = process.env.PGHOST || process.env.PG_HOST;
  const port = process.env.PGPORT || process.env.PG_PORT || 5432;
  const user = process.env.PGUSER || process.env.PG_USER;
  const password = process.env.PGPASSWORD || process.env.PG_PASSWORD;
  const database = process.env.PGDATABASE || process.env.PG_DATABASE;
  if(!host || !user || !password || !database) return null;
  return { host, port: Number(port), user, password, database };
}

async function run(){
  const cfg = buildPgConfig();
  if(!cfg){
    console.error('No Postgres configuration detected. Please set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE');
    process.exit(1);
  }
  const client = new Client(cfg);
  try{
    await client.connect();
    const sqlPath = path.join(__dirname, '..', 'db', 'schema.sql');
    if(!fs.existsSync(sqlPath)){
      console.error('schema.sql not found at', sqlPath);
      process.exit(1);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Applying schema from', sqlPath);
    // split on semicolon followed by newline to avoid running huge single command in some cases
    // but fallback to single full-run
    try{
      await client.query(sql);
      console.log('Migration applied successfully');
    }catch(e){
      console.warn('Direct full-file execution failed, attempting split execution:', e.message);
      const statements = sql.split(/;\s*\n/).map(s=>s.trim()).filter(Boolean);
      for(const stmt of statements){
        try{ await client.query(stmt); }catch(err){ console.error('Statement failed:', err.message); }
      }
      console.log('Migration finished with split execution');
    }
  }catch(err){
    console.error('Migration failed:', err && err.message ? err.message : err);
    process.exit(1);
  }finally{
    try{ await client.end(); }catch(e){}
  }
}

run();
