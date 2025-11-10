const path = require('path');
// Ensure backend loads its own .env file even if started from the repository root
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');

// Firebase Admin SDK removed: this project now uses Supabase for auth verification.
// If you previously used Firebase Admin for token verification, the behavior is
// intentionally disabled. To re-enable Firebase Admin, restore FIREBASE_SERVICE_ACCOUNT_JSON
// usage and add the dependency back to backend/package.json.

const app = express();

// Mercado Livre OAuth routes
const mercadoLivreRoutes = require('./routes/mercadolivre');
// Lightweight health check used by PaaS (Render) to detect readiness quickly.
// Keep this as the very first route so the platform can probe the process
// even if other initialization (DB connect) is still in progress.
app.get('/_health', (req, res) => {
  try {
    // Return basic process info without revealing secrets.
    return res.json({ ok: true, pid: process.pid, uptime: process.uptime() });
  } catch (e) { return res.status(500).json({ ok: false }); }
});
// Ensure basic CORS headers are always present (echo origin) so that
// preflight and redirected responses don't accidentally miss the header.
// This middleware runs early to guarantee headers for all routes.
app.use((req, res, next) => {
  try {
    const origin = req.headers.origin || req.headers.referer || '';
    // Echo the origin if present (more secure than wildcard for credentials)
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    else res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Debug, X-Debug-Key');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // Short-circuit OPTIONS preflight
    if (req.method === 'OPTIONS') return res.status(204).end();
  } catch (e) { /* ignore header set errors */ }
  return next();
});
// CORS: permitir solicitações do frontend hospedado no GitHub Pages e do próprio Render
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://luciofreitas.github.io',
  'https://luciofreitas-github-io.onrender.com',
  'https://garagemsmart.com.br',
  'http://garagemsmart.com.br'
];
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps, curl)
    if(!origin) return callback(null, true);
    
    // Normalize origin: remove trailing slash for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if(!isAllowed){
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.error(`[CORS] Blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Debug', 'X-Debug-Key']
}));
// Explicitly respond to preflight on all routes to ensure CORS headers are present
app.options('*', (req, res) => {
  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    else res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Debug, X-Debug-Key');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  } catch (e) { /* ignore */ }
  return res.status(204).end();
});
// Capture raw body for debugging parse errors (verify option stores raw body as string)
app.use(express.json({ verify: function (req, res, buf, encoding) {
  try { req.rawBody = buf && buf.toString(encoding || 'utf8'); } catch (e) { req.rawBody = null; }
}}));

// Mount Mercado Livre OAuth routes
app.use('/api/ml', mercadoLivreRoutes);

// Simple request logger to help debug missing routes / 404s in dev
app.use((req, res, next) => {
  try {
    const now = new Date().toISOString();
    const origin = req.headers.origin || req.headers.referer || '-';
    console.log(`[req] ${now} ${req.method} ${req.path} origin=${origin}`);
  } catch (e) { /* ignore logging errors */ }
  next();
});

// Error handler specifically to surface JSON parse issues and raw body for debugging.
// This will run when express.json fails to parse the incoming body.
app.use((err, req, res, next) => {
  try {
    if (err && (err.type === 'entity.parse.failed' || /JSON/.test(String(err.message || '')))) {
      // Log a truncated version of the raw body to help debugging without flooding logs.
      const raw = (req && req.rawBody) ? String(req.rawBody) : '<no raw body available>';
      console.error('Unhandled express error: JSON parse failed. Raw body (first 2000 chars):', raw && raw.length ? raw.slice(0, 2000) : raw);
      return res.status(400).json({ error: 'invalid JSON' });
    }
  } catch (e) { /* fall through to default handler */ }
  return next(err);
});

// Helper to determine whether a request should receive debug-level responses.
// Only allow debug responses when not in production to avoid leaking internals.
function isDebugRequest(req){
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const x = String(req.headers['x-debug'] || '').toLowerCase() === 'true';
    const k = String(req.headers['x-debug-key'] || '') === 'let-me-debug';
    return x || k;
  } catch (e) { return false; }
}

// Simple in-memory cache for proxied avatars: Map<url, { buffer, contentType, expiresAt }>
const avatarCache = new Map();
const AVATAR_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// Temporary in-memory audit log for /api/auth/link-account calls (debug only)
// This is intentionally ephemeral and exists to help diagnose why auth_id is not being written.
const linkAccountAudit = [];
const LINK_AUDIT_MAX = 200;
function pushLinkAudit(entry) {
  try {
    const e = { time: new Date().toISOString(), ...entry };
    linkAccountAudit.push(e);
    if (linkAccountAudit.length > LINK_AUDIT_MAX) linkAccountAudit.shift();
  } catch (err) { /* ignore audit push failures */ }
}

// Temporary in-memory password reset tokens (debug only)
// Map token -> { email, tempPassword, expiresAt }
const debugResetTokens = new Map();
function pushDebugResetToken(token, info) {
  try {
    debugResetTokens.set(token, info);
    // Clean expired entries (simple sweep)
    const now = Date.now();
    for (const [k, v] of debugResetTokens.entries()) {
      if (v && v.expiresAt && v.expiresAt < now) debugResetTokens.delete(k);
    }
  } catch (e) { /* ignore */ }
}

// Helper to fetch remote URL bytes. Try to use node-fetch if installed, otherwise fallback to https.
async function fetchUrlBytes(url) {
  // Try node-fetch dynamically
  try {
    const nf = require('node-fetch');
    const r = await nf(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'GaragemSmart-AvatarProxy/1.0' }, timeout: 15000 });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const contentType = r.headers.get('content-type') || 'application/octet-stream';
    const buf = await r.buffer();
    return { buffer: buf, contentType };
  } catch (e) {
    // fallback to https
  }
  return new Promise((resolve, reject) => {
    try {
      const https = require('https');
      const parsed = new URL(url);
      const opts = { headers: { 'User-Agent': 'GaragemSmart-AvatarProxy/1.0' } };
      https.get(parsed, opts, (resp) => {
        const statusCode = resp.statusCode || 0;
        if (statusCode >= 400) return reject(new Error('status ' + statusCode));
        const chunks = [];
        resp.on('data', (c) => chunks.push(c));
        resp.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = resp.headers['content-type'] || 'application/octet-stream';
          resolve({ buffer, contentType });
        });
      }).on('error', (err) => reject(err)).setTimeout(15000, function() { this.destroy(new Error('timeout')); });
    } catch (err) { reject(err); }
  });
}

// Production-capable, secure PG connectivity check.
// Requires header `X-Debug-Key: <DEBUG_KEY>` to run when NODE_ENV === 'production'.
// When not in production the endpoint is allowed without a key to simplify local testing.
app.get('/api/debug/pg-check', async (req, res) => {
  let client = null;
  try {
    const envKey = String(process.env.DEBUG_KEY || '');
    const headerKey = String(req.headers['x-debug-key'] || '');
    if (process.env.NODE_ENV === 'production') {
      if (!envKey || headerKey !== envKey) return res.status(403).json({ ok: false, error: 'forbidden' });
    }

    const cfg = buildPgConfig();
    if (!cfg) return res.status(503).json({ ok: false, error: 'no pg config available in process env' });

    const { Client } = require('pg');
    client = new Client(cfg);
    await client.connect();
    const r = await client.query('SELECT version() AS v, current_database() AS db');
    await client.end();
    client = null;
    return res.json({ ok: true, rows: r.rows });
  } catch (e) {
    try { if (client) await client.end().catch(()=>{}); } catch(_){}
    console.error('/api/debug/pg-check failed:', e && e.message ? e.message : e);
    return res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) });
  }
});

// Avatar proxy: /api/avatar/proxy?url=<encoded_url>
app.get('/api/avatar/proxy', async (req, res) => {
  try {
    const url = req.query && req.query.url ? String(req.query.url) : null;
    if (!url) return res.status(400).send('url required');
    // Only allow http(s) and block local file access
    if (!/^https?:\/\//i.test(url)) return res.status(400).send('invalid url');
    // Simple whitelist check: allow googleusercontent & gstatic & avatars.googleusercontent
    if (!/googleusercontent\.com|gstatic\.com|lh3\.googleusercontent\.com/i.test(url)) {
      // allow other hosts but rate-limit caution
    }

    const now = Date.now();
    const cached = avatarCache.get(url);
    if (cached && cached.expiresAt > now) {
      res.setHeader('Content-Type', cached.contentType || 'application/octet-stream');
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(AVATAR_CACHE_TTL_MS/1000)}`);
      return res.status(200).send(cached.buffer);
    }

    // fetch remote
    let fetched;
    try {
      fetched = await fetchUrlBytes(url);
    } catch (e) {
      console.warn('avatar proxy fetch failed', e && e.message ? e.message : e);
      return res.status(502).send('bad gateway');
    }

    // store in cache
    try {
      avatarCache.set(url, { buffer: fetched.buffer, contentType: fetched.contentType, expiresAt: Date.now() + AVATAR_CACHE_TTL_MS });
    } catch (e) { /* ignore cache set failures */ }

    res.setHeader('Content-Type', fetched.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(AVATAR_CACHE_TTL_MS/1000)}`);
    return res.status(200).send(fetched.buffer);
  } catch (err) {
    console.error('avatar proxy error', err && err.stack ? err.stack : err);
    return res.status(500).send('internal');
  }
});

// Helper: verify Supabase access token using service role key (server-side)
async function verifySupabaseAccessToken(accessToken){
  if(!accessToken) return null;
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try{
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if(error || !data || !data.user) return null;
    return data.user; // contains id, email, user_metadata, etc.
  }catch(e){
    console.warn('verifySupabaseAccessToken error:', e && e.message ? e.message : e);
    return null;
  }
}

// Helper: extract supabase user from request Authorization header if present
async function getSupabaseUserFromReq(req){
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if(!token) return null;
  return await verifySupabaseAccessToken(token);
}

const DATA_DIR = path.join(__dirname, '..', 'db', 'seeds');
function loadCSV(filename){
  const p = path.join(DATA_DIR, filename);
  if(!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true });
}

// CSV fallback data
const csvData = {
  manufacturers: loadCSV('manufacturers.csv'),
  products: loadCSV('products.csv'),
  vehicles: loadCSV('vehicles.csv'),
  fitments: loadCSV('fitments.csv'),
  equivalences: loadCSV('equivalences.csv'),
  users: loadCSV('users.csv')
};

// Temporary in-memory store for the last user-create error (for debugging only)
let lastUserCreateError = null;

// Attempt Postgres connection if environment variables provided
let pgClient = null;
// Which column stores the user's human name in the users table. Some DBs/schemas use 'name', others 'nome'.
// Which column stores the user's human name in the users table. Some DBs/schemas use 'name', others 'nome'.
let userNameColumn = 'name';
// Which column stores the user's password hash. Common names: password_hash, senha, senha_hash, password
let userPasswordColumn = 'password_hash';
// Whether the users table has an auth_id column to link to external auth providers
let userHasAuthId = false;
// Optional user metadata columns (may not exist in every schema)
let userCreatedAtColumn = null;
let userHasIsPro = false;
let userHasProSince = false;
// Try to build a pg Client config from common env vars. Support DATABASE_URL or individual PG* vars.
function buildPgConfig(){
  if(process.env.DATABASE_URL) {
    const config = { 
      connectionString: process.env.DATABASE_URL,
      // Forçar uso de IPv4 (Render pode não suportar IPv6)
      options: '-c client_encoding=UTF8'
    };
    // Habilitar SSL se configurado (obrigatório para Supabase)
    // Detect common signals: explicit PGSSL env, PGSSLMODE=require, or sslmode=require in the DATABASE_URL
    const wantsSsl = (process.env.PGSSL && String(process.env.PGSSL).toLowerCase() === 'true')
      || (process.env.PGSSLMODE && String(process.env.PGSSLMODE).toLowerCase() === 'require')
      || (/([?&])sslmode=require/i).test(String(process.env.DATABASE_URL || ''));
    if (wantsSsl) {
      // Accept self-signed certificates (common in some Supabase setups).
      // This sets the pg client to use TLS but not reject self-signed certs.
      config.ssl = { rejectUnauthorized: false };
    }
    return config;
  }
  const host = process.env.PGHOST || process.env.PG_HOST;
  const port = process.env.PGPORT || process.env.PG_PORT || 5432;
  const user = process.env.PGUSER || process.env.PG_USER;
  const password = process.env.PGPASSWORD || process.env.PG_PASSWORD;
  const database = process.env.PGDATABASE || process.env.PG_DATABASE;
  if(!host || !user || !password || !database) return null;
  const config = { host, port: Number(port), user, password, database };
  // Habilitar SSL se configurado
  if(process.env.PGSSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

// Debug endpoint to test Postgres connectivity from the running backend
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/pg', async (req, res) => {
    if(!pgClient) return res.json({ ok: false, message: 'pgClient not initialized (using CSV fallback)' });
    try{
      const r = await pgClient.query('SELECT 1 as ok');
      if(r && r.rows && r.rows.length) return res.json({ ok: true, rows: r.rows });
      return res.status(500).json({ ok: false, message: 'unexpected result from SELECT 1', result: r });
    }catch(e){
      console.error('debug pg check failed:', e && e.message ? e.message : e);
      return res.status(500).json({ ok: false, message: e && e.message ? e.message : String(e) });
    }
  });

  // Development-only: expose the in-memory link-account audit for debugging
  app.get('/api/debug/link-account-audit', (req, res) => {
    try {
      return res.json({ ok: true, count: linkAccountAudit.length, entries: linkAccountAudit });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  app.delete('/api/debug/link-account-audit', (req, res) => {
    try {
      linkAccountAudit.length = 0; // clear
      return res.json({ ok: true, cleared: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  // Development-only: force link an account by email -> set auth_id directly (bypasses provider token)
  // Useful to simulate linking in local/dev when you can't reproduce provider tokens.
  app.post('/api/debug/force-link-account', async (req, res) => {
    try {
      const { email, authId } = req.body || {};
      if (!email || !authId) return res.status(400).json({ error: 'email and authId required' });
      const normalizedEmail = String(email).trim().toLowerCase();
      pushLinkAudit({ stage: 'force-received', email: normalizedEmail, authId });

      // If PG available, update directly
      if (pgClient) {
        try {
          const upd = await pgClient.query('UPDATE users SET auth_id = $1, atualizado_em = now() WHERE lower(email) = $2 RETURNING id', [String(authId), normalizedEmail]);
          if (!upd || !upd.rowCount) {
            pushLinkAudit({ stage: 'force-pg-no-match', email: normalizedEmail });
            return res.status(404).json({ error: 'no local user with that email' });
          }
          pushLinkAudit({ stage: 'force-pg-success', email: normalizedEmail, userId: upd.rows[0].id, linkedTo: authId });
          return res.json({ success: true, id: upd.rows[0].id, linkedTo: authId });
        } catch (e) {
          console.error('force-link-account pg update failed:', e && e.message ? e.message : e);
          pushLinkAudit({ stage: 'force-pg-failed', email: normalizedEmail, error: e && e.message ? e.message : String(e) });
          return res.status(500).json({ error: 'pg update failed' });
        }
      }

      // Fallback to Supabase REST PATCH by email (requires SUPABASE_SERVICE_ROLE_KEY)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const base = process.env.SUPABASE_URL.replace(/\/$/, '');
          // Patch by email eq (note: ensure your Supabase users table stores email in lowercase for predictable results)
          const url = `${base}/rest/v1/users?email=eq.${encodeURIComponent(normalizedEmail)}`;
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          pushLinkAudit({ stage: 'force-rest-patch', email: normalizedEmail, authId });
          const resp = await fetch(url, {
            method: 'PATCH',
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
            body: JSON.stringify({ auth_id: authId })
          });
          const text = await resp.text();
          if (!resp.ok) {
            try { const j = JSON.parse(text); pushLinkAudit({ stage: 'force-rest-failed', email: normalizedEmail, status: resp.status, body: j }); } catch(e) { pushLinkAudit({ stage: 'force-rest-failed', email: normalizedEmail, status: resp.status, body: text }); }
            return res.status(500).json({ error: 'rest patch failed', status: resp.status, body: text });
          }
          try { const j = JSON.parse(text); pushLinkAudit({ stage: 'force-rest-success', email: normalizedEmail, updatedRow: j && j[0] ? j[0] : null }); return res.json({ success: true, updatedRow: j && j[0] ? j[0] : null }); } catch(e) { pushLinkAudit({ stage: 'force-rest-success', email: normalizedEmail }); return res.json({ success: true }); }
        } catch (e) {
          console.error('force-link-account REST failed:', e && e.message ? e.message : e);
          pushLinkAudit({ stage: 'force-rest-exception', email: normalizedEmail, error: e && e.message ? e.message : String(e) });
          return res.status(500).json({ error: 'rest exception' });
        }
      }

      return res.status(503).json({ error: 'no database available to perform force link' });
    } catch (err) {
      console.error('force-link-account unexpected error:', err && err.stack ? err.stack : err);
      return res.status(500).json({ error: 'internal error' });
    }
  });

  // Development-only: backfill auth_id for users where provider auth exists with matching email
  // Use: POST /api/debug/backfill-auth-id { dryRun: true } (requires X-Debug-Key or non-production)
  app.post('/api/debug/backfill-auth-id', async (req, res) => {
    try {
      if (!isDebugRequest(req)) return res.status(403).json({ error: 'forbidden' });
      if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'supabase admin not configured' });
      const dryRun = !!(req.body && req.body.dryRun);
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
      // listUsers may be paginated; request a reasonable page size for dev
      const listRes = await (supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.listUsers === 'function' ? supabaseAdmin.auth.admin.listUsers({}) : Promise.resolve({ data: { users: [] } }));
      const users = (listRes && listRes.data && listRes.data.users) ? listRes.data.users : (listRes && listRes.data) ? listRes.data : [];
      const candidates = [];
      for (const su of users) {
        try {
          if (!su || !su.email) continue;
          const email = String(su.email).trim().toLowerCase();
          // find local user by email where auth_id is null or empty
          const r = await pgClient.query('SELECT id, email, auth_id FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
          if (r && r.rowCount > 0) {
            const row = r.rows[0];
            if (!row.auth_id) {
              candidates.push({ localId: row.id, email: row.email, providerId: su.id });
            }
          }
        } catch (e) { /* ignore per-user errors */ }
      }
      if (dryRun) return res.json({ ok: true, dryRun: true, count: candidates.length, candidates });
      const applied = [];
      for (const c of candidates) {
        try {
          const upd = await pgClient.query('UPDATE users SET auth_id = $1, atualizado_em = now() WHERE id = $2', [String(c.providerId), c.localId]);
          if (upd && upd.rowCount > 0) {
            applied.push(c);
            pushLinkAudit({ stage: 'backfill-applied', email: c.email, localId: c.localId, providerId: c.providerId });
          }
        } catch (e) {
          pushLinkAudit({ stage: 'backfill-failed', email: c.email, localId: c.localId, providerId: c.providerId, error: e && e.message ? e.message : String(e) });
        }
      }
      return res.json({ ok: true, dryRun: false, attempted: candidates.length, applied: applied.length, applied });
    } catch (err) {
      console.error('/api/debug/backfill-auth-id failed', err && err.message ? err.message : err);
      return res.status(500).json({ error: 'internal' });
    }
  });
}


// Helper: convert snake_case keys from Postgres to camelCase expected by the frontend
function snakeToCamelKeys(obj){
  if(!obj || typeof obj !== 'object') return obj;
  const out = {};
  for(const k of Object.keys(obj)){
    const v = obj[k];
    const camel = k.replace(/_([a-z])/g, (_, c)=> c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

async function tryConnectPg(){
  const cfg = buildPgConfig();
  if(!cfg) return null;
  try{
    // Use a connection pool for better resilience under load and to avoid
    // frequent connect/disconnect behavior. Return the pool as pgClient so
    // existing code that calls pgClient.query(...) continues to work.
    // Add pool configuration for better stability on free tier services
    const poolConfig = {
      ...cfg,
      max: 5, // reduced from default 10 for free tier limits
      min: 0, // don't maintain idle connections
      idleTimeoutMillis: 30000, // close idle connections after 30s
      connectionTimeoutMillis: 10000, // 10s timeout for new connections
      statement_timeout: 30000, // 30s statement timeout
      query_timeout: 30000, // 30s query timeout
    };
    const pool = new Pool(poolConfig);
    // handle async errors from the pool so they don't crash the Node process
    pool.on('error', err => {
      console.error('Postgres pool emitted error, will attempt reconnect on next query:', err && err.message ? err.message : err);
      // Don't clear pgClient immediately - let queries fail and trigger reconnect
    });
    await pool.query('SELECT 1');
    console.log('Connected to Postgres for backend API (pool)');
    // detect users.name vs users.nome column to avoid schema mismatch
    try {
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
      const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
      if (names.indexOf('name') >= 0) userNameColumn = 'name';
      else if (names.indexOf('nome') >= 0) userNameColumn = 'nome';
      // detect common password/hash column names
      if (names.indexOf('password_hash') >= 0) userPasswordColumn = 'password_hash';
      else if (names.indexOf('senha_hash') >= 0) userPasswordColumn = 'senha_hash';
      else if (names.indexOf('senha') >= 0) userPasswordColumn = 'senha';
      else if (names.indexOf('password') >= 0) userPasswordColumn = 'password';
      else userPasswordColumn = 'password_hash';
  // detect created_at / criado_em
  if (names.indexOf('created_at') >= 0) userCreatedAtColumn = 'created_at';
  else if (names.indexOf('criado_em') >= 0) userCreatedAtColumn = 'criado_em';
  // detect pro flags
  userHasIsPro = names.indexOf('is_pro') >= 0 || names.indexOf('ispro') >= 0;
  userHasProSince = names.indexOf('pro_since') >= 0 || names.indexOf('pro_since') >= 0 || names.indexOf('pro_since') >= 0;
  // detect optional auth_id column used to link to Supabase/Firebase auth ids
  userHasAuthId = names.indexOf('auth_id') >= 0;
  console.log('Detected users name column:', userNameColumn, 'password column:', userPasswordColumn, 'createdAt:', userCreatedAtColumn, 'hasIsPro:', userHasIsPro, 'hasProSince:', userHasProSince);
    } catch (e) {
      console.warn('Could not detect users table columns:', e && e.message ? e.message : e);
    }
  return pool;
  }catch(err){
    console.warn('Postgres connection failed, falling back to CSV:', err && err.message ? err.message : err);
    return null;
  }
}
// Retry wrapper around tryConnectPg with progressive backoff
async function connectWithRetry(retries = 5) {
  // Allow configuring retries/backoff via env to avoid long deploy hangs.
  const envRetries = parseInt(process.env.PG_CONNECT_RETRIES || '', 10);
  const envBackoff = parseInt(process.env.PG_CONNECT_BACKOFF_MS || '', 10);
  const maxRetries = Number.isInteger(envRetries) && envRetries >= 0 ? envRetries : retries;
  const baseBackoff = Number.isInteger(envBackoff) && envBackoff > 0 ? envBackoff : 3000;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const client = await tryConnectPg();
      if (client) return client;
      console.warn(`Postgres connection attempt ${i} failed (no client).`);
    } catch (err) {
      console.error(`Postgres connection attempt ${i} errored:`, err && err.message ? err.message : err);
    }
    if (i < maxRetries) {
      const delay = baseBackoff * i; // configurable backoff
      console.log(`Retrying Postgres connection in ${Math.round(delay/1000)}s... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('Postgres: failed to connect after multiple attempts. Continuing without postgres (CSV fallback active).');
  return null;
}

