#!/usr/bin/env node
// webhook-harness.js
// Small test harness to simulate Supabase Auth webhook payloads (user.created and user.updated)
// and verify DB changes in `public.users`.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { Client } = require('pg');

function buildPgConfig() {
  if (process.env.DATABASE_URL) {
    const cfg = { connectionString: process.env.DATABASE_URL };
    // enable ssl if sslmode=require or PGSSL set
    const wantsSsl = (process.env.PGSSL && String(process.env.PGSSL).toLowerCase() === 'true')
      || (/([?&])sslmode=require/i).test(String(process.env.DATABASE_URL || ''));
    if (wantsSsl) cfg.ssl = { rejectUnauthorized: false };
    return cfg;
  }
  return null;
}

function sendJson(urlStr, obj, headers = {}){
  return new Promise((resolve, reject) => {
    try{
      const url = new URL(urlStr);
      const body = JSON.stringify(obj);
      const opts = {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + (url.search || ''),
        headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers)
      };
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(opts, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try { json = JSON.parse(text); } catch (e) { json = text; }
          resolve({ status: res.statusCode, body: json });
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    }catch(err){ reject(err); }
  });
}

async function main(){
  const webhookUrl = process.env.WEBHOOK_TEST_URL || 'http://localhost:3001/api/auth/supabase-webhook';
  const webhookKey = process.env.SUPABASE_WEBHOOK_KEY || '';
  const pgCfg = buildPgConfig();

  console.log('Webhook harness starting');
  console.log('WEBHOOK:', webhookUrl);
  console.log('Using SUPABASE_WEBHOOK_KEY from env:', !!webhookKey);

  let client = null;
  if (pgCfg) {
    client = new Client(pgCfg);
    try { await client.connect(); console.log('Connected to Postgres'); } catch (e) { console.warn('Could not connect to Postgres:', e && e.message ? e.message : e); client = null; }
  } else {
    console.warn('No DATABASE_URL configured; DB checks will be skipped');
  }

  try {
    const uid = `webhook-test-${Date.now()}`;
    const email = `webhook-test+${Date.now()}@example.com`;
    const initial = {
      user: {
        id: uid,
        email: email,
        name: 'Webhook Test One',
        avatar_url: 'https://lh3.googleusercontent.com/example-avatar',
        updated_at: new Date().toISOString()
      }
    };

    console.log('\n-- Sending created payload --');
    const postHeaders = {};
    if (webhookKey) postHeaders['X-SUPABASE-WEBHOOK-KEY'] = webhookKey;
    const r1 = await sendJson(webhookUrl, initial, postHeaders);
    console.log('Webhook response:', r1.status, JSON.stringify(r1.body));

    if (client) {
      // Detect which columns are present to avoid SQL errors on different schemas
      const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
      const present = (colsRes.rows || []).map(r => String(r.column_name).toLowerCase());
      const want = ['id','auth_id','email','nome','name','photo_url','atualizado_em','updated_at'];
      const sel = want.filter(c => present.indexOf(c) >= 0);
      const selSql = sel.length ? sel.join(', ') : '*';
      const q = `SELECT ${selSql} FROM users WHERE auth_id = $1 OR email = $2 LIMIT 1`;
      const rr = await client.query(q, [uid, email]);
      console.log('DB lookup after create attempt, rows:', rr.rowCount);
      if (rr.rowCount > 0) console.log('Row:', rr.rows[0]);
      else console.log('No row found (auto-create may be disabled)');
    }

    // Now attempt an update with newer updated_at and different name/photo
    const later = new Date(Date.now() + 60 * 1000).toISOString();
    const updated = {
      user: {
        id: uid,
        email: email,
        name: 'Webhook Test One - Updated',
        avatar_url: 'https://lh3.googleusercontent.com/example-avatar-updated',
        updated_at: later
      }
    };

    console.log('\n-- Sending updated payload (newer timestamp) --');
    const r2 = await sendJson(webhookUrl, updated, postHeaders);
    console.log('Webhook response:', r2.status, JSON.stringify(r2.body));

    if (client) {
      const colsRes2 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
      const present2 = (colsRes2.rows || []).map(r => String(r.column_name).toLowerCase());
      const want2 = ['id','auth_id','email','nome','name','photo_url','atualizado_em','updated_at'];
      const sel2 = want2.filter(c => present2.indexOf(c) >= 0);
      const selSql2 = sel2.length ? sel2.join(', ') : '*';
      const q2 = `SELECT ${selSql2} FROM users WHERE auth_id = $1 OR email = $2 LIMIT 1`;
      const rr2 = await client.query(q2, [uid, email]);
      console.log('DB lookup after update attempt, rows:', rr2.rowCount);
      if (rr2.rowCount > 0) console.log('Row:', rr2.rows[0]);
      else console.log('No row found after update (no-op)');
    }

    console.log('\nHarness complete. Note: if the server did not create or update rows, check SUPABASE_WEBHOOK_AUTO_CREATE and SUPABASE_WEBHOOK_FORCE_SYNC env vars and ensure the server is running on the expected port.');
  } catch (err) {
    console.error('Harness error:', err && err.stack ? err.stack : err);
  } finally {
    try { if (client) await client.end(); } catch (e){}
  }
}

main().catch(e => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