// Helpers for CSV fallback
function findById(list, id){ return list.find(x => String(x.id) === String(id)); }

// Load legacy parts DB (used to serve /api/pecas/* endpoints to keep frontend unchanged)
let PARTS_DB = [];
try{
  // Try multiple locations for parts_db.json
  const possiblePaths = [
    path.join(__dirname, 'parts_db.json'),           // backend/parts_db.json
    path.join(__dirname, '..', 'data', 'parts_db.json'), // data/parts_db.json
    path.join(__dirname, '..', 'src', 'data', 'parts_db.json'), // src/data/parts_db.json
  ];
  
  let loaded = false;
  for (const partsPath of possiblePaths) {
    if(fs.existsSync(partsPath)){
      PARTS_DB = JSON.parse(fs.readFileSync(partsPath, 'utf8'));
      console.log(`Loaded parts_db.json from: ${partsPath} (${PARTS_DB.length} parts)`);
      loaded = true;
      break;
    }
  }
  
  if (!loaded) {
    console.warn('Could not find parts_db.json in any expected location');
  }
}catch(e){
  console.warn('Could not load parts_db.json:', e.message);
}

function get_unique(field){
  return Array.from(new Set(PARTS_DB.map(p => p[field]).filter(Boolean))).sort();
}

function extract_brands(){
  try{
    const brands = new Set();
    (PARTS_DB||[]).forEach(part => {
      try{
        (part.applications||[]).forEach(app => {
          if(typeof app === 'string'){
            const token = app.split(/\s+/)[0];
            if(token) brands.add(token);
          } else if(typeof app === 'object' && app.vehicle){
            const token = String(app.vehicle||'').split(/\s+/)[0];
            if(token) brands.add(token);
          }
        });
      }catch(e){ /* ignore per-item parse errors */ }
    });
    return Array.from(brands).sort();
  }catch(e){
    console.error('extract_brands error:', e && e.message ? e.message : e);
    return [];
  }
}

function extract_models(){
  try{
    const models = new Set();
    (PARTS_DB||[]).forEach(part => {
      try{
        (part.applications||[]).forEach(app => {
          if(typeof app === 'string'){
            const tokens = app.split(/\s+/);
            if(tokens.length >= 2){
              const last = tokens[tokens.length-1];
              if(/^[0-9]{4}$/.test(last) || /[0-9]{4}-[0-9]{4}/.test(last)){
                models.add(tokens.slice(0, -1).join(' '));
              } else {
                models.add(tokens.join(' '));
              }
            }
          } else if(typeof app === 'object' && app.vehicle){
            models.add(String(app.vehicle));
          }
        });
      }catch(e){ /* ignore per-item parse errors */ }
    });
    return Array.from(models).sort();
  }catch(e){
    console.error('extract_models error:', e && e.message ? e.message : e);
    return [];
  }
}

function extract_years(){
  try{
    const years = new Set();
    (PARTS_DB||[]).forEach(part => {
      try{
        (part.applications||[]).forEach(app => {
          if(typeof app === 'string'){
            // Create a new regex for each string to avoid state issues
            const matches = app.match(/\d{4}/g);
            if(matches){
              matches.forEach(y => years.add(y));
            }
          } else if(typeof app === 'object' && app.years){
            (app.years||[]).forEach(y => years.add(String(y)));
          }
        });
      }catch(e){ /* ignore per-item parse errors */ }
    });
    return Array.from(years).sort();
  }catch(e){
    console.error('extract_years error:', e && e.message ? e.message : e);
    return [];
  }
}

// Compatibility logic copied from original Flask service
function get_part_by_id(part_id){
  return PARTS_DB.find(p => String(p.id) === String(part_id)) || null;
}

function get_compatible_parts(part_id){
  const original_part = get_part_by_id(part_id);
  if(!original_part) return [];
  const original_category = (original_part.category || '').toLowerCase();
  const original_name = (original_part.name || '').toLowerCase();
  const compatible_parts = [];
  PARTS_DB.forEach(part => {
    if(String(part.id) === String(part_id)) return;
    const part_category = (part.category || '').toLowerCase();
    const part_name = (part.name || '').toLowerCase();
    let is_compatible = false;
    if(original_category === 'filtros'){
      if(original_name.includes('óleo') && part_name.includes('óleo')) is_compatible = true;
      else if(original_name.includes('ar') && part_name.includes('ar')) is_compatible = true;
      else if(!original_name.includes('óleo') && !original_name.includes('ar') && !part_name.includes('óleo') && !part_name.includes('ar')) is_compatible = true;
    } else {
      if(part_category === original_category) is_compatible = true;
    }
    if(is_compatible) compatible_parts.push(part);
  });
  return compatible_parts;
}

// --- Legacy endpoints to match original frontend expectations ---
app.get('/api/pecas/todas', (req, res) => res.json({ pecas: PARTS_DB }));

app.get('/api/pecas/categorias', (req, res) => res.json({ categorias: get_unique('category') }));

app.get('/api/pecas/marcas', (req, res) => res.json({ marcas: extract_brands() }));

app.get('/api/pecas/modelos', (req, res) => res.json({ modelos: extract_models() }));

app.get('/api/pecas/anos', (req, res) => res.json({ anos: extract_years() }));

app.get('/api/pecas/fabricantes', (req, res) => res.json({ fabricantes: get_unique('manufacturer') }));

// Aggregated metadata endpoint used by the frontend
app.get('/api/pecas/meta', (req, res) => {
  try{
    console.log('Building /api/pecas/meta response...');
    const grupos = get_unique('category');
    console.log('  grupos:', grupos.length);
    const marcas = extract_brands();
    console.log('  marcas:', marcas.length);
    const modelos = extract_models();
    console.log('  modelos:', modelos.length);
    const anos = extract_years();
    console.log('  anos:', anos.length);
    const fabricantes = get_unique('manufacturer');
    console.log('  fabricantes:', fabricantes.length);
    
    return res.json({
      grupos,
      pecas: PARTS_DB,
      marcas,
      modelos,
      anos,
      fabricantes
    });
  }catch(err){
    console.error('Failed to build /api/pecas/meta:', err && err.message ? err.message : err);
    console.error('Stack:', err.stack);
    return res.status(500).json({ grupos: [], pecas: [], marcas: [], modelos: [], anos: [], fabricantes: [] });
  }
});

app.post('/api/pecas/filtrar', (req, res) => {
  const data = req.body || {};
  const categoria = (data.grupo || '').toLowerCase();
  const peca = (data.categoria || '').toLowerCase();
  const marca = (data.marca || '').toLowerCase();
  const modelo = (data.modelo || '').toLowerCase();
  const ano = (data.ano || '').toLowerCase();
  const fabricante = (data.fabricante || '').toLowerCase();
  
  // Se nenhum filtro foi fornecido, retorna todas as peças
  const hasFilters = [categoria, peca, marca, modelo, ano, fabricante].some(v=>v && v.length);
  
  if(!hasFilters) {
    try {
      const partsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'parts_db.json'), 'utf8'));
      return res.json({ results: partsData, total: partsData.length, mensagem: `${partsData.length} peças encontradas`});
    } catch (err) {
      console.error('Error loading parts_db.json:', err);
      return res.json({ results: [], total: 0, mensagem: 'Erro ao carregar dados'});
    }
  }

  function matches(part){
    if(categoria && (part.category||'').toLowerCase() !== categoria) return false;
    if(peca && (part.name||'').toLowerCase() !== peca) return false;
    if(fabricante && (part.manufacturer||'').toLowerCase() !== fabricante) return false;
    if(marca || modelo || ano){
      const apps = part.applications || [];
      let found = false;
      for(const app of apps){
        const appStr = String(app).toLowerCase();
        if(marca && !appStr.includes(marca)) continue;
        if(modelo && !appStr.includes(modelo)) continue;
        if(ano){
          // extract years similar to Python logic
          let anos = [];
          if(typeof app === 'string'){
            const re = /\d{4}(?:-\d{4})?/g;
            const matches = app.match(re) || [];
            matches.forEach(str => {
              if(str.includes('-')){
                const [start, end] = str.split('-').map(Number);
                for(let y=start; y<=end; y++) anos.push(String(y));
              } else anos.push(str);
            });
          } else if(typeof app === 'object' && app.years){
            (app.years||[]).forEach(str => {
              if(typeof str === 'string' && str.includes('-')){
                const [start,end] = str.split('-').map(Number);
                for(let y=start;y<=end;y++) anos.push(String(y));
              } else anos.push(String(str));
            });
          }
          if(ano && anos.indexOf(ano) === -1) continue;
        }
        found = true; break;
      }
      if(!found) return false;
    }
    return true;
  }

  const filtered = PARTS_DB.filter(matches);
  return res.json({ pecas: filtered, total: filtered.length });
});

app.get('/api/pecas/compatibilidade/:part_id', (req, res) => {
  const part_id = req.params.part_id;
  const compatibles = get_compatible_parts(part_id);
  return res.json({ compatibilidade: compatibles, total: compatibles.length });
});

app.get('/api/pecas/:id', (req, res) => {
  const id = req.params.id;
  
  // Tentar carregar dados detalhados do JSON
  try {
    const detailsPath = path.join(__dirname, 'parts_detailed.json');
    if (fs.existsSync(detailsPath)) {
      const detailedParts = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
      const detailedPart = detailedParts.find(p => p.id === id);
      
      if (detailedPart) {
        return res.json(detailedPart);
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados detalhados:', error);
  }
  
  // Fallback para dados básicos se não encontrar no detailed
  const basicPart = PARTS_DB.find(p => p.id === id);
  if (basicPart) {
    // Converter dados básicos para formato detalhado
    const detailedFromBasic = {
      id: basicPart.id,
      nome: basicPart.name,
      categoria: basicPart.category,
      fabricante: basicPart.manufacturer,
      numero_peca: basicPart.part_number,
      descricao: basicPart.description,
      especificacoes_tecnicas: basicPart.specifications || {},
      aplicacoes_detalhadas: (basicPart.applications || []).map(app => ({
        marca: "N/A",
        modelo: "N/A", 
        ano_inicio: null,
        ano_fim: null,
        motor: "N/A",
        observacoes: app
      })),
  imagens: ["/imagens/placeholder-part.jpg"],
      instalacao: {
        dificuldade: "Médio",
        tempo_estimado_min: 30,
        ferramentas_necessarias: ["Ferramentas básicas"],
        precaucoes: ["Seguir manual do veículo", "Consultar oficina parceira se necessário"]
      },
      recall_relacionado: false,
      documentos: [],
      pecas_relacionadas: [],
      avaliacoes: [],
      perguntas_frequentes: [
        {
          pergunta: "Onde posso comprar esta peça?",
          resposta: "Consulte nossas oficinas parceiras para preços e disponibilidade."
        }
      ]
    };
    
    return res.json(detailedFromBasic);
  }
  
  return res.status(404).json({ erro: 'Peça não encontrada' });
});

// Generic endpoints (will use Postgres if available, else CSV)
app.get('/api/products', async (req, res) => {
  if(pgClient){
    try{
      const r = await pgClient.query('SELECT p.*, m.name as manufacturer_name, m.code as manufacturer_code FROM products p LEFT JOIN manufacturers m ON p.manufacturer_id = m.id');
      return res.json(r.rows);
    }catch(err){
      console.error('PG query failed /api/products:', err.message);
      // fallthrough to CSV fallback
    }
  }
  const list = csvData.products.map(p => ({ ...p, manufacturer: findById(csvData.manufacturers, p.manufacturer_id) }));
  res.json(list);
});

app.get('/api/vehicles', async (req, res) => {
  if(pgClient){
    try{ const r = await pgClient.query('SELECT * FROM vehicles'); return res.json(r.rows); }catch(err){ console.error('PG query failed /api/vehicles:', err.message); }
  }
  res.json(csvData.vehicles);
});
// Luzes do Painel - Glossário Automotivo
app.get('/api/luzes-painel', (req, res) => {
  try {
    const luzesPath = path.join(__dirname, 'luzes_painel.json');
    if (!fs.existsSync(luzesPath)) {
      return res.status(404).json({ error: 'Arquivo de luzes do painel não encontrado' });
    }
    const luzes = JSON.parse(fs.readFileSync(luzesPath, 'utf8'));
    
    // Aplicar filtros se fornecidos na query
    let filteredLuzes = luzes;
    
    // Filtrar por categoria
    if (req.query.categoria) {
      filteredLuzes = filteredLuzes.filter(luz => luz.categoria === req.query.categoria);
    }
    
    // Filtrar por prioridade
    if (req.query.prioridade) {
      filteredLuzes = filteredLuzes.filter(luz => luz.prioridade === req.query.prioridade);
    }
    
    // Filtrar por cor
    if (req.query.cor) {
      filteredLuzes = filteredLuzes.filter(luz => luz.cor === req.query.cor);
    }
    
    // Busca por texto
    if (req.query.busca) {
      const busca = req.query.busca.toLowerCase();
      filteredLuzes = filteredLuzes.filter(luz => 
        luz.nome.toLowerCase().includes(busca) ||
        luz.descricao.toLowerCase().includes(busca) ||
        luz.causas_comuns.some(causa => causa.toLowerCase().includes(busca))
      );
    }
    
    res.json({ 
      luzes: filteredLuzes,
      total: filteredLuzes.length,
      filtros_aplicados: {
        categoria: req.query.categoria,
        prioridade: req.query.prioridade,
        cor: req.query.cor,
        busca: req.query.busca
      }
    });
  } catch (error) {
    console.error('Erro ao carregar luzes do painel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/fitments', async (req, res) => { if(pgClient){ try{ const r = await pgClient.query('SELECT * FROM fitments'); return res.json(r.rows);}catch(err){ console.error('PG query failed /api/fitments:', err.message);} } res.json(csvData.fitments); });
app.get('/api/equivalences', async (req, res) => { if(pgClient){ try{ const r = await pgClient.query('SELECT * FROM equivalences'); return res.json(r.rows);}catch(err){ console.error('PG query failed /api/equivalences:', err.message);} } res.json(csvData.equivalences); });
app.get('/api/users', async (req, res) => { if(pgClient){ try{ /* support DBs that use 'nome' or 'name' for the user's display name */ const r = await pgClient.query("SELECT id, email, COALESCE(nome, name) AS name, is_pro, pro_since, created_at FROM users"); return res.json(r.rows);}catch(err){ console.error('PG query failed /api/users:', err.message);} } res.json(csvData.users); });

// Temporary debug endpoint: report users table columns and runtime detection
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/users-columns', async (req, res) => {
    try {
      if (!pgClient) return res.json({ ok: false, reason: 'no pgClient' });
      const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public' ORDER BY ordinal_position");
      const names = (cols.rows || []).map(r => String(r.column_name));
      return res.json({ ok: true, detectedUserNameColumn: userNameColumn, runtimePid: process.pid, time: new Date().toISOString(), columns: names });
    } catch (e) {
      console.error('debug/users-columns failed:', e && e.message ? e.message : e);
      return res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });
}

app.get('/api/product/:id', async (req, res) => {
  if(pgClient){
    try{
      const r = await pgClient.query('SELECT p.*, m.name as manufacturer_name FROM products p LEFT JOIN manufacturers m ON p.manufacturer_id = m.id WHERE p.id = $1', [req.params.id]);
      if(r.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json(r.rows[0]);
    }catch(err){ console.error('PG query failed /api/product/:id', err.message); }
  }
  const p = findById(csvData.products, req.params.id);
  if(!p) return res.status(404).json({ error: 'Product not found' });
  res.json({ ...p, manufacturer: findById(csvData.manufacturers, p.manufacturer_id) });
});

app.get('/api/product/sku/:sku', async (req, res) => {
  const sku = req.params.sku;
  if(pgClient){
    try{
      const r = await pgClient.query('SELECT p.*, m.name as manufacturer_name FROM products p LEFT JOIN manufacturers m ON p.manufacturer_id = m.id WHERE lower(p.sku) = lower($1)', [sku]);
      if(r.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json(r.rows[0]);
    }catch(err){ console.error('PG query failed /api/product/sku/:sku', err.message); }
  }
  const p = csvData.products.find(x => String(x.sku).toLowerCase() === String(sku).toLowerCase());
  if(!p) return res.status(404).json({ error: 'Product not found' });
  res.json({ ...p, manufacturer: findById(csvData.manufacturers, p.manufacturer_id) });
});

app.get('/api/compatibility/sku/:sku', async (req, res) => {
  const sku = req.params.sku;
  if(pgClient){
    try{
      const r = await pgClient.query(`SELECT p.* FROM products p WHERE lower(p.sku) = lower($1)`, [sku]);
      if(r.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
      const product = r.rows[0];
      const fit = await pgClient.query('SELECT f.*, v.* FROM fitments f JOIN vehicles v ON f.vehicle_id = v.id WHERE f.product_id = $1', [product.id]);
      const eq = await pgClient.query('SELECT e.*, p2.* FROM equivalences e JOIN products p2 ON e.equivalent_product_id = p2.id WHERE e.product_id = $1', [product.id]);
      return res.json({ product, fitments: fit.rows, equivalences: eq.rows });
    }catch(err){ console.error('PG query failed /api/compatibility/sku/:sku', err.message); }
  }

  const product = csvData.products.find(x => String(x.sku).toLowerCase() === String(sku).toLowerCase());
  if(!product) return res.status(404).json({ error: 'Product not found' });
  const productFitments = csvData.fitments.filter(f => String(f.product_id) === String(product.id)).map(f => ({ ...f, vehicle: findById(csvData.vehicles, f.vehicle_id) }));
  const eqs = csvData.equivalences.filter(e => String(e.product_id) === String(product.id) || String(e.equivalent_product_id) === String(product.id)).map(e => ({ ...e, product: findById(csvData.products, e.product_id), equivalent: findById(csvData.products, e.equivalent_product_id) }));
  res.json({ product, fitments: productFitments, equivalences: eqs });
});

// Firebase verification endpoint removed.
// The project no longer uses Firebase for client auth verification. Use
// /api/auth/supabase-verify for Supabase-authenticated users instead.

// Optional Firebase ID token verification endpoint.
// If you want to accept Firebase ID tokens from the frontend (e.g. when using
// Firebase client SDK for Google popup sign-in), set FIREBASE_SERVICE_ACCOUNT_JSON
// (the JSON content of a service account) or the path in FIREBASE_SERVICE_ACCOUNT_PATH
// in the backend environment. When configured, this endpoint will verify the
// Firebase ID token and upsert the user similar to supabase-verify.
let firebaseAdmin = null;
let firebaseAdminInitialized = false;
function tryInitFirebaseAdmin() {
  if (firebaseAdminInitialized) return;
  firebaseAdminInitialized = true;
  try {
    const admin = require('firebase-admin');
    let serviceAccount = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (e) {
        console.warn('FIREBASE_SERVICE_ACCOUNT_JSON invalid JSON');
      }
    }
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      } catch (e) {
        console.warn('Could not load FIREBASE_SERVICE_ACCOUNT_PATH', process.env.FIREBASE_SERVICE_ACCOUNT_PATH, e && e.message ? e.message : e);
      }
    }
    if (!serviceAccount) {
      // Do not throw here - we'll just mark admin as unavailable
      console.info('Firebase Admin not configured (no service account provided)');
      firebaseAdmin = null;
      return;
    }
    try {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      firebaseAdmin = admin;
      console.log('Firebase Admin initialized for token verification');
    } catch (e) {
      console.warn('Failed to initialize Firebase Admin:', e && e.message ? e.message : e);
      firebaseAdmin = null;
    }
  } catch (e) {
    console.info('firebase-admin package not installed or failed to load');
    firebaseAdmin = null;
  }
}

app.post('/api/auth/firebase-verify', async (req, res) => {
  // Continue with normal Firebase verification process

  // DEV bypass: when developing locally you can set DEV_FIREBASE_BYPASS=true
  // and the server will accept the request and return a lightweight fake user
  // (DO NOT enable in production). This makes it faster to iterate the
  // frontend login flow without wiring a Firebase service account.
  try {
    if (String(process.env.DEV_FIREBASE_BYPASS || '').toLowerCase() === 'true') {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.body && (req.body.idToken || req.body.access_token));
      const uid = (req.body && req.body.uid) || (idToken ? `dev_${String(idToken).slice(0,8)}` : `dev_${Date.now()}`);
      const email = (req.body && req.body.email) || `devuser+${Date.now()}@localhost`;
      return res.json({ success: true, user: { id: uid, email, name: email.split('@')[0], nome: email.split('@')[0], photoURL: null } });
    }
  } catch (e) { /* ignore dev bypass errors */ }

  // Initialize firebase-admin lazily if possible
  tryInitFirebaseAdmin();
  if (!firebaseAdmin) return res.status(503).json({ error: 'Firebase Admin not configured on server' });

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.body && (req.body.idToken || req.body.access_token));
  if (!idToken) return res.status(400).json({ error: 'idToken required (use Authorization: Bearer <idToken> or body.idToken)' });

  try {
    console.log('🔍 FIREBASE-VERIFY: Starting verification process...');
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    console.log('🔍 FIREBASE-VERIFY: Token decoded:', { uid: decoded?.uid, email: decoded?.email });
    
    if (!decoded || !decoded.uid) return res.status(401).json({ error: 'invalid token' });
    const uid = decoded.uid;
    const email = decoded.email || null;
    let photoURL = decoded.picture || null;
    let name = decoded.name || decoded.displayName || null;
    
    console.log('🔍 FIREBASE-VERIFY: User data extracted:', { uid, email, name });

    // Try fetching user record from Firebase Admin for richer profile
    try {
      const userRecord = await firebaseAdmin.auth().getUser(uid);
      if (!name) name = userRecord.displayName || null;
      photoURL = photoURL || userRecord.photoURL || null;
    } catch (e) {
      // ignore failures to fetch user record
      console.warn('firebase-verify: getUser failed', e && e.message ? e.message : e);
    }

    // Upsert into Postgres if available (reuse logic from supabase-verify)
    if (pgClient) {
      try {
        let nameCol = userNameColumn || 'name';
        try {
          const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
          const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
          if (names.indexOf('nome') >= 0) nameCol = 'nome';
          else if (names.indexOf('name') >= 0) nameCol = 'name';
        } catch (e) {}

        // If Supabase admin credentials are available, try to find a Supabase user by email
        // and prefer that user's id for the Postgres upsert so future Firebase logins map to the same user.
        let dbIdToUse = uid;
        try {
          if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { createClient } = require('@supabase/supabase-js');
            const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
            try {
              if (supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.getUserByEmail === 'function') {
                const sbRes = await supabaseAdmin.auth.admin.getUserByEmail(email);
                if (sbRes && sbRes.data && sbRes.data.user) {
                  // Found Supabase user: prefer its id
                  dbIdToUse = sbRes.data.user.id;
                }
              } else if (supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.listUsers === 'function') {
                const listRes = await supabaseAdmin.auth.admin.listUsers();
                const users = (listRes && listRes.data && listRes.data.users) ? listRes.data.users : (listRes && listRes.data) ? listRes.data : [];
                const found = users.find(u => u.email && String(u.email).toLowerCase() === String(email).toLowerCase());
                if (found) dbIdToUse = found.id;
              }
            } catch (e) {
              console.warn('firebase-verify: supabase admin lookup failed', e && e.message ? e.message : e);
            }
          }
        } catch (e) { /* ignore supabase client errors */ }

        // Check if user already exists by email
        let existingUserId = null;
        try {
          const emailCheck = await pgClient.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
          if (emailCheck.rowCount > 0) {
            existingUserId = emailCheck.rows[0].id;
          }
        } catch (e) {
          // ignore error
        }
        
        // Use existing ID if found, otherwise use Firebase UID
        dbIdToUse = existingUserId || uid;

        const insertSql = `INSERT INTO users(id, email, ${nameCol}, photo_url, auth_id, criado_em, atualizado_em)
          VALUES($1, $2, $3, $4, $5, now(), now())
          ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ${nameCol} = EXCLUDED.${nameCol}, photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url), auth_id = EXCLUDED.auth_id, atualizado_em = now()`;
        try {
          await pgClient.query(insertSql, [dbIdToUse, email, name, photoURL, uid]);
        } catch (e) {
          console.warn('firebase-verify: Upsert query failed', e && e.message ? e.message : e);
        }

        const r = await pgClient.query(`SELECT id, email, nome, photo_url, is_pro, criado_em, celular FROM users WHERE (id = $1 OR auth_id = $1)`, [dbIdToUse]);
        console.log('🔍 FIREBASE-VERIFY: Final query result:', {
          query: `SELECT id, email, nome, photo_url, is_pro, criado_em, celular FROM users WHERE id = $1`,
          params: [dbIdToUse],
          rowCount: r.rowCount,
          rows: r.rows
        });
        
        if (r.rowCount > 0) {
          const row = r.rows[0];
          const displayName = ((row.nome || '') + '').trim();
          const phoneValue = row.celular || null;
          
          console.log('🔍 FIREBASE-VERIFY: Processing user data:', {
            rawRow: row,
            phoneValue: phoneValue,
            phoneType: typeof phoneValue
          });
          
          const responseData = { 
            success: true, 
            user: { 
              id: row.id, 
              email: row.email, 
              name: displayName, 
              nome: displayName, 
              photoURL: row.photo_url || null, 
              is_pro: row.is_pro, 
              created_at: row.criado_em || null,
              celular: phoneValue,
              telefone: phoneValue,
              phone: phoneValue
            } 
          };
          
          console.log('🔍 FIREBASE-VERIFY: Sending response:', JSON.stringify(responseData, null, 2));
          return res.json(responseData);
        }
      } catch (e) {
        console.warn('firebase-verify: DB upsert failed, continuing with token user:', e && e.message ? e.message : e);
      }
    }

    return res.json({ success: true, user: { id: uid, email, name: name || (email ? email.split('@')[0] : ''), nome: name || (email ? email.split('@')[0] : ''), photoURL: photoURL || null } });
  } catch (err) {
    console.error('firebase-verify error:', err && err.stack ? err.stack : err);
    return res.status(401).json({ error: 'invalid token' });
  }
});

// Merge Google (Firebase) sign-in with existing Supabase user by email.
// Accepts idToken via Authorization: Bearer <idToken> or { idToken } in body.
app.post('/api/auth/merge-google', async (req, res) => {
  tryInitFirebaseAdmin();
  if (!firebaseAdmin) return res.status(503).json({ error: 'Firebase Admin not configured on server' });

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.body && req.body.idToken);
  if (!idToken) return res.status(400).json({ error: 'idToken required (use Authorization: Bearer <idToken> or body.idToken)' });

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    if (!decoded || !decoded.uid) return res.status(401).json({ error: 'invalid token' });
    const uid = decoded.uid;
    const email = decoded.email || null;
    const name = decoded.name || decoded.displayName || (email ? email.split('@')[0] : null);
    const photoURL = decoded.picture || null;

    // Create Supabase admin client to lookup and update users
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // No Supabase admin credentials: return the firebase user info
      return res.json({ success: true, user: { id: uid, email, name, nome: name, photoURL } });
    }
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Try to find a Supabase auth user by email. Use admin.getUserByEmail if available, otherwise list users and filter.
    let sbUser = null;
    try {
      if (supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.getUserByEmail === 'function') {
        try {
          const r = await supabaseAdmin.auth.admin.getUserByEmail(email);
          if (r && r.data && r.data.user) sbUser = r.data.user;
        } catch (e) {
          // continue to listUsers fallback
          console.warn('getUserByEmail failed, falling back to listUsers', e && e.message ? e.message : e);
        }
      }
      if (!sbUser && supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.listUsers === 'function') {
        // listUsers may be paginated; request a reasonable page and then filter client-side
        const listRes = await supabaseAdmin.auth.admin.listUsers();
        const users = (listRes && listRes.data && listRes.data.users) ? listRes.data.users : (listRes && listRes.data) ? listRes.data : [];
        sbUser = users.find(u => u.email && String(u.email).toLowerCase() === String(email).toLowerCase());
      }
    } catch (e) {
      console.warn('Supabase admin lookup failed', e && e.message ? e.message : e);
    }

  if (sbUser) {
      // Attach firebase uid into user_metadata for traceability
      try {
        const meta = sbUser.user_metadata || {};
        if (meta.firebase_uid !== uid) {
          try {
            await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { user_metadata: { ...meta, firebase_uid: uid } });
          } catch (e) {
            console.warn('Failed to update Supabase user metadata', e && e.message ? e.message : e);
          }
        }
      } catch (e) { /* ignore metadata write failures */ }

      // If the Google profile has a photo, prefer it: update Postgres users.photo_url for the canonical user
      try {
        if (photoURL && pgClient) {
          // Try updating by Supabase user id first (common case), then fallback to email match
          let updRes = null;
          try {
            updRes = await pgClient.query('UPDATE users SET photo_url = $1, atualizado_em = now() WHERE id = $2 RETURNING id', [photoURL, sbUser.id]);
          } catch (e) {
            console.warn('merge-google: failed to update users.photo_url by id, will try by email', e && e.message ? e.message : e);
          }
          if ((!updRes || updRes.rowCount === 0) && email) {
            try {
              updRes = await pgClient.query('UPDATE users SET photo_url = $1, atualizado_em = now() WHERE lower(email) = lower($2) RETURNING id', [photoURL, email]);
            } catch (e) {
              console.warn('merge-google: failed to update users.photo_url by email', e && e.message ? e.message : e);
            }
          }
          if (updRes && updRes.rowCount > 0) {
            console.log(`merge-google: updated photo_url for user (${updRes.rows[0].id || sbUser.id}) to ${photoURL}`);
          }
        }
      } catch (e) {
        console.warn('merge-google: unexpected error while forcing photo_url update', e && e.message ? e.message : e);
      }

      // If Postgres is available, try to return the canonical user row from users table
      if (pgClient) {
        try {
          // Prefer matching by auth_id when available
          if (userHasAuthId) {
            try {
              // detect optional phone column
              let phoneCol = null;
              try {
                const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
                const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
                const phoneCandidates = ['celular','telefone','phone'];
                phoneCol = phoneCandidates.find(c => names.indexOf(c) >= 0) || null;
              } catch (e) { phoneCol = null; }

              const selectCols = [`id`, `email`, `${userNameColumn} as name`, `photo_url`, `is_pro`];
              if (phoneCol) selectCols.push(phoneCol);
              const rAuth = await pgClient.query(`SELECT ${selectCols.join(', ')} FROM users WHERE auth_id = $1 LIMIT 1`, [sbUser.id]);
              if (rAuth && rAuth.rowCount > 0) {
                const row = rAuth.rows[0];
                const displayName = ((row.name || '') + '').trim();
                // Prefer Google-provided photoURL (decoded.picture) when present
                const userOut = { id: row.id, email: row.email, name: displayName, nome: displayName, photoURL: photoURL || row.photo_url || null, is_pro: row.is_pro };
                if (phoneCol && row[phoneCol]) userOut.celular = row[phoneCol];
                return res.json({ success: true, user: userOut });
              }
            } catch (e) { /* ignore */ }
          }
          // Fallback: try to find by email and then update auth_id if present
          // include optional phone column in fallback select
          try {
            const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
            const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
            const phoneCandidates = ['celular','telefone','phone'];
            const phoneCol = phoneCandidates.find(c => names.indexOf(c) >= 0) || null;
            const selectCols = [`id`, `email`, `${userNameColumn} as name`, `photo_url`, `is_pro`];
            if (phoneCol) selectCols.push(phoneCol);
            var r = await pgClient.query(`SELECT ${selectCols.join(', ')} FROM users WHERE lower(email) = lower($1) LIMIT 1`, [email]);
          } catch (e) {
            var r = await pgClient.query(`SELECT id, email, ${userNameColumn} as name, photo_url, is_pro FROM users WHERE lower(email) = lower($1) LIMIT 1`, [email]);
          }
          if (r && r.rowCount > 0) {
            const row = r.rows[0];
            const displayName = ((row.name || '') + '').trim();
            // try to persist auth_id for future convenience
            if (userHasAuthId) {
              try {
                await pgClient.query('UPDATE users SET auth_id = $1, atualizado_em = now() WHERE id = $2', [sbUser.id, row.id]);
                console.log(`merge-google: backfilled auth_id for user row ${row.id} -> ${sbUser.id}`);
              } catch (e) { console.warn('merge-google: failed to backfill auth_id', e && e.message ? e.message : e); }
            }
            // Prefer Google avatar when available
            const userOut = { id: row.id, email: row.email, name: displayName, nome: displayName, photoURL: photoURL || row.photo_url || null, is_pro: row.is_pro };
            // copy phone into standardized field name if present in row
            try { if (row.celular) userOut.celular = row.celular; else { const keys = Object.keys(row); const phoneKey = keys.find(k => /celular|telefone|phone/i.test(k)); if (phoneKey && row[phoneKey]) userOut.celular = row[phoneKey]; } } catch(e){}
            return res.json({ success: true, user: userOut });
          }
        } catch (e) {
          console.warn('merge-google: Postgres lookup failed', e && e.message ? e.message : e);
        }
      }

  // Fallback: return Supabase auth user shape — prefer Google photo when available
  const displayName = (sbUser.user_metadata && sbUser.user_metadata.name) ? sbUser.user_metadata.name : (sbUser.email ? sbUser.email.split('@')[0] : '');
  return res.json({ success: true, user: { id: sbUser.id, email: sbUser.email, name: displayName, nome: displayName, photoURL: photoURL || (sbUser.user_metadata && sbUser.user_metadata.avatar_url) || (sbUser.raw_user_meta_data && sbUser.raw_user_meta_data.avatar_url) || null } });
    }

    // No Supabase user found - fallback to upsert Firebase user into Postgres (similar to firebase-verify)
    if (pgClient) {
      try {
        const insertSql = `INSERT INTO users(id, email, ${userNameColumn}, photo_url, criado_em, atualizado_em)
          VALUES($1, $2, $3, $4, now(), now())
          ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ${userNameColumn} = EXCLUDED.${userNameColumn}, photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url), atualizado_em = now()`;
        await pgClient.query(insertSql, [uid, email, name, photoURL]);
        const r = await pgClient.query(`SELECT id, email, ${userNameColumn} as name, photo_url FROM users WHERE id = $1`, [uid]);
        if (r && r.rowCount > 0) {
          const row = r.rows[0];
          const displayName = ((row.name || '') + '').trim();
          return res.json({ success: true, user: { id: row.id, email: row.email, name: displayName, nome: displayName, photoURL: row.photo_url || null } });
        }
      } catch (e) {
        console.warn('merge-google: Postgres upsert failed', e && e.message ? e.message : e);
      }
    }

    // Final fallback: return firebase info
    return res.json({ success: true, user: { id: uid, email, name, nome: name, photoURL } });
  } catch (err) {
    console.error('merge-google error:', err && err.stack ? err.stack : err);
    // If the failure was caused by an invalid/decoding Firebase ID token,
    // return 401 so the client can detect an authentication/token issue
    // (this avoids surfacing a generic 500 which was confusing in the UI).
    try {
      const msg = err && err.message ? String(err.message) : '';
      if (/decoding firebase id token failed/i.test(msg) || /invalid id token/i.test(msg)) {
        return res.status(401).json({ error: 'invalid idToken' });
      }
    } catch (e) { /* ignore and return generic error below */ }
    return res.status(500).json({ error: 'merge failed' });
  }
});

// Verify Supabase access token (recommended flow when frontend uses Supabase Auth)
app.post('/api/auth/supabase-verify', async (req, res) => {
  // Accept token via Authorization header (Bearer) or body.access_token
  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.body && req.body.access_token);
  if (!accessToken) return res.status(400).json({ error: 'access_token required (use Authorization: Bearer <token> or body.access_token)' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Supabase server-side credentials not configured' });
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Verify token and get user (from token) then fetch full user via admin API for richer metadata
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data || !data.user) {
      console.warn('supabase verify: token invalid or no user', error && error.message ? error.message : error);
      return res.status(401).json({ error: 'invalid token', details: error ? error.message : 'no user' });
    }

    const sbUserFromToken = data.user;
    const uid = sbUserFromToken.id;
    const email = sbUserFromToken.email || null;

    // Try to get full user record using admin API (requires service role key)
    let fullUser = null;
    try {
      const adminRes = await supabaseAdmin.auth.admin.getUserById(uid);
      if (adminRes && adminRes.data && adminRes.data.user) fullUser = adminRes.data.user;
    } catch (e) {
      // If admin API fails, fall back to token user (still valid for basic info)
      console.warn('supabase verify: admin.getUserById failed, falling back to token user', e && e.message ? e.message : e);
      fullUser = sbUserFromToken;
    }

    // DEBUG: safe summary of fields received from Supabase admin API
    try {
      const safeSummary = {
        uid: uid,
        email: email,
        hasUserMetadata: !!(fullUser && fullUser.user_metadata),
        userMetadataKeys: fullUser && fullUser.user_metadata ? Object.keys(fullUser.user_metadata) : [],
        hasRawMeta: !!(fullUser && fullUser.raw_user_meta_data),
        rawMetaKeys: fullUser && fullUser.raw_user_meta_data ? Object.keys(fullUser.raw_user_meta_data) : [],
        identitiesCount: Array.isArray(fullUser && fullUser.identities) ? fullUser.identities.length : 0,
        // For identities, list which likely picture/name keys exist in the first identity (if any)
        identityCandidateKeys: (function(){
          try{
            const origin = req.headers.origin || req.headers.referer || '-';
            console.log(`[merge-google] request origin=${origin} authHeaderPresent=${!!req.headers.authorization} bodyKeys=${Object.keys(req.body||{}).join(',')}`);
            const ids = fullUser && fullUser.identities ? fullUser.identities : (sbUserFromToken && sbUserFromToken.identities ? sbUserFromToken.identities : []);
            if(!Array.isArray(ids) || ids.length === 0) return [];
            const id0 = ids[0] && (ids[0].identity_data || ids[0]) || {};
            const candidateKeys = [];
            ['avatar_url','picture','picture_url','profile_image_url','pictureUrl','name','full_name','login','given_name','family_name'].forEach(k => { if(Object.prototype.hasOwnProperty.call(id0,k)) candidateKeys.push(k); });
            return candidateKeys;
          }catch(e){ return []; }
        })()
      };
      console.info('supabase-verify debug summary:', JSON.stringify(safeSummary));
    } catch (e) {
      console.warn('supabase-verify debug failed to build summary', e && e.message ? e.message : e);
    }

    const meta = (fullUser && fullUser.user_metadata) ? fullUser.user_metadata : (sbUserFromToken.user_metadata || {});

    // Try identities (OAuth providers) for display name and avatar. Providers may store
    // fields under several possible keys (name, full_name, login, avatar_url, picture, picture_url,
    // profile_image_url or nested under user_info). Check multiple candidates to maximize coverage
    // for Google and other providers.
    let providerName = null;
    let providerAvatar = null;
    try {
      const ids = fullUser && fullUser.identities ? fullUser.identities : (sbUserFromToken.identities || []);
      if (Array.isArray(ids)) {
        for (const id of ids) {
          const idData = (id && (id.identity_data || id)) || {};
          // name candidates
          providerName = providerName || idData.name || idData.full_name || idData.login || (idData.user_info && (idData.user_info.name || idData.user_info.full_name));
          // avatar/picture candidates
          providerAvatar = providerAvatar || idData.avatar_url || idData.picture || idData.picture_url || idData.profile_image_url || (idData.user_info && (idData.user_info.picture || idData.user_info.avatar_url));
        }
      }
    } catch (e) {
      // ignore
    }


    // Also consult user_metadata and raw_user_meta_data for possible picture/name fields
    try {
      if (!providerName) {
        providerName = meta.name || meta.nome || meta.full_name || meta.given_name || meta.family_name || (fullUser && fullUser.raw_user_meta_data && (fullUser.raw_user_meta_data.name || fullUser.raw_user_meta_data.full_name));
      }
      if (!providerAvatar) {
        // Prioritize raw_user_meta_data which often contains the provider's picture
        if (fullUser && fullUser.raw_user_meta_data) {
          providerAvatar = fullUser.raw_user_meta_data.picture || fullUser.raw_user_meta_data.avatar_url || providerAvatar;
        }
        providerAvatar = providerAvatar || meta.avatar_url || meta.picture || (sbUserFromToken && (sbUserFromToken.avatar_url || sbUserFromToken.picture));
      }
    } catch (e) {
      // ignore
    }

  // Determine display name and avatar using metadata, provider data or email fallback
  const nome = (providerName || meta.name || meta.nome || meta.full_name || '').trim() || (email ? email.split('@')[0].replace(/[._-]+/g,' ').split(' ').map(s=>s? (s.charAt(0).toUpperCase()+s.slice(1)):'').join(' ') : '');
  let photoURL = (providerAvatar || meta.avatar_url || meta.picture || null);

    // Log when we found a provider avatar to help debug missing photos
    try {
      if (photoURL) console.info('supabase-verify: resolved photoURL for user', uid, photoURL);
      else console.info('supabase-verify: no photoURL resolved for user', uid);
    } catch(e){ }

    // If no photoURL resolved yet, attempt one extra fetch from Supabase admin user record (auth.users)
    // This uses the service role key and is only attempted when available. It can find `raw_user_meta_data.picture` or `avatar_url`.
    try {
      if (!photoURL && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          // Reuse supabaseAdmin if available (created above)
          if (supabaseAdmin && typeof supabaseAdmin.auth !== 'undefined' && typeof supabaseAdmin.auth.admin !== 'undefined' && typeof supabaseAdmin.auth.admin.getUserById === 'function'){
            const adminRes2 = await supabaseAdmin.auth.admin.getUserById(uid);
            if (adminRes2 && adminRes2.data && adminRes2.data.user) {
              const au = adminRes2.data.user;
              if (au && au.raw_user_meta_data) {
                photoURL = photoURL || au.raw_user_meta_data.picture || au.raw_user_meta_data.avatar_url || null;
              }
              // also vendor avatar at top-level fields
              photoURL = photoURL || (au && (au.avatar_url || au.picture)) || photoURL;
              if (photoURL) console.info('supabase-verify: resolved photoURL from admin.getUserById fallback', uid, photoURL);
            }
          }
        } catch (e) {
          console.warn('supabase-verify: admin.getUserById fallback failed', e && e.message ? e.message : e);
        }
      }
    } catch(e) {
      // ignore
    }

    // Try to persist/upsert into users table if Postgres available
    if (pgClient) {
      try {
        // Re-check the users table columns to avoid stale detection (race/late-connection cases)
        let nameCol = userNameColumn || 'name';
        try {
          const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
          const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
          if (names.indexOf('nome') >= 0) nameCol = 'nome';
          else if (names.indexOf('name') >= 0) nameCol = 'name';
        } catch (e) {
          // ignore and fall back to previously-detected column
        }

        // Try to find existing user by email first to avoid duplicates
        let uidToUse = uid;
        try {
          const emailCheck = await pgClient.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
          if (emailCheck.rowCount > 0) {
            uidToUse = emailCheck.rows[0].id;
            console.log('supabase-verify: Found existing user by email', email, 'with ID', uidToUse);
          }
        } catch (e) {
          console.warn('supabase-verify: Email check failed', e && e.message ? e.message : e);
        }

        // Build SQL specifically for the detected name column to avoid referencing a missing column
        const insertSql = `INSERT INTO users(id, email, ${nameCol}, photo_url, criado_em, atualizado_em)
           VALUES($1, $2, $3, $4, now(), now())
           ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ${nameCol} = EXCLUDED.${nameCol}, photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url), atualizado_em = now()`;
        try {
          await pgClient.query(insertSql, [uidToUse, email, nome, photoURL]);
        } catch (e) {
          // Log full SQL and params at debug level so we can see what failed without exposing secrets
          console.warn('supabase-verify: Upsert query failed. nameCol=', nameCol, 'sql=', insertSql, 'params=', [uidToUse, email, nome, photoURL]);
          throw e;
        }

        const r = await pgClient.query(`SELECT id, email, ${nameCol} as name, photo_url, is_pro, criado_em, celular, auth_id FROM users WHERE id = $1`, [uidToUse]);
        if (r.rowCount > 0) {
          const row = r.rows[0];
          
          // AUTO-LINK: If this OAuth login created/updated a user but there's a password account
          // with the same email, merge the cars from password account to this OAuth account
          if (email && uid !== uidToUse) {
            try {
              await autoLinkFromPasswordToOAuth(pgClient, email, uidToUse, uid);
            } catch (e) {
              console.warn('auto-link OAuth->Password during supabase-verify failed:', e && e.message ? e.message : e);
              // don't fail the login, just log the error
            }
          }
          
          const displayName = ((row.name || '') + '').trim();
          const phoneValue = row.celular || null;
          return res.json({ success: true, user: { id: row.id, email: row.email, name: displayName, nome: displayName, photoURL: row.photo_url || null, is_pro: row.is_pro, created_at: row.criado_em || null, celular: phoneValue, telefone: phoneValue, phone: phoneValue } });
        }
      } catch (e) {
        console.warn('supabase-verify: DB upsert failed, continuing with token user:', e && e.message ? e.message : e);
      }
    }

  // Fallback: return user info from Supabase token (include photo if available)
  return res.json({ success: true, user: { id: uid, email, name: nome, nome, photoURL: photoURL || null } });
  } catch (err) {
    console.error('supabase-verify error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal error' });
  }
});

  // Webhook: receive Supabase Auth user update events and sync into Postgres users row
  // Protect with SUPABASE_WEBHOOK_KEY (set in env) — header: X-SUPABASE-WEBHOOK-KEY
  app.post('/api/auth/supabase-webhook', async (req, res) => {
    try {
      const providedKey = String(req.headers['x-supabase-webhook-key'] || req.headers['x-webhook-key'] || '');
      if (!process.env.SUPABASE_WEBHOOK_KEY || providedKey !== String(process.env.SUPABASE_WEBHOOK_KEY)) {
        return res.status(403).json({ error: 'forbidden' });
      }

      const payload = req.body || {};
      // Supabase webhook payloads may wrap user under `user` or send the user object directly
      const u = payload.user || payload;
      const uid = u && (u.id || u.user_id || u.uid) ? (u.id || u.user_id || u.uid) : null;
      if (!uid) return res.status(400).json({ error: 'user id required in payload' });

      const email = u.email || (u.user_metadata && u.user_metadata.email) || null;
      const meta = u.user_metadata || u.raw_user_meta_data || {};
      const candidateName = (meta && (meta.name || meta.nome || meta.full_name)) || u.name || null;
      const candidatePhoto = u.avatar_url || u.picture || meta.avatar_url || meta.picture || (u.raw_user_meta_data && (u.raw_user_meta_data.picture || u.raw_user_meta_data.avatar_url)) || null;
      // phone candidates
      const phoneCandidates = [];
      if (u.phone) phoneCandidates.push(u.phone);
      if (u.phone_number) phoneCandidates.push(u.phone_number);
      if (meta && meta.phone) phoneCandidates.push(meta.phone);
      if (meta && meta.celular) phoneCandidates.push(meta.celular);
      if (u.raw_user_meta_data && u.raw_user_meta_data.phone) phoneCandidates.push(u.raw_user_meta_data.phone);
      const foundPhone = phoneCandidates.find(p => p && String(p).trim());

      if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });

      // Re-detect columns in public.users
      let nameCol = userNameColumn || 'name';
      let names = [];
      try {
        const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
        names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
        if (names.indexOf('nome') >= 0) nameCol = 'nome';
        else if (names.indexOf('name') >= 0) nameCol = 'name';
        // detect updated timestamp column if present
        var updatedCol = null;
        const updatedCandidates = ['atualizado_em','updated_at','updatedat','updated','criado_em'];
        const foundUpdated = names.find(n => updatedCandidates.indexOf(n) >= 0);
        if (foundUpdated) updatedCol = foundUpdated;
      } catch (e) {
        names = [];
      }

      // Try to find a matching users row by auth_id (or id) first, then by email
      let targetRow = null;
      try {
        const q = `SELECT id FROM users WHERE (auth_id = $1 OR id = $1) LIMIT 1`;
        const r = await pgClient.query(q, [uid]);
        if (r && r.rowCount > 0) targetRow = r.rows[0];
      } catch (e) { /* ignore */ }

      if (!targetRow && email) {
        try {
          const r2 = await pgClient.query('SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1', [String(email).trim().toLowerCase()]);
          if (r2 && r2.rowCount > 0) targetRow = r2.rows[0];
        } catch (e) { /* ignore */ }
      }

      if (!targetRow) {
        // No existing row to sync to. Optionally auto-create a users row when the
        // environment enables it (opt-in): SUPABASE_WEBHOOK_AUTO_CREATE=true
        const autoCreate = String(process.env.SUPABASE_WEBHOOK_AUTO_CREATE || '').toLowerCase();
        if (autoCreate === 'true' || autoCreate === '1') {
          try {
            const insertCols = [];
            const insertVals = [];
            const insertParams = [];
            let pidx = 1;

            if (names.length === 0 || names.indexOf('auth_id') >= 0) { insertCols.push('auth_id'); insertVals.push(`$${pidx++}`); insertParams.push(uid); }
            if (email && (names.length === 0 || names.indexOf('email') >= 0)) { insertCols.push('email'); insertVals.push(`$${pidx++}`); insertParams.push(String(email).trim().toLowerCase()); }
            if (candidateName && (names.length === 0 || names.indexOf(nameCol) >= 0)) { insertCols.push(nameCol); insertVals.push(`$${pidx++}`); insertParams.push(candidateName); }
            if (candidatePhoto && (names.length === 0 || names.indexOf('photo_url') >= 0)) { insertCols.push('photo_url'); insertVals.push(`$${pidx++}`); insertParams.push(candidatePhoto); }
            if (foundPhone && (names.length === 0 || names.indexOf('celular') >= 0 || names.indexOf('telefone') >= 0 || names.indexOf('phone') >= 0)) {
              const phoneCol = (names.length === 0) ? 'celular' : (['celular','telefone','phone'].find(c => names.indexOf(c) >= 0) || 'celular');
              insertCols.push(phoneCol); insertVals.push(`$${pidx++}`); insertParams.push(String(foundPhone).trim());
            }

            if (insertCols.length === 0) {
              return res.json({ ok: true, message: 'no writable columns present to create' });
            }

            const insertSql = `INSERT INTO users (${insertCols.join(',')}) VALUES (${insertVals.join(',')}) RETURNING id`;
            const created = await pgClient.query(insertSql, insertParams);
            if (created && created.rowCount > 0) {
              console.log('supabase-webhook: created users row', created.rows[0].id, 'for uid', uid);
              return res.json({ ok: true, id: created.rows[0].id, created: true });
            }
          } catch (e) {
            console.error('supabase-webhook: create failed', e && e.message ? e.message : e);
            return res.status(500).json({ error: 'create failed' });
          }
        }

        // No create requested or create not possible/failed — no-op
        return res.json({ ok: true, message: 'no matching users row found to sync (no-op)' });
      }

      // Read current values to avoid overwriting existing user data
      let current = null;
      try {
        const selCols = [];
        selCols.push('id');
        if (names.length === 0 || names.indexOf('auth_id') >= 0) selCols.push('auth_id');
        if (names.length === 0 || names.indexOf(nameCol) >= 0) selCols.push(nameCol);
        if (names.length === 0 || names.indexOf('photo_url') >= 0) selCols.push('photo_url');
        // phone/email if present
        if (names.length === 0 || names.indexOf('email') >= 0) selCols.push('email');
        const phoneCol = (names.length === 0) ? null : (['celular','telefone','phone'].find(c => names.indexOf(c) >= 0) || null);
        if (phoneCol) selCols.push(phoneCol);
        if (updatedCol) selCols.push(updatedCol);
        const curQ = `SELECT ${selCols.join(', ')} FROM users WHERE id = $1 LIMIT 1`;
        const curR = await pgClient.query(curQ, [targetRow.id]);
        if (curR && curR.rowCount > 0) current = curR.rows[0];
      } catch (e) {
        console.warn('supabase-webhook: could not read current user row, proceeding with cautious updates', e && e.message ? e.message : e);
      }

      // Honor optional force-sync env var to overwrite existing values when true
      const forceSync = String(process.env.SUPABASE_WEBHOOK_FORCE_SYNC || '').toLowerCase() === 'true';

      // Determine timestamps: Supabase update time vs current DB updated time (if available)
      let supaUpdated = null;
      try {
        const cand = [u.updated_at, (u.user_metadata && u.user_metadata.updated_at), u.confirmed_at, u.last_sign_in_at, u.created_at, payload.event_at, payload.time];
        for (const s of cand) {
          if (!s) continue;
          const d = new Date(s);
          if (!isNaN(d)) { supaUpdated = d; break; }
        }
      } catch (e) { supaUpdated = null; }

      let curUpdated = null;
      try {
        if (updatedCol && current && current[updatedCol]){
          const d = new Date(current[updatedCol]); if (!isNaN(d)) curUpdated = d;
        }
      } catch (e) { curUpdated = null; }

      // Build update set for detected columns but only when missing or empty to avoid overwriting
      const updates = [];
      const params = [];
      let idx = 1;

      // Ensure auth_id exists/updated if missing or forceSync
      if ((names.length === 0 || names.indexOf('auth_id') >= 0) && (forceSync || !current || !current.auth_id || (supaUpdated && curUpdated && supaUpdated > curUpdated))) {
        updates.push(`auth_id = $${idx++}`);
        params.push(uid);
      }

      // Only set name if candidate present AND current name is missing/empty, or if forceSync
      if (candidateName && (names.length === 0 || names.indexOf(nameCol) >= 0)) {
        const curName = current && (current[nameCol] || current.name) ? String(current[nameCol] || current.name).trim() : '';
        if (forceSync || !curName || (supaUpdated && curUpdated && supaUpdated > curUpdated)) {
          updates.push(`${nameCol} = $${idx++}`);
          params.push(candidateName);
        }
      }

      // Only set photo if candidate present AND current photo is missing/empty, or if forceSync
      if (candidatePhoto && (names.length === 0 || names.indexOf('photo_url') >= 0)) {
        const curPhoto = current && current.photo_url ? String(current.photo_url).trim() : '';
        if (forceSync || !curPhoto || (supaUpdated && curUpdated && supaUpdated > curUpdated)) {
          updates.push(`photo_url = $${idx++}`);
          params.push(candidatePhoto);
        }
      }

      // Phone
      if (foundPhone && (names.length === 0 || names.indexOf('celular') >= 0 || names.indexOf('telefone') >= 0 || names.indexOf('phone') >= 0)) {
        const phoneColName = (names.length === 0) ? 'celular' : (['celular','telefone','phone'].find(c => names.indexOf(c) >= 0) || 'celular');
        const curPhone = current && current[phoneColName] ? String(current[phoneColName]).trim() : '';
        if (forceSync || !curPhone || (supaUpdated && curUpdated && supaUpdated > curUpdated)) {
          updates.push(`${phoneColName} = $${idx++}`);
          params.push(String(foundPhone).trim());
        }
      }

      // Email: if forceSync or target row has no email, set it
      if (email && (names.length === 0 || names.indexOf('email') >= 0)) {
        const curEmail = current && current.email ? String(current.email).trim() : '';
        if (forceSync || !curEmail || (supaUpdated && curUpdated && supaUpdated > curUpdated)) {
          updates.push(`email = $${idx++}`);
          params.push(String(email).trim().toLowerCase());
        }
      }

      if (updates.length === 0) return res.json({ ok: true, message: 'no writable columns present to update (nothing to change)' });

      // Finalize update SQL
      const updateSql = `UPDATE users SET ${updates.join(', ')}, atualizado_em = now() WHERE id = $${idx}`;
      params.push(targetRow.id);
      try {
        await pgClient.query(updateSql, params);
      } catch (e) {
        console.error('supabase-webhook: update failed', e && e.message ? e.message : e);
        return res.status(500).json({ error: 'update failed' });
      }

      return res.json({ ok: true, id: targetRow.id });
    } catch (err) {
      console.error('supabase-webhook error:', err && err.stack ? err.stack : err);
      return res.status(500).json({ error: 'internal' });
    }
  });

// Simple password hashing helpers (PBKDF2) - stores as salt$hash
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}$${derived}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 2) return false;
  const salt = parts[0];
  const hash = parts[1];
  const derived = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  } catch (e) {
    return false;
  }
}

// --- Supabase REST fallback helpers (use when Postgres is not reachable) ---
async function createUserRest({ nome, email, senha, is_pro = false, passwordColumn = null }){
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase REST not configured');
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/users`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password_hash = hashPassword(senha);
  const body = { email: String(email).trim().toLowerCase(), nome: nome || null, is_pro };
  const col = passwordColumn || userPasswordColumn || 'password_hash';
  body[col] = password_hash;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if(!res.ok){
    // Try to parse JSON error if any
    try{ const j = JSON.parse(text); throw new Error(JSON.stringify(j)); }catch(e){ throw new Error(`${res.status} ${text}`); }
  }
  // PostgREST returns an array with the created row
  try{ const j = JSON.parse(text); return j[0]; }catch(e){ return null; }
}

async function loginUserRest(email, senha){
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase REST not configured');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = process.env.SUPABASE_URL.replace(/\/$/, '');
  const q = `${base}/rest/v1/users?email=eq.${encodeURIComponent(String(email).trim().toLowerCase())}`;
  const res = await fetch(q, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } });
  if(!res.ok) throw new Error(`Supabase REST query failed: ${res.status}`);
  const rows = await res.json();
  if(!rows || rows.length === 0) return null;
  const u = rows[0];
  const pwCol = userPasswordColumn || 'password_hash';
  if(!u[pwCol]) return null;
  if(!verifyPassword(senha, u[pwCol])) return null;
  // Normalize fields to match existing API and include both 'name' and 'nome'
  const displayName = ((u.nome || u.name) || '').trim();
  const safe = {
    id: u.id,
    email: u.email,
    name: displayName,
    nome: displayName,
    is_pro: u.is_pro || false,
    pro_since: u.pro_since || null,
    created_at: u.created_at || u.criado_em || null
  };
  // include photo if present in the row or in raw_user_meta_data
  try {
    if (u.photo_url) safe.photoURL = u.photo_url;
    else if (u.avatar_url) safe.photoURL = u.avatar_url;
    else if (u.raw_user_meta_data) {
      try {
        const raw = typeof u.raw_user_meta_data === 'string' ? JSON.parse(u.raw_user_meta_data) : u.raw_user_meta_data;
        safe.photoURL = safe.photoURL || raw && (raw.picture || raw.avatar_url || raw.profile_image_url) || null;
      } catch (e) { /* ignore parse errors */ }
    }
  } catch (e) { /* ignore */ }
  // expose auth_id if present in the row (some schemas store it)
  try {
    if (u.auth_id) {
      safe.auth_id = u.auth_id;
      safe.providers = ['google'];
    }
    // If Supabase REST returned raw_user_meta_data with identities, detect google identity
    if (!safe.providers && u.raw_user_meta_data) {
      try {
        const raw = typeof u.raw_user_meta_data === 'string' ? JSON.parse(u.raw_user_meta_data) : u.raw_user_meta_data;
        if (raw && raw.identities && Array.isArray(raw.identities)) {
          const hasGoogle = raw.identities.some(id => (id && (id.provider || id.provider_id || id.providerId) && String(id.provider || id.provider_id || id.providerId).toLowerCase().includes('google')));
          if (hasGoogle) { safe.providers = ['google']; }
        }
      } catch (e) { /* ignore parse errors */ }
    }
  } catch (e) { /* ignore */ }
  return safe;
}

// Update user via Supabase REST fallback (use when Postgres is not reachable)
async function updateUserRest({ id, nome, email, celular, novaSenha, passwordColumn = null }){
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase REST not configured');
  const base = process.env.SUPABASE_URL.replace(/\/$/, '');
  const url = `${base}/rest/v1/users?id=eq.${encodeURIComponent(String(id))}`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const body = {};
  if (typeof email !== 'undefined') body.email = String(email).trim().toLowerCase();
  if (typeof nome !== 'undefined') body.nome = nome;
  if (typeof celular !== 'undefined') body.celular = celular;
  if (novaSenha) {
    const col = passwordColumn || userPasswordColumn || 'password_hash';
    body[col] = hashPassword(novaSenha);
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if(!res.ok){
    try{ const j = JSON.parse(text); throw new Error(JSON.stringify(j)); }catch(e){ throw new Error(`${res.status} ${text}`); }
  }
  try{ const j = JSON.parse(text); return j[0]; }catch(e){ return null; }
}

// Simple in-memory counter to track how often we fall back to Supabase REST
let supabaseRestFallbackCount = 0;

/**
 * Automatically detect and merge duplicate user accounts with the same email.
 * When a user logs in with password but doesn't have auth_id, check if there's
 * another account with the same email that has auth_id (OAuth account).
 * If found, merge the data and set auth_id on the password account.
 */
async function autoLinkDuplicateAccounts(pgClient, email, passwordUserId) {
  console.log(`auto-link: checking for duplicates for email=${email}, passwordUserId=${passwordUserId}`);
  
  try {
    // Find all users with this email
    const allUsersQuery = `
      SELECT id, email, auth_id, criado_em, nome, photo_url 
      FROM users 
      WHERE LOWER(email) = LOWER($1) AND id != $2
      ORDER BY auth_id IS NOT NULL DESC, criado_em ASC
    `;
    
    const result = await pgClient.query(allUsersQuery, [email, passwordUserId]);
    
    if (result.rowCount === 0) {
      console.log(`auto-link: no duplicates found for ${email}`);
      return;
    }
    
    // Find the OAuth account (the one with auth_id)
    const oauthAccount = result.rows.find(u => u.auth_id);
    if (!oauthAccount) {
      console.log(`auto-link: no OAuth account found for ${email}`);
      return;
    }
    
    console.log(`auto-link: found OAuth account ${oauthAccount.id} with auth_id=${oauthAccount.auth_id}`);
    
    // Migrate cars from OAuth account to password account
    const migrateCarsQuery = `
      UPDATE cars 
      SET user_id = $1, updated_at = now() 
      WHERE user_id = $2
    `;
    
    const carsMigrated = await pgClient.query(migrateCarsQuery, [passwordUserId, oauthAccount.id]);
    console.log(`auto-link: migrated ${carsMigrated.rowCount} cars from ${oauthAccount.id} to ${passwordUserId}`);
    
    // Set auth_id on the password account
    const linkQuery = `
      UPDATE users 
      SET auth_id = $1, photo_url = COALESCE(photo_url, $2), atualizado_em = now() 
      WHERE id = $3
    `;
    
    await pgClient.query(linkQuery, [oauthAccount.auth_id, oauthAccount.photo_url, passwordUserId]);
    console.log(`auto-link: linked password account ${passwordUserId} to auth_id=${oauthAccount.auth_id}`);
    
    // Remove the empty OAuth account (but keep if it has non-migratable data)
    const hasDataQuery = `
      SELECT 
        (SELECT COUNT(*) FROM cars WHERE user_id = $1) as cars_count,
        (SELECT COUNT(*) FROM guias WHERE autor_email = $1) as guias_count,
        (SELECT COUNT(*) FROM payments WHERE user_email = $2) as payments_count
    `;
    
    const dataCheck = await pgClient.query(hasDataQuery, [oauthAccount.id, oauthAccount.email]);
    const hasData = dataCheck.rows[0];
    
    if (hasData.cars_count === 0 && hasData.guias_count === 0 && hasData.payments_count === 0) {
      await pgClient.query('DELETE FROM users WHERE id = $1', [oauthAccount.id]);
      console.log(`auto-link: removed empty OAuth account ${oauthAccount.id}`);
    } else {
      console.log(`auto-link: kept OAuth account ${oauthAccount.id} (has non-migratable data)`);
    }
    
    console.log(`auto-link: successfully merged accounts for ${email}`);
    
  } catch (error) {
    console.error('auto-link error:', error);
    throw error;
  }
}

/**
 * Auto-link when OAuth user logs in but there's already a password account.
 * Migrate cars from password account to OAuth account and update auth_id.
 */
async function autoLinkFromPasswordToOAuth(pgClient, email, oauthUserId, oauthAuthId) {
  console.log(`auto-link-oauth: checking for password accounts for email=${email}, oauthUserId=${oauthUserId}`);
  
  try {
    // Find password accounts (those without auth_id) with same email
    const passwordAccountsQuery = `
      SELECT id, email, auth_id, criado_em, nome 
      FROM users 
      WHERE LOWER(email) = LOWER($1) AND id != $2 AND auth_id IS NULL
      ORDER BY criado_em ASC
    `;
    
    const result = await pgClient.query(passwordAccountsQuery, [email, oauthUserId]);
    
    if (result.rowCount === 0) {
      console.log(`auto-link-oauth: no password accounts found for ${email}`);
      return;
    }
    
    console.log(`auto-link-oauth: found ${result.rowCount} password accounts for ${email}`);
    
    // Migrate cars from all password accounts to OAuth account
    for (const passwordAccount of result.rows) {
      const migrateCarsQuery = `
        UPDATE cars 
        SET user_id = $1, updated_at = now() 
        WHERE user_id = $2
      `;
      
      const carsMigrated = await pgClient.query(migrateCarsQuery, [oauthUserId, passwordAccount.id]);
      console.log(`auto-link-oauth: migrated ${carsMigrated.rowCount} cars from ${passwordAccount.id} to ${oauthUserId}`);
      
      // Remove the empty password account if it has no other data
      const hasDataQuery = `
        SELECT 
          (SELECT COUNT(*) FROM cars WHERE user_id = $1) as cars_count,
          (SELECT COUNT(*) FROM guias WHERE autor_email = $1) as guias_count,
          (SELECT COUNT(*) FROM payments WHERE user_email = $2) as payments_count
      `;
      
      const dataCheck = await pgClient.query(hasDataQuery, [passwordAccount.id, passwordAccount.email]);
      const hasData = dataCheck.rows[0];
      
      if (hasData.cars_count === 0 && hasData.guias_count === 0 && hasData.payments_count === 0) {
        await pgClient.query('DELETE FROM users WHERE id = $1', [passwordAccount.id]);
        console.log(`auto-link-oauth: removed empty password account ${passwordAccount.id}`);
      } else {
        console.log(`auto-link-oauth: kept password account ${passwordAccount.id} (has non-migratable data)`);
      }
    }
    
    // Update OAuth account to ensure it has the correct auth_id
    await pgClient.query('UPDATE users SET auth_id = $1 WHERE id = $2', [oauthAuthId, oauthUserId]);
    console.log(`auto-link-oauth: ensured OAuth account ${oauthUserId} has auth_id=${oauthAuthId}`);
    
    console.log(`auto-link-oauth: successfully merged password accounts for ${email}`);
    
  } catch (error) {
    console.error('auto-link-oauth error:', error);
    throw error;
  }
}

// Create user (try DB, fallback to csvData.users)
app.post('/api/users', async (req, res) => {
  const { nome, email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: 'email and senha are required' });
  const normalizedEmail = String(email).trim().toLowerCase();
  const debugMode = isDebugRequest(req);
  try {
    if (pgClient) {
      // HOTFIX: minimal INSERT to maximize compatibility across schemas.
      // Insert only email, name and password hash. Avoid optional columns like created_at/is_pro/pro_since
      const passwordHash = hashPassword(senha);
      const q = `INSERT INTO users(email, ${userNameColumn}, ${userPasswordColumn}) VALUES($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id, email, ${userNameColumn} as name`;
      try {
        const r = await pgClient.query(q, [normalizedEmail, nome || null, passwordHash]);
        if (r.rowCount > 0) return res.status(201).json(r.rows[0]);
        const existing = await pgClient.query(`SELECT id, email, ${userNameColumn} as name FROM users WHERE email = $1`, [normalizedEmail]);
        if (existing.rowCount > 0) return res.status(409).json({ error: 'user exists', user: existing.rows[0] });
        return res.status(500).json({ error: 'could not create user' });
      } catch (e) {
        console.error('PG create user failed (hotfix):', e && e.stack ? e.stack : e);
        // Let outer catch handle storing lastUserCreateError and returning appropriate response
        throw e;
      }
    }
    // If Postgres not available, try Supabase REST fallback if configured
    if(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY){
      try{
        const created = await createUserRest({ nome, email: normalizedEmail, senha, is_pro: false, passwordColumn: userPasswordColumn });
        if(created) return res.status(201).json({ id: created.id, email: created.email, name: created.nome || created.name, is_pro: created.is_pro });
      }catch(e){
        console.warn('Supabase REST create user failed:', e && e.message ? e.message : e);
        // fallthrough to CSV
      }
    }
    // Fallback to CSV/local
    const id = `local_${Date.now()}`;
    const user = { id, email: normalizedEmail, nome: nome || '', senha: senha, is_pro: false, criado_em: new Date().toISOString() };
    csvData.users = csvData.users || [];
    csvData.users.push(user);
    return res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err && err.stack ? err.stack : err);
    // store for remote debugging via endpoint
    // Debug storage disabled in production. To capture this error re-enable lastUserCreateError at the top.
    // try { lastUserCreateError = { time: new Date().toISOString(), message: err && err.message ? err.message : String(err), stack: err && err.stack ? err.stack : null }; } catch(e){}
    if (debugMode) {
      // Return less-detailed error even when debugging to avoid leaking stack traces
      return res.status(500).json({ error: 'internal error', details: err && err.message ? err.message : String(err) });
    }
    return res.status(500).json({ error: 'internal error' });
  }
});

// DEBUG: Add phone to user (temporary endpoint)
app.post('/api/debug/add-phone/:id', async (req, res) => {
  const { id } = req.params;
  const { celular } = req.body;
  
  if (!pgClient) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    const result = await pgClient.query(
      `UPDATE users SET celular = $1, atualizado_em = now() WHERE (id = $2 OR auth_id = $2)`,
      [celular, id]
    );
    
    if (result.rowCount > 0) {
      return res.json({ success: true, message: 'Phone added successfully' });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error adding phone:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile data
app.get('/api/users/:id', async (req, res) => {
  console.log('🔍 GET /api/users/:id - ENDPOINT HIT');
  const { id } = req.params;
  
  if (!pgClient) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // Debug: Try different queries to see what's in the database
    console.log('🔍 DEBUG - Searching for user with ID:', id);
    
    // Test 1: Find by id
    const r1 = await pgClient.query(`SELECT id, email, nome, auth_id, celular FROM users WHERE id = $1 LIMIT 1`, [id]);
    console.log('🔍 DEBUG - Query by id:', { rowCount: r1.rowCount, rows: r1.rows });
    
    // Test 2: Find by auth_id
    const r2 = await pgClient.query(`SELECT id, email, nome, auth_id, celular FROM users WHERE auth_id = $1 LIMIT 1`, [id]);
    console.log('🔍 DEBUG - Query by auth_id:', { rowCount: r2.rowCount, rows: r2.rows });
    
    // Test 3: Find by email (to see if user exists at all)
    const r3 = await pgClient.query(`SELECT id, email, nome, auth_id, celular FROM users WHERE email = 'luciodfp@gmail.com' LIMIT 1`);
    console.log('🔍 DEBUG - Query by email:', { rowCount: r3.rowCount, rows: r3.rows });
    
    // Use whichever query found the user
    const r = r1.rowCount > 0 ? r1 : (r2.rowCount > 0 ? r2 : r3);
    
    console.log('🔍 GET - Final query result:', {
      rowCount: r.rowCount,
      rows: r.rows
    });
    
    if (r.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const row = r.rows[0];
    const displayName = ((row.nome || '') + '').trim();
    const phoneValue = row.celular || null;
    
    const userData = {
      id: row.id,
      auth_id: row.auth_id,
      email: row.email,
      name: displayName,
      nome: displayName,
      photoURL: row.photo_url || null,
      is_pro: row.is_pro,
      created_at: row.criado_em || null,
      celular: phoneValue,
      telefone: phoneValue,
      phone: phoneValue
    };
    
    console.log('🔍 GET - Sending user data:', userData);
    return res.json({ success: true, user: userData });
    
  } catch (err) {
    console.error('GET /api/users/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (sync to Postgres and to Supabase Auth when linked)
app.put('/api/users/:id', async (req, res) => {
  console.log('🔥 PUT /api/users/:id - ENDPOINT HIT');
  const { id } = req.params;
  const body = req.body || {};
  const { nome, email, celular, novaSenha, photoURL } = body;
  console.log('🔥 PUT - Received data:', { id, nome, email, celular, novaSenha: novaSenha ? '[HIDDEN]' : null, photoURL });
  // If Postgres client is not available, attempt Supabase REST fallback before returning 503
  if (!pgClient) {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        supabaseRestFallbackCount++;
        console.warn('pgClient not available: attempting Supabase REST fallback (count=' + supabaseRestFallbackCount + ')');
        const updated = await updateUserRest({ id, nome, email, celular, novaSenha, passwordColumn: userPasswordColumn });
        if (updated) {
          const displayName = ((updated.nome || updated.name) || '').trim();
          const safe = { id: updated.id, email: updated.email, name: displayName, nome: displayName, photoURL: updated.photo_url || updated.avatar_url || null };
          if (updated.auth_id) { safe.auth_id = updated.auth_id; safe.providers = ['google']; }
          if (updated.celular) safe.celular = updated.celular;
          console.log('Supabase REST fallback succeeded for user', id);
          return res.json({ success: true, user: safe });
        }
        console.warn('Supabase REST update returned no row for id', id);
        return res.status(500).json({ error: 'supabase-rest update failed' });
      } catch (e) {
        console.error('Supabase REST update failed:', e && e.message ? e.message : e);
        return res.status(503).json({ error: 'pgClient not available' });
      }
    }
    return res.status(503).json({ error: 'pgClient not available' });
  }
  
  console.log('🔥 PUT - Using Postgres client');
  try {
    // Re-detect users table columns to avoid writing/returning non-existent columns
    let nameCol = userNameColumn || 'name';
    let names = [];
    try {
  const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
      names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
      if (names.indexOf('nome') >= 0) nameCol = 'nome';
      else if (names.indexOf('name') >= 0) nameCol = 'name';
    } catch (e) {
      // if detection fails, fall back to previously-detected columns
      names = [];
    }

    const updates = [];
    const params = [];
    let idx = 1;
    // Only include columns that actually exist in the users table
    if (email && (names.length === 0 || names.indexOf('email') >= 0)) { updates.push(`email = $${idx++}`); params.push(String(email).trim().toLowerCase()); }
    if (nome && (names.length === 0 || names.indexOf(nameCol) >= 0)) { updates.push(`${nameCol} = $${idx++}`); params.push(nome); }
    // phone column can be named celular, telefone, phone
  const phoneCols = ['celular', 'telefone', 'phone'];
  // Only pick a phone column if we successfully detected table columns; otherwise be conservative
  const phoneColPresent = (names.length === 0) ? null : phoneCols.find(c => names.indexOf(c) >= 0);
  if (typeof celular !== 'undefined' && phoneColPresent && names.indexOf(phoneColPresent) >= 0) { updates.push(`${phoneColPresent} = $${idx++}`); params.push(celular); }
    if (typeof photoURL !== 'undefined' && (names.length === 0 || names.indexOf('photo_url') >= 0)) { updates.push(`photo_url = $${idx++}`); params.push(photoURL); }
    if (novaSenha && (names.length === 0 || names.indexOf(userPasswordColumn) >= 0)) {
      const hashed = hashPassword(novaSenha);
      updates.push(`${userPasswordColumn} = $${idx++}`); params.push(hashed);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'no writable fields found on users table for provided payload' });

    // Build RETURNING columns dynamically based on detected columns
    const returning = ['id'];
    if (names.length === 0 || names.indexOf('email') >= 0) returning.push('email');
    if (names.length === 0 || names.indexOf(nameCol) >= 0) returning.push(`${nameCol} as name`);
    if (names.length === 0 || names.indexOf('photo_url') >= 0) returning.push('photo_url');
    if (names.length === 0 || names.indexOf('auth_id') >= 0) returning.push('auth_id');
  if (phoneColPresent && names.indexOf(phoneColPresent) >= 0) returning.push(`${phoneColPresent}`);
    if (names.length === 0 || names.indexOf(userPasswordColumn) >= 0) returning.push(`${userPasswordColumn} as password_hash`);

  // Execute update without RETURNING to avoid referencing optional columns that may not exist
  // Accept both id and auth_id as identifier
  const updateQ = `UPDATE users SET ${updates.join(', ')}, atualizado_em = now() WHERE (id = $${idx} OR auth_id = $${idx})`;
  params.push(id);
  
  console.log('🔥 PUT - Executing UPDATE query:', updateQ);
  console.log('🔥 PUT - Query params:', params);
  
  const updRes = await pgClient.query(updateQ, params);
  console.log('🔥 PUT - UPDATE result:', { rowCount: updRes.rowCount });
  if (updRes.rowCount === 0) return res.status(404).json({ error: 'not found' });

  // Now fetch the canonical row using a safe SELECT that only includes columns that actually exist
  // Re-read users table columns to avoid stale/misdetected schema info
  try {
  const cols2 = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
    names = (cols2.rows || []).map(r => String(r.column_name).toLowerCase());
    if (names.indexOf('nome') >= 0) nameCol = 'nome';
    else if (names.indexOf('name') >= 0) nameCol = 'name';
  } catch (e) {
    // ignore and fall back to previously-detected names
  }

  const selectCols = ['id'];
  if (names.length === 0 || names.indexOf('email') >= 0) selectCols.push('email');
  if (names.length === 0 || names.indexOf(nameCol) >= 0) selectCols.push(`${nameCol} as name`);
  if (names.length === 0 || names.indexOf('photo_url') >= 0) selectCols.push('photo_url');
  if (names.length === 0 || names.indexOf('auth_id') >= 0) selectCols.push('auth_id');
  if (names.length === 0 || names.indexOf(userPasswordColumn) >= 0) selectCols.push(`${userPasswordColumn} as password_hash`);
  // include phone if present in schema
  const phoneCandidates = ['celular','telefone','phone'];
  const phoneCol = (names.length === 0) ? null : phoneCandidates.find(c => names.indexOf(c) >= 0) || null;
  if (phoneCol) selectCols.push(phoneCol);

  const selQ = `SELECT ${selectCols.join(', ')} FROM users WHERE (id = $1 OR auth_id = $1) LIMIT 1`;
    // If caller requested debug, emit the exact SELECT so we can see which column name caused a failure
    try {
  const dbg = isDebugRequest(req);
      if (dbg) console.warn('DEBUG /api/users/:id select:', selQ, 'params:', [id]);
    } catch (e) { /* ignore logging errors */ }
    let r;
    try {
      r = await pgClient.query(selQ, [id]);
    } catch (e) {
      // If a column referenced in selQ does not exist (race or mis-detected schema),
      // retry with a minimal, safe select that only includes known core columns.
      console.warn('Safe-select retry due to SELECT failure:', e && e.message ? e.message : e);
      try {
        const safeCols = [`id`, `email`, `${nameCol} as name`, `photo_url`];
        if (userHasAuthId) safeCols.push('auth_id');
        const safeQ = `SELECT ${safeCols.join(', ')} FROM users WHERE (id = $1 OR auth_id = $1) LIMIT 1`;
        r = await pgClient.query(safeQ, [id]);
      } catch (e2) {
        // rethrow original error for outer handler
        throw e;
      }
    }
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    const row = r.rows[0];

    // If the row has auth_id and we have Supabase admin credentials, propagate changes to Supabase
    if (userHasAuthId && row.auth_id && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
        const updateData = {};
        if (email) updateData.email = String(email).trim().toLowerCase();
        if (novaSenha) updateData.password = novaSenha;
        // user_metadata: preserve existing metadata keys and merge name/celular/avatar
        const metadata = {};
        if (nome) metadata.name = nome;
        if (celular) metadata.celular = celular;
        if (Object.keys(metadata).length) updateData.user_metadata = metadata;
        // If we have a photoURL, try to set avatar fields too
        if (photoURL) {
          updateData.user_metadata = updateData.user_metadata || {};
          updateData.user_metadata.avatar_url = photoURL;
        }
        if (Object.keys(updateData).length) {
          try {
            await supabaseAdmin.auth.admin.updateUserById(row.auth_id, updateData);
            console.log('Synced updated profile to Supabase for auth_id', row.auth_id);
          } catch (e) {
            console.warn('Failed to update Supabase user during profile sync', e && e.message ? e.message : e);
          }
        }
      } catch (e) {
        console.warn('Profile sync to Supabase failed', e && e.message ? e.message : e);
      }
    }

    // Normalize response for frontend
    const displayName = ((row.name || '') + '').trim();
    const safe = { id: row.id, email: row.email, name: displayName, nome: displayName, photoURL: row.photo_url || null };
    if (row.auth_id) { safe.auth_id = row.auth_id; safe.providers = ['google']; }
    // If Postgres does not have a phone/celular column but the user is linked to Supabase,
    // try to fetch phone from Supabase admin user metadata so the frontend can display it.
    try {
      if (userHasAuthId && row.auth_id && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
        try {
          if (supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.getUserById === 'function') {
            const adminRes = await supabaseAdmin.auth.admin.getUserById(row.auth_id);
            if (adminRes && adminRes.data && adminRes.data.user) {
              const au = adminRes.data.user;
              try {
                const phoneCandidates = [];
                if (au.phone) phoneCandidates.push(au.phone);
                if (au.phone_number) phoneCandidates.push(au.phone_number);
                if (au.user_metadata && au.user_metadata.phone) phoneCandidates.push(au.user_metadata.phone);
                if (au.user_metadata && au.user_metadata.celular) phoneCandidates.push(au.user_metadata.celular);
                if (au.raw_user_meta_data && au.raw_user_meta_data.phone) phoneCandidates.push(au.raw_user_meta_data.phone);
                if (au.raw_user_meta_data && au.raw_user_meta_data.phone_number) phoneCandidates.push(au.raw_user_meta_data.phone_number);
                if (au.raw_user_meta_data && au.raw_user_meta_data.celular) phoneCandidates.push(au.raw_user_meta_data.celular);
                const foundPhone = phoneCandidates.find(p => p && String(p).trim());
                if (foundPhone) safe.celular = String(foundPhone).trim();
              } catch (e) { /* ignore phone extraction errors */ }
            }
          }
        } catch (e) { /* ignore supabase admin read errors */ }
      }
    } catch (e) { /* ignore */ }
    return res.json({ success: true, user: safe });
  } catch (err) {
    console.error('Profile update failed:', err && err.stack ? err.stack : err);
    // If caller included X-Debug: true or X-Debug-Key: let-me-debug, return error details for local debugging
  const debugMode = isDebugRequest(req);
    if (debugMode) {
      return res.status(500).json({ error: 'internal error', details: err && err.message ? err.message : String(err), stack: err && err.stack ? err.stack : null });
    }
    return res.status(500).json({ error: 'internal error' });
  }
});

// Debug: read the last user create error (temporary) - disabled in production
/*
app.get('/api/debug/last-user-error', (req, res) => {
  if (!lastUserCreateError) return res.status(404).json({ error: 'no error recorded' });
  return res.json(lastUserCreateError);
});
*/

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: 'email and senha required' });
  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    if (pgClient) {
      const selectCols = ['id', 'email', `${userNameColumn} as name`, `${userPasswordColumn} as password_hash`, 'photo_url'];
      if (userHasIsPro) selectCols.push('is_pro');
      if (userHasProSince) selectCols.push('pro_since');
      if (userCreatedAtColumn) selectCols.push(userCreatedAtColumn + ' as created_at');
        // If the users table includes an auth_id column, include it so the frontend
        // can detect linked provider accounts (e.g. Google) after password login.
        if (userHasAuthId) selectCols.push('auth_id');
      const r = await pgClient.query(`SELECT ${selectCols.join(', ')} FROM users WHERE lower(email) = $1`, [normalizedEmail]);
      if (r.rowCount === 0) return res.status(401).json({ error: 'invalid credentials' });
  const u = r.rows[0];
  if (!u.password_hash || !verifyPassword(senha, u.password_hash)) return res.status(401).json({ error: 'invalid credentials' });
  const displayName = ((u.name || u.nome) || '').trim();
    const safe = { id: u.id, email: u.email, name: displayName, nome: displayName };
      if (userHasIsPro) safe.is_pro = u.is_pro;
      if (userHasProSince) safe.pro_since = u.pro_since;
      if (userCreatedAtColumn) safe.created_at = u.created_at;
        // Expose photo_url and auth_id so frontend can correlate this user with an
        // external auth provider (e.g. Google) and display a consistent avatar.
        if (u.photo_url) safe.photoURL = u.photo_url;
        // Expose auth_id so frontend can correlate this user with an external auth provider
        // and show connection settings (e.g. Google linked). Also provide a lightweight
        // providers hint if auth_id is present.
        if (userHasAuthId && u.auth_id) {
          safe.auth_id = u.auth_id;
          safe.providers = ['google'];
        }
        // If the row lacks a persisted photo_url but we have an auth_id (provider id),
        // try to fetch provider avatar from Supabase admin and backfill the users.photo_url
        // so future password logins display the same avatar as provider logins.
        try {
          if (userHasAuthId && u.auth_id && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
              const { createClient } = require('@supabase/supabase-js');
              const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
              if (supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.getUserById === 'function') {
                const adminRes = await supabaseAdmin.auth.admin.getUserById(u.auth_id);
                if (adminRes && adminRes.data && adminRes.data.user) {
                  const au = adminRes.data.user;
                  const candidate = (au.raw_user_meta_data && (au.raw_user_meta_data.picture || au.raw_user_meta_data.avatar_url)) || au.avatar_url || au.picture || null;
                  // Try to extract a phone/celular from admin user metadata or raw_user_meta_data
                  try {
                    const phoneCandidates = [];
                    if (au.phone) phoneCandidates.push(au.phone);
                    if (au.phone_number) phoneCandidates.push(au.phone_number);
                    if (au.user_metadata && au.user_metadata.phone) phoneCandidates.push(au.user_metadata.phone);
                    if (au.user_metadata && au.user_metadata.celular) phoneCandidates.push(au.user_metadata.celular);
                    if (au.raw_user_meta_data && au.raw_user_meta_data.phone) phoneCandidates.push(au.raw_user_meta_data.phone);
                    if (au.raw_user_meta_data && au.raw_user_meta_data.phone_number) phoneCandidates.push(au.raw_user_meta_data.phone_number);
                    if (au.raw_user_meta_data && au.raw_user_meta_data.celular) phoneCandidates.push(au.raw_user_meta_data.celular);
                    const foundPhone = phoneCandidates.find(p => p && String(p).trim());
                    if (foundPhone) safe.celular = String(foundPhone).trim();
                  } catch (e) { /* ignore phone extraction errors */ }
                  if (candidate) {
                    safe.photoURL = candidate;
                    try {
                      await pgClient.query('UPDATE users SET photo_url = $1, atualizado_em = now() WHERE id = $2', [candidate, u.id]);
                      console.log('Backfilled users.photo_url from Supabase admin for user', u.id);
                    } catch (e) { /* ignore update failure */ }
                  }
                }
              }
            } catch (e) {
              console.warn('login: supabase admin lookup for avatar failed', e && e.message ? e.message : e);
            }
          }
        } catch (e) { /* ignore */ }
        
        // AUTO-LINK: Try to detect and link accounts with the same email
        // If this password login is successful but the user doesn't have auth_id,
        // check if there's another user with the same email that has auth_id
        console.log(`🔍 DEBUG LOGIN: user=${u.id}, email=${normalizedEmail}, auth_id=${u.auth_id}, userHasAuthId=${userHasAuthId}`);
        if (!u.auth_id && userHasAuthId) {
          console.log(`🔄 AUTO-LINK: Attempting auto-link for ${normalizedEmail}`);
          try {
            await autoLinkDuplicateAccounts(pgClient, normalizedEmail, u.id);
          } catch (e) {
            console.warn('auto-link during login failed:', e && e.message ? e.message : e);
            // don't fail the login, just log the error
          }
        } else {
          console.log(`⏭️ AUTO-LINK: Skipping auto-link - auth_id=${u.auth_id}, userHasAuthId=${userHasAuthId}`);
        }
        
      return res.json({ success: true, user: safe });
    }
    // Try Supabase REST fallback if configured
    if(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY){
      try{
        const origin = req.headers.origin || req.headers.referer || '-';
        console.log(`[login] request origin=${origin} bodyKeys=${Object.keys(req.body||{}).join(',')}`);
        const user = await loginUserRest(normalizedEmail, senha);
        if(user) return res.json({ success: true, user });
      }catch(e){
        console.warn('Supabase REST login failed:', e && e.message ? e.message : e);
        // fallthrough to CSV
      }
    }
    // Fallback to CSV/local data
    const users = (csvData.users || []).concat([]);
    const found = users.find(x => String(x.email || '').trim().toLowerCase() === normalizedEmail && String(x.senha || '') === String(senha));
  if (!found) return res.status(401).json({ error: 'invalid credentials' });
  const displayNameCsv = ((found.nome || found.name) || '').trim();
  return res.json({ success: true, user: { id: found.id, email: found.email, name: displayNameCsv, nome: displayNameCsv } });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Verify current password (for profile password changes)
app.post('/api/auth/verify-password', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: 'email and senha required' });
  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    if (pgClient) {
      const selectCols = [`${userPasswordColumn} as password_hash`];
      const r = await pgClient.query(`SELECT ${selectCols.join(', ')} FROM users WHERE lower(email) = $1`, [normalizedEmail]);
      if (r.rowCount === 0) return res.status(401).json({ error: 'invalid credentials' });
      const u = r.rows[0];
      if (!u.password_hash || !verifyPassword(senha, u.password_hash)) return res.status(401).json({ error: 'invalid credentials' });
      return res.json({ success: true });
    }
    // Try Supabase REST fallback if configured
    if(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY){
      try{
        const user = await loginUserRest(normalizedEmail, senha);
        if(user) return res.json({ success: true });
      }catch(e){
        console.warn('Supabase REST verify-password failed:', e && e.message ? e.message : e);
      }
    }
    // Fallback CSV/local
    const users = (csvData.users || []).concat([]);
    const found = users.find(x => String(x.email || '').trim().toLowerCase() === normalizedEmail && String(x.senha || '') === String(senha));
    if (!found) return res.status(401).json({ error: 'invalid credentials' });
    return res.json({ success: true });
  } catch (err) {
    console.error('Verify password error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Link an existing site account (email+senha) to an OAuth/Supabase auth id.
// Expected: frontend includes Authorization: Bearer <supabase_access_token> representing the OAuth login
// and body { email, senha } where email is the existing account email on the site.
// Behavior: verify the supabase token, verify the provided senha against the users row
// and update users.auth_id = <supabaseUser.id>. Falls back to Supabase REST when Postgres is not available.
app.post('/api/auth/link-account', async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) return res.status(400).json({ error: 'email and senha required' });
    // Try to obtain a provider identity from the Authorization header.
    // Prefer Supabase token first, then fallback to Firebase ID token when available.
    let supaUser = await getSupabaseUserFromReq(req);
    // Lazy-init Firebase Admin if present in env to support Firebase ID token verification
    tryInitFirebaseAdmin();
    if (!supaUser && firebaseAdmin) {
      try {
        const authHeader = req.headers.authorization || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (idToken) {
          try {
            const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
            if (decoded && decoded.uid) {
              supaUser = { id: decoded.uid, email: decoded.email || null, provider: 'firebase' };
            }
          } catch (e) {
            // ignore Firebase verify errors here; we'll handle missing provider below
          }
        }
      } catch (e) { /* ignore */ }
    }
    if (!supaUser || !supaUser.id) return res.status(401).json({ error: 'invalid or missing provider access token' });
    const supaId = supaUser.id;
    // Normalize emails
    const providerEmail = supaUser.email ? String(supaUser.email).trim().toLowerCase() : null;
    const requestedEmail = String(email).trim().toLowerCase();
    // The email we will actually attempt to link (may be the requestedEmail or auto-switched to providerEmail)
    let normalizedEmail = requestedEmail;

    // If provider token contains an email that differs from the provided email, try a secure auto-match:
    //  - If a local account exists for the provider email, verify the provided senha against that account.
    //  - If password verifies, link that account (providerEmail) instead of the requestedEmail.
    // This keeps the flow secure (requires knowledge of the local password) while avoiding manual copy/paste mistakes.
    if (providerEmail && providerEmail !== requestedEmail) {
      try { pushLinkAudit({ stage: 'provider-email-mismatch', requestedEmail, providerEmail }); } catch(e){}
      // First: if the caller supplied the password for the requestedEmail, allow linking the provider to that requestedEmail
      // (user proved ownership by providing the local password). If that verifies, we'll continue with normalizedEmail = requestedEmail.
      if (pgClient) {
        try {
          const selReq = await pgClient.query(`SELECT id, email, ${userPasswordColumn} as password_hash, auth_id FROM users WHERE lower(email) = $1 LIMIT 1`, [requestedEmail]);
          if (selReq.rowCount > 0) {
            const reqRow = selReq.rows[0];
            if (reqRow.password_hash && verifyPassword(senha, reqRow.password_hash)) {
              // Password matches the requestedEmail account: proceed to link that account
              normalizedEmail = requestedEmail;
              pushLinkAudit({ stage: 'requested-email-password-match', requestedEmail, providerEmail, userId: reqRow.id });
              // skip provider-email auto-match logic
            }
          }
        } catch (e) {
          console.error('link-account: requested-email verify pg error', e && e.message ? e.message : e);
          pushLinkAudit({ stage: 'requested-email-pg-exception', requestedEmail, error: e && e.message ? e.message : String(e) });
          return res.status(500).json({ error: 'internal error' });
        }
      } else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const matchedReq = await loginUserRest(requestedEmail, senha);
          if (matchedReq) {
            normalizedEmail = requestedEmail;
            pushLinkAudit({ stage: 'requested-email-password-match-rest', requestedEmail, providerEmail, userId: matchedReq.id });
          }
        } catch (e) {
          console.error('link-account: requested-email auto-verify rest error', e && e.message ? e.message : e);
          pushLinkAudit({ stage: 'requested-email-rest-exception', requestedEmail, error: e && e.message ? e.message : String(e) });
          return res.status(500).json({ error: 'internal error' });
        }
      }

      // If normalizedEmail is still the requestedEmail and password matched above, skip provider-email auto-match.
      if (normalizedEmail !== requestedEmail) {
        // If Postgres is available, check the providerEmail account and verify provided senha against it
        if (pgClient) {
          try {
            const selProv = await pgClient.query(`SELECT id, email, ${userPasswordColumn} as password_hash, auth_id FROM users WHERE lower(email) = $1 LIMIT 1`, [providerEmail]);
            if (selProv.rowCount === 0) {
              pushLinkAudit({ stage: 'provider-email-no-local', providerEmail, requestedEmail });
              return res.status(400).json({ error: 'provider token email does not match provided email', providerEmail });
            }
            const provRow = selProv.rows[0];
            if (!provRow.password_hash || !verifyPassword(senha, provRow.password_hash)) {
              pushLinkAudit({ stage: 'provider-email-password-mismatch', providerEmail, requestedEmail, userId: provRow.id });
              return res.status(401).json({ error: 'invalid credentials for account matching provider email', providerEmail });
            }
            // Password matches the account that owns the provider email: switch to that account and continue
            normalizedEmail = providerEmail;
            pushLinkAudit({ stage: 'provider-email-auto-match', providerEmail, requestedEmail, userId: provRow.id });
          } catch (e) {
            console.error('link-account: provider-email auto-match pg error', e && e.message ? e.message : e);
            pushLinkAudit({ stage: 'provider-email-pg-exception', providerEmail, error: e && e.message ? e.message : String(e) });
            return res.status(500).json({ error: 'internal error' });
          }
        } else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          // Use Supabase REST fallback to validate credentials for providerEmail
          try {
            const matched = await loginUserRest(providerEmail, senha);
            if (!matched) {
              pushLinkAudit({ stage: 'provider-email-rest-no-match', providerEmail, requestedEmail });
              return res.status(401).json({ error: 'invalid credentials for account matching provider email', providerEmail });
            }
            normalizedEmail = providerEmail;
            pushLinkAudit({ stage: 'provider-email-auto-match-rest', providerEmail, requestedEmail, userId: matched.id });
          } catch (e) {
            console.error('link-account: provider-email auto-match rest error', e && e.message ? e.message : e);
            pushLinkAudit({ stage: 'provider-email-rest-exception', providerEmail, error: e && e.message ? e.message : String(e) });
            return res.status(500).json({ error: 'internal error' });
          }
        } else {
          // No DB available to validate the provider email account -> cannot safely auto-match
          pushLinkAudit({ stage: 'provider-email-mismatch-no-db', providerEmail, requestedEmail });
          return res.status(400).json({ error: 'provider token email does not match provided email' });
        }
      }
    }

  console.info(`link-account: request for email=${String(email).toLowerCase()} providerId=${supaUser && supaUser.id ? supaUser.id : '<none>'} pgClient=${!!pgClient}`);
  // record audit
  try { pushLinkAudit({ stage: 'received', email: String(email).toLowerCase(), providerId: supaUser && supaUser.id ? supaUser.id : null, pgClient: !!pgClient }); } catch(e){}
    // If Postgres is available, verify password and set auth_id there.
    if (pgClient) {
      try {
        // select password hash and id and current auth_id
        const sel = await pgClient.query(`SELECT id, email, ${userPasswordColumn} as password_hash, auth_id FROM users WHERE lower(email) = $1 LIMIT 1`, [normalizedEmail]);
        if (sel.rowCount === 0) {
          pushLinkAudit({ stage: 'pg-no-local', email: normalizedEmail });
          return res.status(404).json({ error: 'no local account with provided email' });
        }
        const row = sel.rows[0];
        if (!row.password_hash || !verifyPassword(senha, row.password_hash)) {
          pushLinkAudit({ stage: 'pg-invalid-credentials', email: normalizedEmail, userId: row && row.id ? row.id : null });
          return res.status(401).json({ error: 'invalid credentials' });
        }
        if (row.auth_id && String(row.auth_id) !== String(supaId)) {
          console.warn(`link-account: conflict - existing auth_id=${row.auth_id} for user=${row.id}`);
          pushLinkAudit({ stage: 'pg-conflict', email: normalizedEmail, userId: row.id, existingAuthId: row.auth_id });
          return res.status(409).json({ error: 'account already linked to different auth id' });
        }
        // all good: set auth_id
        try {
          await pgClient.query('UPDATE users SET auth_id = $1, atualizado_em = now() WHERE id = $2', [supaId, row.id]);
        } catch (e) {
          console.warn('link-account: failed to update users.auth_id', e && e.message ? e.message : e);
          pushLinkAudit({ stage: 'pg-update-failed', email: normalizedEmail, userId: row.id, error: e && e.message ? e.message : String(e) });
          return res.status(500).json({ error: 'failed to link account' });
        }
        console.log(`link-account: linked local user ${row.id} to provider id ${supaId}`);
        pushLinkAudit({ stage: 'pg-success', email: normalizedEmail, userId: row.id, linkedTo: supaId });
        return res.json({ success: true, id: row.id, linkedTo: supaId });
      } catch (e) {
        console.error('link-account error (pg):', e && e.message ? e.message : e);
        pushLinkAudit({ stage: 'pg-exception', email: normalizedEmail, error: e && e.message ? e.message : String(e) });
        return res.status(500).json({ error: 'internal error' });
      }
    }

    // If Postgres is not available, try Supabase REST fallback: verify password via loginUserRest and then PATCH user row to set auth_id
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        console.info('link-account: pgClient not available, attempting Supabase REST fallback');
        const matched = await loginUserRest(normalizedEmail, senha);
        if (!matched) {
          console.info('link-account: REST fallback did not find matching user or password invalid');
          pushLinkAudit({ stage: 'rest-no-match', email: normalizedEmail });
          return res.status(401).json({ error: 'invalid credentials' });
        }
        // matched contains id (row id). Update via REST
        try {
          const updated = await updateUserRest({ id: matched.id, nome: undefined, email: undefined, celular: undefined, novaSenha: undefined, passwordColumn: userPasswordColumn });
          // updateUserRest doesn't currently support auth_id set; perform direct REST PATCH for auth_id
        } catch (e) {
          // ignore: we'll attempt explicit PATCH below
        }
        // PATCH to set auth_id using PostgREST
        const base = process.env.SUPABASE_URL.replace(/\/$/, '');
        const url = `${base}/rest/v1/users?id=eq.${encodeURIComponent(String(matched.id))}`;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const patchBody = { auth_id: supaId };
  console.info('link-account: attempting REST PATCH to set auth_id for users.id=', matched.id);
  pushLinkAudit({ stage: 'rest-patch', email: normalizedEmail, usersId: matched.id, providerId: supaId });
        const resp = await fetch(url, {
          method: 'PATCH',
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify(patchBody)
        });
        const text = await resp.text();
        if (!resp.ok) {
          try { const j = JSON.parse(text); console.warn('link-account REST patch failed:', j); pushLinkAudit({ stage: 'rest-patch-failed', email: normalizedEmail, usersId: matched.id, status: resp.status, body: j }); } catch(e) { console.warn('link-account REST patch failed, status', resp.status, 'text', text); pushLinkAudit({ stage: 'rest-patch-failed', email: normalizedEmail, usersId: matched.id, status: resp.status, body: text }); }
          return res.status(500).json({ error: 'failed to link via REST' });
        }
        try { const j = JSON.parse(text); console.info('link-account REST patch succeeded', j && j[0] ? j[0].id : matched.id); pushLinkAudit({ stage: 'rest-success', email: normalizedEmail, usersId: matched.id, updatedRow: j && j[0] ? j[0] : null }); return res.json({ success: true, id: matched.id, linkedTo: supaId, updatedRow: j[0] }); } catch(e) { console.info('link-account REST patch succeeded for id', matched.id); pushLinkAudit({ stage: 'rest-success', email: normalizedEmail, usersId: matched.id }); return res.json({ success: true, id: matched.id, linkedTo: supaId }); }
      } catch (e) {
        console.error('link-account REST fallback failed:', e && e.message ? e.message : e);
        pushLinkAudit({ stage: 'rest-exception', email: normalizedEmail, error: e && e.message ? e.message : String(e) });
        return res.status(500).json({ error: 'internal error' });
      }
    }

    return res.status(503).json({ error: 'no database available to perform link' });
  } catch (err) {
    console.error('link-account unexpected error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// ============ NOVOS ENDPOINTS PARA MIGRAÇÃO DB ============

// Endpoints de Guias
app.get('/api/guias', async (req, res) => {
  if(pgClient){
    try{
      const result = await pgClient.query('SELECT * FROM guias WHERE status = $1 ORDER BY criado_em DESC', ['ativo']);
      // Map snake_case DB columns to camelCase keys expected by frontend
      const mapped = result.rows.map(row => {
        const r = snakeToCamelKeys(row);
        // also normalize nested JSON fields if any (keep as-is for now)
        return r;
      });
      return res.json(mapped);
    }catch(err){ console.error('PG query failed /api/guias:', err.message); }
  }
  // Fallback para JSON local
  const guiasPath = path.join(__dirname, '..', 'data', 'guias.json');
  if(fs.existsSync(guiasPath)){
    const guias = JSON.parse(fs.readFileSync(guiasPath, 'utf8'));
    return res.json(guias);
  }
  res.json([]);
});

// Note: temporary debug endpoints removed. Use normal /api/guias and server logs for diagnosis.

app.post('/api/guias', async (req, res) => {
  const guia = req.body;
  // Log minimal info about incoming payload (avoid writing debug files in production)
  try {
    console.info('Received POST /api/guias id=%s autor=%s', guia && guia.id ? guia.id : '(no-id)', guia && guia.autorEmail ? guia.autorEmail : '(no-author)');
  } catch(e) { console.warn('Failed to log incoming guia payload:', e && e.message ? e.message : e); }
  if(pgClient){
    try{
      const id = guia.id || `guia_${Date.now()}`;
      const insertSql = `INSERT INTO guias(id, autor_email, titulo, descricao, categoria, conteudo, imagem, criado_em, atualizado_em, status)
         VALUES($1, $2, $3, $4, $5, $6, $7, now(), now(), $8) RETURNING *`;
      const result = await pgClient.query(insertSql, [id, guia.autorEmail, guia.titulo, guia.descricao, guia.categoria, guia.conteudo, guia.imagem || null, guia.status || 'ativo']);
      const created = result.rows && result.rows[0] ? snakeToCamelKeys(result.rows[0]) : { id };
      return res.json({ success: true, id, guia: created });
    }catch(err){ 
      console.error('Error creating guia:', err.message); 
      return res.status(500).json({ error: err.message }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

// Debug logs file endpoint removed.

app.put('/api/guias/:id', async (req, res) => {
  const { id } = req.params;
  const guia = req.body;
  if(pgClient){
    try{
      await pgClient.query(
        `UPDATE guias SET titulo=$1, descricao=$2, categoria=$3, conteudo=$4, imagem=$5, atualizado_em=now() WHERE id=$6`,
        [guia.titulo, guia.descricao, guia.categoria, guia.conteudo, guia.imagem, id]
      );
      return res.json({ success: true });
    }catch(err){ 
      console.error('Error updating guia:', err.message); 
      return res.status(500).json({ error: err.message }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

app.delete('/api/guias/:id', async (req, res) => {
  const { id } = req.params;
  if(pgClient){
    try{
      await pgClient.query('UPDATE guias SET status=$1 WHERE id=$2', ['inativo', id]);
      return res.json({ success: true });
    }catch(err){ 
      console.error('Error deleting guia:', err.message); 
      return res.status(500).json({ error: err.message }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

// Adicionar avaliação a um guia: aceita { userEmail, rating }
app.post('/api/guias/:id/ratings', async (req, res) => {
  const { id } = req.params;
  const { userEmail, rating } = req.body || {};
  if (!userEmail || typeof rating !== 'number') {
    return res.status(400).json({ error: 'userEmail and numeric rating are required' });
  }

  if (pgClient) {
    try {
      // Prefer normalized storage: insert/update into guia_ratings table
      const upsertSql = `
        INSERT INTO guia_ratings (guia_id, user_email, rating, comment, created_at)
        VALUES ($1, $2, $3, $4, now())
        ON CONFLICT (guia_id, user_email) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
        RETURNING *
      `;
      await pgClient.query(upsertSql, [id, userEmail, rating, null]);

      // Return aggregate info (total count and average) and optionally guia info
      const agg = await pgClient.query('SELECT COUNT(*)::int AS total, COALESCE(AVG(rating)::numeric, 0) AS average FROM guia_ratings WHERE guia_id = $1', [id]);
      const total = agg.rows[0] ? agg.rows[0].total : 0;
      const average = agg.rows[0] ? Number(agg.rows[0].average) : 0;
      return res.json({ success: true, guiaId: id, ratings: { total, average } });
    } catch (err) {
      console.error('Error adding rating to guia:', err && err.message ? err.message : err);
      return res.status(500).json({ error: err && err.message ? err.message : String(err) });
    }
  }

  return res.status(500).json({ error: 'Database not available' });
});

// Alternative ratings endpoint that accepts guiaId in the request body.
// Some clients (or older frontends) may POST to /api/guias/ratings with { guiaId, userEmail, rating }.
app.post('/api/guias/ratings', async (req, res) => {
  const { guiaId, userEmail, rating } = req.body || {};
  if (!guiaId || !userEmail || typeof rating !== 'number') {
    return res.status(400).json({ error: 'guiaId, userEmail and numeric rating are required' });
  }

  // Reuse same logic as the path-based handler
  if (pgClient) {
    try {
      const result = await pgClient.query('SELECT ratings FROM guias WHERE id = $1', [guiaId]);
      const existing = result && result.rows && result.rows[0] ? result.rows[0].ratings || [] : [];
      const filtered = (existing || []).filter(r => String(r.userEmail || '').toLowerCase() !== String(userEmail).toLowerCase());
      const novo = { userEmail, rating, timestamp: new Date().toISOString() };
      filtered.push(novo);
      const upd = await pgClient.query('UPDATE guias SET ratings = $1 WHERE id = $2 RETURNING *', [JSON.stringify(filtered), guiaId]);
      const updated = upd && upd.rows && upd.rows[0] ? snakeToCamelKeys(upd.rows[0]) : null;
      return res.json({ success: true, guia: updated });
    } catch (err) {
      console.error('Error adding rating to guia (body-based):', err && err.message ? err.message : err);
      return res.status(500).json({ error: err && err.message ? err.message : String(err) });
    }
  }

  return res.status(500).json({ error: 'Database not available' });
});

// TEMP DEBUG: check DB connection and quick guias sampling
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/check-guia-db', async (req, res) => {
    try {
      const status = { pgClient: !!pgClient };
      if (!pgClient) return res.json({ ...status, msg: 'pgClient not available' });

      const countRes = await pgClient.query('SELECT count(*) as cnt FROM guias');
      const cnt = countRes && countRes.rows && countRes.rows[0] ? Number(countRes.rows[0].cnt) : null;
      const sample = await pgClient.query('SELECT id, autor_email, titulo, status, criado_em FROM guias ORDER BY criado_em DESC LIMIT 10');
      return res.json({ ...status, count: cnt, sample: sample.rows });
    } catch (err) {
      console.error('debug check-guia-db failed:', err && err.message ? err.message : err);
      return res.status(500).json({ error: err && err.message ? err.message : String(err) });
    }
  });
}

// Temporary debug: return user row for given email (safe only for local/dev).
// SOLUÇÃO DEFINITIVA - Corrige TODOS os problemas de sincronização
app.post('/api/debug/fix-sync-now', async (req, res) => {
  try {
    const results = { 
      fixes: [],
      errors: [],
      finalState: {},
      success: false
    };
    
    // 1. CORRIGIR NOME - Atualizar para capitalizado no banco
    if (pgClient) {
      try {
        const nameFixQuery = `
          UPDATE users 
          SET nome = 'Lúcio Freitas', atualizado_em = now()
          WHERE LOWER(email) = 'luciodfp@gmail.com'
        `;
        const nameFixResult = await pgClient.query(nameFixQuery);
        results.fixes.push(`Nome corrigido para ${nameFixResult.rowCount} usuário(s)`);
      } catch (e) {
        results.errors.push('Erro ao corrigir nome: ' + e.message);
      }
      
      // 2. GARANTIR INTEGRIDADE DOS CARROS
      try {
        // Verificar se há carros órfãos ou duplicados
        const carIntegrityQuery = `
          SELECT 
            (SELECT COUNT(*) FROM cars WHERE user_id = 'BpIVI83MOqfqEJdCgDKYSjDpNZr1') as main_user_cars,
            (SELECT COUNT(*) FROM cars c WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.user_id)) as orphan_cars,
            (SELECT COUNT(DISTINCT user_id) FROM cars) as unique_car_owners
        `;
        const integrityResult = await pgClient.query(carIntegrityQuery);
        const integrity = integrityResult.rows[0];
        
        results.finalState = {
          mainUserCars: integrity.main_user_cars,
          orphanCars: integrity.orphan_cars,
          uniqueCarOwners: integrity.unique_car_owners
        };
        
        // Se não há carros no usuário principal, mas há carros órfãos, migrar todos
        if (integrity.main_user_cars === '0' && integrity.orphan_cars > 0) {
          const migrateOrphansQuery = `
            UPDATE cars 
            SET user_id = 'BpIVI83MOqfqEJdCgDKYSjDpNZr1'
            WHERE user_id NOT IN (SELECT id FROM users)
          `;
          const migrateResult = await pgClient.query(migrateOrphansQuery);
          results.fixes.push(`${migrateResult.rowCount} carros órfãos migrados`);
        }
        
        results.fixes.push('Integridade dos carros verificada');
      } catch (e) {
        results.errors.push('Erro ao verificar carros: ' + e.message);
      }
    } else {
      results.errors.push('PostgreSQL não disponível');
    }
    
    // 3. FORÇAR CACHE REFRESH (limpar possíveis caches do frontend)
    results.cacheRefresh = {
      timestamp: Date.now(),
      instructions: 'Execute localStorage.clear() no console do navegador'
    };
    
    results.success = results.errors.length === 0;
    return res.json(results);
    
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Debug endpoint to check all cars in database
app.get('/api/debug/all-cars', async (req, res) => {
  try {
    if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });
    
    const result = await pgClient.query(`
      SELECT c.*, u.email as user_email, u.nome as user_name
      FROM cars c 
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    
    return res.json({ 
      cars: result.rows,
      total: result.rowCount 
    });
  } catch (err) {
    console.error('Debug all-cars error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to check duplicate users
app.get('/api/debug/users-by-email', async (req, res) => {
  try {
    const email = req.query.email && String(req.query.email).trim();
    if (!email) return res.status(400).json({ error: 'email query required' });
    if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });
    
    const result = await pgClient.query(`
      SELECT id, email, auth_id, criado_em, nome,
             (SELECT COUNT(*) FROM cars WHERE user_id = users.id) as car_count
      FROM users 
      WHERE LOWER(email) = LOWER($1)
      ORDER BY auth_id IS NOT NULL DESC, criado_em ASC
    `, [email]);
    
    return res.json({ 
      email, 
      users: result.rows,
      total: result.rowCount 
    });
  } catch (err) {
    console.error('Debug users-by-email error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Use: GET /api/debug/user-by-email?email=seu@exemplo.com
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/user-by-email', async (req, res) => {
    try {
      const email = req.query.email && String(req.query.email).trim();
      if (!email) return res.status(400).json({ error: 'email query required' });
      if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });
      const cols = ['id', 'email', 'photo_url'];
      if (userHasAuthId) cols.push('auth_id');
      // Detect optional phone column (celular, telefone, phone) and include it if present
      try {
        const colsInfo = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
        const names = (colsInfo.rows || []).map(r => String(r.column_name).toLowerCase());
        const phoneCandidates = ['celular', 'telefone', 'phone'];
        const phoneCol = phoneCandidates.find(c => names.indexOf(c) >= 0) || null;
        if (phoneCol) cols.push(phoneCol);
      } catch (e) { /* ignore detection errors */ }
      cols.push(userPasswordColumn + ' as password_hash');
      const q = `SELECT ${cols.join(', ')} FROM users WHERE lower(email) = lower($1) LIMIT 1`;
      const r = await pgClient.query(q, [email]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
      const row = r.rows[0];
      return res.json({ ok: true, row });
    } catch (e) {
      console.error('/api/debug/user-by-email failed', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'internal' });
    }
  });

  // Dev-only: generate a temporary reset token and a temporary password for an email.
  // Returns the token and tempPassword in the response (for local development only).
  // Use: POST /api/debug/dev-generate-reset  { email: '...' }
  app.post('/api/debug/dev-generate-reset', async (req, res) => {
    try {
      if (!isDebugRequest(req)) return res.status(403).json({ error: 'forbidden' });
      const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : null;
      if (!email) return res.status(400).json({ error: 'email required' });
      if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });
      const cols = ['id', 'email'];
      const q = `SELECT ${cols.join(', ')} FROM users WHERE lower(email) = lower($1) LIMIT 1`;
      const r = await pgClient.query(q, [email]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
      const row = r.rows[0];
      const token = crypto.randomBytes(16).toString('hex');
      const tempPassword = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0,10) || 'devTemp1';
      const expiresAt = Date.now() + (1000 * 60 * 15); // 15 minutes
      pushDebugResetToken(token, { email: row.email, tempPassword, expiresAt, id: row.id });
      return res.json({ ok: true, token, tempPassword, expiresAt });
    } catch (e) {
      console.error('/api/debug/dev-generate-reset failed', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'internal' });
    }
  });

  // Public endpoint to reset password using a token (works in dev when token was generated).
  // Use: POST /api/auth/reset-password { token: '...', novaSenha: '...' }
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const token = req.body && req.body.token ? String(req.body.token).trim() : null;
      const novaSenha = req.body && req.body.novaSenha ? String(req.body.novaSenha) : null;
      if (!token || !novaSenha) return res.status(400).json({ error: 'token and novaSenha required' });
      const info = debugResetTokens.get(token);
      if (!info) return res.status(400).json({ error: 'invalid token' });
      if (info.expiresAt < Date.now()) { debugResetTokens.delete(token); return res.status(400).json({ error: 'token expired' }); }
      // Find user by id if present
      const userId = info.id;
      if (!userId) return res.status(400).json({ error: 'invalid token payload' });
      // Update password either via Postgres or Supabase REST fallback
      try {
        if (pgClient) {
          const hashed = hashPassword(novaSenha);
          const col = userPasswordColumn || 'password_hash';
          const upd = `UPDATE users SET ${col} = $1, atualizado_em = now() WHERE id = $2 RETURNING id, email`;
          const r = await pgClient.query(upd, [hashed, userId]);
          if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
          debugResetTokens.delete(token);
          return res.json({ ok: true, id: r.rows[0].id, email: r.rows[0].email });
        } else {
          // Supabase REST fallback
          try {
            const updated = await updateUserRest({ id: userId, novaSenha });
            debugResetTokens.delete(token);
            return res.json({ ok: true, id: updated && updated.id, email: updated && updated.email });
          } catch (e) {
            console.error('reset-password updateUserRest failed', e && e.message ? e.message : e);
            return res.status(500).json({ error: 'update failed' });
          }
        }
      } catch (e) {
        console.error('/api/auth/reset-password failed', e && e.message ? e.message : e);
        return res.status(500).json({ error: 'internal' });
      }
    } catch (e) {
      console.error('/api/auth/reset-password outer failed', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'internal' });
    }
  });
}

// Temporary debug helper: echo headers and body when X-Debug-Key is provided.
// This endpoint is intentionally minimal and should be removed after diagnosis.
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/debug/echo-headers', (req, res) => {
    try {
      const key = String(req.headers['x-debug-key'] || '');
      if (key !== 'let-me-debug') return res.status(403).json({ error: 'forbidden' });
      // Return headers and parsed JSON body for debugging
      return res.json({ headers: req.headers, body: req.body });
    } catch (e) {
      return res.status(500).json({ error: 'internal' });
    }
  });
}

// Debug: check DB connectivity from the running backend.
// This endpoint is disabled in production unless ALLOW_DEBUG=true is set in env.
app.get('/api/debug/check-db-conn', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && String(process.env.ALLOW_DEBUG || '').toLowerCase() !== 'true') {
      return res.status(403).json({ error: 'debug disabled in production' });
    }
    const dns = require('dns');
    const net = require('net');
    const url = process.env.DATABASE_URL || '';
    let host = req.query.host || null;
    let port = req.query.port || 5432;
    if (!host) {
      // parse from DATABASE_URL: postgres://user:pass@host:port/db
      try {
        const m = String(url).match(/@([^:\/]+)(?::(\d+))?/);
        if (m) { host = m[1]; if (m[2]) port = parseInt(m[2], 10); }
      } catch (e) { /* ignore */ }
    }
    if (!host) return res.status(400).json({ error: 'no host available to test' });

    // Resolve DNS
    const resolve = await new Promise((resolveP) => {
      dns.lookup(host, { all: true }, (err, addresses) => {
        if (err) return resolveP({ ok: false, error: String(err) });
        return resolveP({ ok: true, addresses });
      });
    });

    // Attempt TCP connect with timeout
    const connectResult = await new Promise((resolveP) => {
      const socket = new net.Socket();
      let done = false;
      const tid = setTimeout(() => {
        if (done) return;
        done = true;
        try { socket.destroy(); } catch (e) {}
        resolveP({ ok: false, error: 'timeout' });
      }, 4000);
      socket.once('error', (err) => {
        if (done) return;
        done = true; clearTimeout(tid);
        resolveP({ ok: false, error: String(err && err.code ? err.code : err) });
      });
      socket.connect({ host, port: Number(port) }, () => {
        if (done) return;
        done = true; clearTimeout(tid);
        try { socket.end(); } catch (e) {}
        resolveP({ ok: true });
      });
    });

    return res.json({ host, port: Number(port), resolve, connect: connectResult, pgClientAlive: !!pgClient });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// Endpoints de Carros do Usuário - VERSÃO AUTOMÁTICA

// NOVO ENDPOINT COMPLETAMENTE AUTOMÁTICO
app.get('/api/users/:userId/cars-auto', async (req, res) => {
  const { userId } = req.params;
  console.log(`🚗 FULLY-AUTO SEARCH: userId=${userId}`);
  
  if(pgClient){
    try{
      // BUSCA 100% AUTOMÁTICA - Pega TODOS os carros relacionados sem verificações manuais
      const autoQuery = `
        WITH user_data AS (
          -- Pega todos os dados do usuário solicitado
          SELECT id, email, auth_id FROM users 
          WHERE id = $1 OR auth_id = $1 
          LIMIT 1
        ),
        related_users AS (
          -- Encontra TODOS os usuários relacionados (mesmo email)
          SELECT DISTINCT u.id, u.email, u.auth_id 
          FROM users u, user_data ud
          WHERE u.id = ud.id 
             OR u.auth_id = ud.id
             OR u.id = ud.auth_id
             OR u.auth_id = ud.auth_id
             OR (u.email IS NOT NULL AND ud.email IS NOT NULL AND LOWER(u.email) = LOWER(ud.email))
        ),
        all_possible_cars AS (
          -- Busca carros por QUALQUER critério automaticamente
          SELECT DISTINCT c.* FROM cars c
          WHERE c.user_id IN (SELECT id FROM related_users)
             OR c.user_id IN (SELECT auth_id FROM related_users WHERE auth_id IS NOT NULL)
             OR c.user_id = $1  -- Busca direta também
        )
        SELECT * FROM all_possible_cars ORDER BY created_at DESC
      `;
      
      const result = await pgClient.query(autoQuery, [userId]);
      console.log(`🚗 FULLY-AUTO: Found ${result.rowCount} cars completely automatically`);
      
      return res.json(result.rows);
      
    } catch(err) {
      console.error('❌ Fully-auto search failed:', err.message);
      console.error('❌ Full error:', err);
      console.error('❌ Stack:', err.stack);
      return res.json([]); // Nunca falha - sempre retorna resultado
    }
  }
  
  console.log('⚠️ pgClient not available, returning empty array');
  return res.json([]);
});

app.get('/api/users/:userId/cars', async (req, res) => {
  const { userId } = req.params;
  console.log(`🚗 AUTO-UNIFIED SEARCH: userId=${userId}`);
  
  if(pgClient){
    try{
      // BUSCA AUTOMÁTICA UNIFICADA - Uma única query que pega TODOS os carros
      const unifiedQuery = `
        WITH user_variants AS (
          SELECT DISTINCT u.id as user_id, u.email, u.auth_id
          FROM users u
          WHERE u.id = $1 OR u.auth_id = $1 
             OR (u.email IS NOT NULL AND LOWER(u.email) = (
                 SELECT LOWER(email) FROM users 
                 WHERE (id = $1 OR auth_id = $1) AND email IS NOT NULL
                 LIMIT 1
               ))
        ),
        all_cars AS (
          SELECT DISTINCT c.*
          FROM cars c
          JOIN user_variants uv ON (c.user_id = uv.user_id OR c.user_id = uv.auth_id)
          
          UNION
          
          SELECT DISTINCT c.*
          FROM cars c
          WHERE c.user_id IN (
            SELECT u2.id FROM users u2
            JOIN user_variants uv ON LOWER(u2.email) = LOWER(uv.email)
            WHERE uv.email IS NOT NULL
          )
        )
        SELECT * FROM all_cars ORDER BY created_at DESC
      `;
      
      const result = await pgClient.query(unifiedQuery, [userId]);
      console.log(`🚗 AUTO-UNIFIED: Found ${result.rowCount} cars automatically`);
      
      // Query unificada já buscou por TODOS os critérios automaticamente
      if (result.rowCount === 0) {
        console.log(`🔍 NO CARS: Trying alternative searches for userId=${userId}`);
        
        // Busca unificada automática já executou todos os critérios
        
        // Try 2: Search by email (find all cars for users with same email)
        try {
          const emailResult = await pgClient.query(`
            SELECT c.* FROM cars c 
            JOIN users u1 ON c.user_id = u1.id 
            WHERE LOWER(u1.email) = (SELECT LOWER(email) FROM users WHERE id = $1 OR auth_id = $1 LIMIT 1)
            ORDER BY c.created_at DESC
          `, [userId]);
          console.log(`� EMAIL SEARCH: Found ${emailResult.rowCount} cars`);
          if (emailResult.rowCount > 0) return res.json(emailResult.rows);
        } catch (e) {
          console.warn('Email search failed:', e.message);
        }
      }
      
      return res.json(result.rows);
    }catch(err){ 
      // Log full error (stack when available) to aid debugging in production
      try { console.error('PG query failed /api/users/:userId/cars:', err && (err.stack || err.message || JSON.stringify(err))); } catch(e) { console.error('PG query failed and error logging also failed'); }
      return res.status(500).json({ error: err && (err.message || String(err)) });
    }
  }
  console.log(`🚗 GET CARS: No pgClient, returning empty array`);
  res.json([]);
});

// ENDPOINT AUTOMÁTICO PARA ADICIONAR CARROS
app.post('/api/users/:userId/cars-auto', async (req, res) => {
  const { userId } = req.params;
  const car = req.body;
  console.log(`🚗 AUTO-ADD CAR: userId=${userId}, car=`, JSON.stringify(car));
  
  if(pgClient){
    try{
      // Adiciona carro automaticamente sem verificações complexas
      // Generate unique ID for the car
      const carId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Convert ano to integer if it's a string
      const anoValue = car.year || car.ano;
      const anoInt = anoValue ? parseInt(anoValue, 10) : null;
      
      console.log(`🚗 Attempting INSERT: id=${carId}, user_id=${userId}, marca=${car.brand || car.marca}, modelo=${car.model || car.modelo}, ano=${anoInt}`);
      
      const result = await pgClient.query(
        'INSERT INTO cars (id, user_id, marca, modelo, ano, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
        [carId, userId, car.brand || car.marca, car.model || car.modelo, anoInt]
      );
      
      console.log(`🚗 AUTO-ADDED: Car added successfully`, result.rows[0]);
      return res.json(result.rows[0]);
      
    } catch(err) {
      console.error('Auto-add car failed:', err.message);
      console.error('Full error:', err);
      return res.status(500).json({ error: 'Failed to add car automatically', details: err.message });
    }
  }
  
  console.error('🚗 AUTO-ADD FAILED: pgClient not available');
  return res.status(503).json({ error: 'Database not available' });
});

app.post('/api/users/:userId/cars', async (req, res) => {
  const { userId } = req.params;
  const car = req.body;
  // If Authorization header present, verify token and ensure token user id matches userId
  try {
    const tokenUser = await getSupabaseUserFromReq(req);
    if (req.headers.authorization && !tokenUser) return res.status(401).json({ error: 'invalid token' });
    if (tokenUser && tokenUser.id !== userId) return res.status(403).json({ error: 'forbidden' });
  } catch (e) {
    console.warn('auth check failed for POST /api/users/:userId/cars', e && e.message ? e.message : e);
  }
  if(pgClient){
    try{
      const id = car.id || `car_${Date.now()}`;
      await pgClient.query(
        `INSERT INTO cars(id, user_id, marca, modelo, ano, dados, created_at)
         VALUES($1, $2, $3, $4, $5, $6, now())`,
        [id, userId, car.marca, car.modelo, car.ano, JSON.stringify(car)]
      );
      return res.json({ success: true, id });
    }catch(err){ 
      console.error('Error creating car:', err.message); 
      return res.status(500).json({ error: err.message }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

app.put('/api/users/:userId/cars', async (req, res) => {
  const { userId } = req.params;
  const { cars } = req.body;
  try {
    const tokenUser = await getSupabaseUserFromReq(req);
    if (req.headers.authorization && !tokenUser) return res.status(401).json({ error: 'invalid token' });
    if (tokenUser && tokenUser.id !== userId) return res.status(403).json({ error: 'forbidden' });
  } catch (e) {
    console.warn('auth check failed for PUT /api/users/:userId/cars', e && e.message ? e.message : e);
  }
  if(pgClient){
    try{
      // Deletar carros antigos e inserir novos (batch update simplificado)
      await pgClient.query('DELETE FROM cars WHERE user_id = $1', [userId]);
      for(const car of cars){
        const id = car.id || `car_${Date.now()}_${Math.random()}`;
        await pgClient.query(
          `INSERT INTO cars(id, user_id, marca, modelo, ano, dados)
           VALUES($1, $2, $3, $4, $5, $6)`,
          [id, userId, car.marca, car.modelo, car.ano, JSON.stringify(car)]
        );
      }
      return res.json({ success: true });
    }catch(err){ 
      console.error('Error updating cars:', err.message); 
      return res.status(500).json({ error: err.message }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

// ENDPOINT AUTOMÁTICO PARA DELETAR CARROS
app.delete('/api/users/:userId/cars-auto/:carId', async (req, res) => {
  const { userId, carId } = req.params;
  console.log(`🗑️ AUTO-DELETE CAR: userId=${userId}, carId=${carId}`);
  
  if(pgClient){
    try{
      // EXCLUSÃO AUTOMÁTICA UNIFICADA - deleta o carro independente de onde estiver
      const deleteQuery = `
        WITH user_variants AS (
          -- Encontra todas as variantes do usuário
          SELECT DISTINCT u.id as user_id, u.email, u.auth_id
          FROM users u
          WHERE u.id = $1 OR u.auth_id = $1 
             OR (u.email IS NOT NULL AND LOWER(u.email) = (
                 SELECT LOWER(email) FROM users 
                 WHERE (id = $1 OR auth_id = $1) AND email IS NOT NULL
                 LIMIT 1
               ))
        )
        DELETE FROM cars 
        WHERE id = $2 
          AND (user_id IN (SELECT user_id FROM user_variants) 
               OR user_id IN (SELECT auth_id FROM user_variants WHERE auth_id IS NOT NULL)
               OR user_id = $1)
        RETURNING id
      `;
      
      const result = await pgClient.query(deleteQuery, [userId, carId]);
      console.log(`🗑️ AUTO-DELETE: Removed ${result.rowCount} cars automatically`);
      
      return res.json({ success: true, deletedCount: result.rowCount });
      
    }catch(err){ 
      console.error('Auto-delete car failed:', err.message);
      return res.status(500).json({ error: 'Failed to delete car automatically' });
    }
  }
  
  return res.status(503).json({ error: 'Database not available' });
});

app.delete('/api/users/:userId/cars/:carId', async (req, res) => {
  const { userId, carId } = req.params;
  try {
    const tokenUser = await getSupabaseUserFromReq(req);
    if (req.headers.authorization && !tokenUser) return res.status(401).json({ error: 'invalid token' });
    if (tokenUser && tokenUser.id !== userId) return res.status(403).json({ error: 'forbidden' });
  } catch (e) {
    console.warn('auth check failed for DELETE /api/users/:userId/cars/:carId', e && e.message ? e.message : e);
  }
  if(pgClient){
    try{
      await pgClient.query('DELETE FROM cars WHERE id = $1 AND user_id = $2', [carId, userId]);
      return res.json({ success: true });
    }catch(err){ 
      console.error('Error deleting car:', err.message); 
      return res.status(500).json({ error: err.message }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

// Endpoints de Pagamentos
app.post('/api/payments', async (req, res) => {
  const payment = req.body;
  if(pgClient){
    try{
      const result = await pgClient.query(
        `INSERT INTO payments(user_email, amount, currency, date, card_last4, status, metadata)
         VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          payment.userEmail, 
          payment.amount, 
          payment.currency || 'BRL', 
          payment.date || new Date(), 
          payment.cardLast4,
          payment.status || 'completed',
          JSON.stringify(payment.metadata || {})
        ]
      );
      return res.json({ success: true, id: result.rows[0].id });
    }catch(err){ 
      console.error('Error creating payment:', err.message); 
      return res.status(500).json({ error: err.message }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

app.get('/api/users/:userEmail/payments', async (req, res) => {
  const { userEmail } = req.params;
  if(pgClient){
    try{
      const result = await pgClient.query(
        'SELECT * FROM payments WHERE user_email = $1 ORDER BY date DESC', 
        [userEmail]
      );
      return res.json(result.rows);
    }catch(err){ console.error('PG query failed /api/users/:userEmail/payments:', err.message); }
  }
  res.json([]);
});

// Express JSON error handler (catch any thrown errors in routes)
app.use((err, req, res, next) => {
  console.error('Unhandled express error:', err && err.stack ? err.stack : err);
  if(res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// process-level handlers to avoid silent crashes
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && err.stack ? err.stack : err);
  // do not exit immediately in development; clear pgClient to avoid reuse
  try { pgClient = null; } catch(e){}
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
  try { pgClient = null; } catch(e){}
});

// Start server immediately (do not wait for Postgres) so Render can detect the open port.
const PORT = process.env.PORT || 3001;
(async () => {
  // Safe environment checks (do not print secrets). These help confirm which env vars
  // are available at runtime without exposing full keys in logs.
  try {
    console.log('ENV CHECK: DATABASE_URL_PRESENT=' + (!!process.env.DATABASE_URL));
    if (process.env.DATABASE_URL) console.log('ENV CHECK: DATABASE_URL_PREFIX=' + String(process.env.DATABASE_URL).slice(0,12));
    console.log('ENV CHECK: PGSSLMODE=' + (process.env.PGSSLMODE || process.env.PGSSLMODE || process.env.PGSSL || 'null'));
    console.log('ENV CHECK: SUPABASE_SERVICE_ROLE_KEY_PRESENT=' + (!!process.env.SUPABASE_SERVICE_ROLE_KEY));
    console.log('ENV CHECK: NODE_TLS_REJECT_UNAUTHORIZED=' + (process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'null'));
  } catch(e) {
    console.warn('ENV CHECK failed:', e && e.message ? e.message : e);
  }

  // Bind to 0.0.0.0 by default so platforms like Render can detect the open port.
  // Allow overriding by setting the HOST environment variable if needed.
  const HOST = process.env.HOST || '0.0.0.0';

  // Ensure PORT is a number when possible (some platforms provide it as string)
  const NUM_PORT = Number(process.env.PORT) || PORT;

  // Diagnostic logging was used during troubleshooting; keep env-checks above
  // and the normal startup log below.

  // Start listening immediately so PaaS port scanners can detect the open port.
  const server = app.listen(NUM_PORT, HOST, () => {
    console.log(`Parts API listening on http://${HOST}:${NUM_PORT} (pg=${pgClient?true:false})`);
    // server.address() logging removed (cleanup): server is listening
  });

  // Connect to Postgres without blocking server startup. If Postgres is unreachable
  // we'll log and leave pgClient null; routes already check pgClient before queries.
  (async () => {
    try {
      pgClient = await connectWithRetry(5);
      console.log('Postgres connected.');
    } catch (e) {
      console.error('Postgres: failed to connect after multiple attempts. Continuing without postgres (CSV fallback active).', e && e.message ? e.message : e);
    }
  })();

  // Optional: initialize Supabase Realtime subscription if env vars present
  try{
    const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if(SUPABASE_URL && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY)){
      try{
        const { initSupabaseRealtime } = require('./supabaseRealtime');
        initSupabaseRealtime({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, appEmitter: app });
      }catch(e){
        console.warn('Could not initialize supabase realtime module:', e && e.message ? e.message : e);
      }
    }
  }catch(e){/* ignore */}
})();

// Serve frontend build (if exists) - place after app.listen to ensure APIs are registered first
try{
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)){
    console.log('Serving static frontend from', distPath);
    // SECURITY: Do not expose raw source files from /src/ or serve .jsx files directly.
    // Some hosts or older build artifacts may accidentally expose .jsx with a non-JS MIME (text/jsx)
    // which breaks module loading in browsers. Deny direct requests to /src/* and any .jsx file.
    app.use((req, res, next) => {
      try {
        if (String(req.path || '').startsWith('/src/') || String(req.path || '').endsWith('.jsx')) {
          console.warn('Blocked request for source file or .jsx:', req.path);
          return res.status(404).send('Not Found');
        }
      } catch (e) { /* ignore */ }
      next();
    });

    // Ensure .jsx extension (if present in built assets) is served as application/javascript
    app.use((req, res, next) => {
      if (req.path && req.path.endsWith('.jsx')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      next();
    });

    app.use(express.static(distPath, {
      setHeaders: (res, filepath) => {
        if (filepath.endsWith('.jsx')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
      }
    }));

    // SPA fallback: serve index.html for any other GET request not handled by API
    app.get('*', (req, res) => {
      try{
        res.sendFile(path.join(distPath, 'index.html'));
      }catch(e){ res.status(500).send('error'); }
    });
  }
}catch(e){ console.warn('Could not serve dist folder:', e && e.message ? e.message : e); }
