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
// Guias API routes
const { router: guiasRoutes, setPgClientGetter: setGuiasPgClientGetter } = require('./routes/guias');
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    // Short-circuit OPTIONS preflight
    if (req.method === 'OPTIONS') return res.status(204).end();
  } catch (e) { /* ignore header set errors */ }
  return next();
});
// CORS: permitir solicitações do frontend hospedado no GitHub Pages e do próprio Render
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'https://luciofreitas.github.io',
  'https://luciofreitas-github-io.onrender.com',
  'https://garagemsmart.com.br',
  'http://garagemsmart.com.br'
];
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps, curl)
    if(!origin) return callback(null, true);

    // Dev ergonomics: allow any localhost/127.0.0.1 origin (any port).
    // This prevents CORS issues when Vite picks a different port (e.g. 5175).
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        return callback(null, true);
      }

      // Dev ergonomics: when running the frontend via LAN IP (e.g. http://192.168.x.x:5174),
      // allow private network origins in non-production environments.
      if (process.env.NODE_ENV !== 'production') {
        const isPrivateIp = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(u.hostname);
        if (isPrivateIp) {
          return callback(null, true);
        }
      }
    } catch (e) {
      // ignore URL parse errors and fallback to allowlist
    }
    
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  } catch (e) { /* ignore */ }
  return res.status(204).end();
});
// Capture raw body for debugging parse errors (verify option stores raw body as string)
app.use(express.json({ verify: function (req, res, buf, encoding) {
  try { req.rawBody = buf && buf.toString(encoding || 'utf8'); } catch (e) { req.rawBody = null; }
}}));

// Mount Mercado Livre OAuth routes
app.use('/api/ml', mercadoLivreRoutes);

// Runtime configuration endpoint consumed by the frontend.
// IMPORTANT: only return whitelisted values (no secrets).
app.get('/api/runtime-config', (req, res) => {
  try {
    const whitelist = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'API_URL',
      'EMAILJS_PUBLIC_KEY'
    ];
    const out = {};
    for (const k of whitelist) {
      if (Object.prototype.hasOwnProperty.call(process.env, k)) out[k] = process.env[k];
    }
    return res.json(out);
  } catch (e) {
    return res.json({});
  }
});

// Mount Guias API routes
app.use('/api/guias', guiasRoutes);

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

// (debug pg-check endpoint removed from production - was used for troubleshooting)

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
// Make the guias router able to query Postgres when available.
try { setGuiasPgClientGetter(() => pgClient); } catch (e) { /* ignore */ }
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

// Cars schema capability detection (some DBs may not yet have the encryption columns)
let carsHasChassiEnc = false;
let carsHasChassiHash = false;
let carsHasChassiLast4 = false;
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

    // detect whether cars table has the encryption columns
    try {
      const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='cars' AND table_schema='public'");
      const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
      carsHasChassiEnc = names.indexOf('chassi_enc') >= 0;
      carsHasChassiHash = names.indexOf('chassi_hash') >= 0;
      carsHasChassiLast4 = names.indexOf('chassi_last4') >= 0;
      console.log('Detected cars chassi columns:', { chassi_enc: carsHasChassiEnc, chassi_hash: carsHasChassiHash, chassi_last4: carsHasChassiLast4 });
    } catch (e) {
      // If cars table doesn't exist in this DB/schema, keep defaults.
      console.warn('Could not detect cars table columns:', e && e.message ? e.message : e);
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
app.get('/api/pecas/meta', async (req, res) => {
  try {
    console.log('Building /api/pecas/meta response...');
    // Tenta buscar do Supabase primeiro
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    let pecas = [];
    let grupos = [];
    let fabricantes = [];
    let marcas = [];
    let modelos = [];
    let anos = [];
    let motores = [];
    let versoes = [];
    let supabaseOk = false;
    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl.replace(/\/$/, ''), supabaseKey);
        const { data: partsData, error } = await supabase.from('parts').select('name,category,manufacturer');
        if (!error && partsData && Array.isArray(partsData)) {
          pecas = partsData.filter(p => p.name && p.category);
          grupos = [...new Set(partsData.map(p => p.category).filter(Boolean))].sort();
          fabricantes = [...new Set(partsData.map(p => p.manufacturer).filter(Boolean))].sort();
          supabaseOk = true;

          // Optional: build dropdown suggestions for motor/versao from heuristic hint columns.
          // Keep it bounded to avoid huge payloads.
          try {
            const limit = 5000;
            const motorSet = new Set();
            const versaoSet = new Set();

            const { data: motorRows, error: motorErr } = await supabase
              .from('parts')
              .select('fit_motor_hint')
              .not('fit_motor_hint', 'is', null)
              .limit(limit);

            if (!motorErr && Array.isArray(motorRows)) {
              for (const r of motorRows) {
                const m = r && r.fit_motor_hint ? String(r.fit_motor_hint).trim() : '';
                if (m) motorSet.add(m);
              }
            } else if (motorErr) {
              console.warn('Supabase motor hint column not available for meta:', motorErr && motorErr.message ? motorErr.message : motorErr);
            }

            const { data: versaoRows, error: versaoErr } = await supabase
              .from('parts')
              .select('fit_versao_hint')
              .not('fit_versao_hint', 'is', null)
              .limit(limit);

            if (!versaoErr && Array.isArray(versaoRows)) {
              for (const r of versaoRows) {
                const v = r && r.fit_versao_hint ? String(r.fit_versao_hint).trim() : '';
                if (v) versaoSet.add(v);
              }
            } else if (versaoErr) {
              console.warn('Supabase versao hint column not available for meta:', versaoErr && versaoErr.message ? versaoErr.message : versaoErr);
            }

            motores = Array.from(motorSet).sort();
            versoes = Array.from(versaoSet).sort();
          } catch (e) {
            console.warn('Failed to build motor/versao meta from hints:', e && e.message ? e.message : e);
          }
        }
      } catch (e) {
        console.warn('Supabase fetch failed:', e && e.message ? e.message : e);
      }
    }
    // Fallback para PARTS_DB local
    if (!supabaseOk) {
      pecas = PARTS_DB.filter(p => p.name && p.category);
      grupos = get_unique('category');
      fabricantes = get_unique('manufacturer');
    }
    // Os outros campos podem ser extraídos localmente
    marcas = extract_brands ? extract_brands() : [];
    modelos = extract_models ? extract_models() : [];
    anos = extract_years ? extract_years() : [];
    return res.json({
      grupos,
      pecas,
      marcas,
      modelos,
      anos,
      fabricantes,
      motores,
      versoes
    });
  } catch (err) {
    console.error('Failed to build /api/pecas/meta:', err && err.message ? err.message : err);
    console.error('Stack:', err.stack);
    return res.status(500).json({ grupos: [], pecas: [], marcas: [], modelos: [], anos: [], fabricantes: [], motores: [], versoes: [] });
  }
});

// --- MVP AI endpoint: suggest structured filters from free text ---
// Contract: POST /api/ai/suggest-filters { query: string, context?: { marca?, modelo?, ano?, carroSelecionadoId? } }
// Response: { filters: { grupo?, categoria?, fabricante?, marca?, modelo?, ano? }, questions: string[], confidence: number }
function stripDiacritics(s) {
  try {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (e) {
    return String(s || '');
  }
}

function normalizeText(s) {
  const t = stripDiacritics(String(s || '')).toLowerCase();
  return t
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(s) {
  const t = normalizeText(s);
  if (!t) return [];
  return t.split(' ').filter(Boolean);
}

function buildUniqueCandidates(values) {
  const out = [];
  const seen = new Set();
  for (const v of (Array.isArray(values) ? values : [])) {
    const raw = String(v || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ value: raw, norm: normalizeText(raw) });
  }
  return out;
}

function scoreCandidate(queryNorm, queryTokens, cand) {
  if (!cand || !cand.norm) return 0;
  if (!queryNorm) return 0;
  // Strong signal: substring match
  if (queryNorm.includes(cand.norm)) {
    return 1000 + Math.min(200, cand.norm.length);
  }
  // Token overlap
  const candTokens = cand.norm.split(' ').filter(Boolean);
  if (!candTokens.length) return 0;
  let common = 0;
  const qset = new Set(queryTokens);
  for (const ct of candTokens) {
    if (qset.has(ct)) common++;
  }
  if (!common) return 0;
  const overlap = common / candTokens.length;
  return Math.round(overlap * 100);
}

function findBestMatch(query, candidates) {
  const queryNorm = normalizeText(query);
  const queryTokens = tokenize(queryNorm);
  let best = null;
  let bestScore = 0;
  for (const cand of (Array.isArray(candidates) ? candidates : [])) {
    const s = scoreCandidate(queryNorm, queryTokens, cand);
    if (s > bestScore) {
      bestScore = s;
      best = cand;
    }
  }
  return { best, score: bestScore };
}

function extractFirstYear(text) {
  const m = String(text || '').match(/\b(19|20)\d{2}\b/);
  return m ? String(m[0]) : '';
}

// Lightweight domain rules (keywords -> hints). We still resolve to actual catalog values via matching.
const AI_RULES = [
  { keywords: ['pastilha', 'pastilhas'], grupoHint: 'Freios', pecaHint: 'Pastilha' },
  { keywords: ['disco', 'discos'], grupoHint: 'Freios', pecaHint: 'Disco' },
  { keywords: ['filtro', 'filtros'], grupoHint: 'Filtros', pecaHint: 'Filtro' },
  { keywords: ['oleo', 'óleo'], grupoHint: 'Filtros', pecaHint: 'Óleo' },
  { keywords: ['amortecedor', 'amortecedores'], grupoHint: 'Suspensão', pecaHint: 'Amortecedor' },
  { keywords: ['embreagem'], grupoHint: 'Embreagem', pecaHint: 'Embreagem' },
  { keywords: ['vela', 'velas'], grupoHint: 'Ignição', pecaHint: 'Vela' },
  { keywords: ['bateria'], grupoHint: 'Elétrica', pecaHint: 'Bateria' },
  { keywords: ['correia', 'correias'], grupoHint: 'Motor', pecaHint: 'Correia' },
];

let AI_CANDIDATES_CACHE = null;
let AI_CANDIDATES_CACHE_SIZE = 0;
function getAiCandidates() {
  const size = Array.isArray(PARTS_DB) ? PARTS_DB.length : 0;
  if (AI_CANDIDATES_CACHE && AI_CANDIDATES_CACHE_SIZE === size) return AI_CANDIDATES_CACHE;

  const grupos = buildUniqueCandidates((PARTS_DB || []).map(p => p && p.category).filter(Boolean));
  const fabricantes = buildUniqueCandidates((PARTS_DB || []).map(p => p && p.manufacturer).filter(Boolean));
  const pecas = buildUniqueCandidates((PARTS_DB || []).map(p => p && p.name).filter(Boolean));
  // Vehicle candidates are derived from applications strings.
  // They are used only to assist users filling vehicle filters when they type a phrase
  // like "meu carro é um Fiat Uno".
  const marcas = buildUniqueCandidates(extract_brands());
  const modelos = buildUniqueCandidates(extract_models());

  AI_CANDIDATES_CACHE = { grupos, fabricantes, pecas, marcas, modelos };
  AI_CANDIDATES_CACHE_SIZE = size;
  return AI_CANDIDATES_CACHE;
}

app.post('/api/ai/suggest-filters', async (req, res) => {
  try {
    const body = req.body || {};
    const query = String(body.query || '').trim();
    const context = (body && typeof body.context === 'object' && body.context) ? body.context : {};
    const debug = isDebugRequest(req);

    if (!query) {
      return res.json({
        filters: {
          marca: context.marca || '',
          modelo: context.modelo || '',
          ano: context.ano || ''
        },
        questions: ['Digite o que você precisa (ex: "pastilha de freio dianteira").'],
        confidence: 0
      });
    }

    const { grupos, fabricantes, pecas, marcas, modelos } = getAiCandidates();
    const qNorm = normalizeText(query);
    const qTokens = tokenize(qNorm);

    // 1) Apply rules to get hints
    let grupoHint = '';
    let pecaHint = '';
    for (const rule of AI_RULES) {
      const hit = (rule.keywords || []).some(k => qTokens.includes(normalizeText(k)) || qNorm.includes(normalizeText(k)));
      if (hit) {
        grupoHint = rule.grupoHint || grupoHint;
        pecaHint = rule.pecaHint || pecaHint;
        break;
      }
    }

    // Extra refinement for common "Filtro de X" phrases.
    // The generic "Filtro" hint is often too broad to match an exact part name.
    const hasFiltroToken = qTokens.includes('filtro') || qTokens.includes('filtros');
    if (hasFiltroToken) {
      if (!grupoHint) grupoHint = 'Filtros';
      if (qTokens.includes('oleo') || qTokens.includes('óleo')) pecaHint = 'Filtro de Óleo';
      else if (qTokens.includes('ar') && qTokens.includes('condicionado')) pecaHint = 'Filtro de Ar Condicionado';
      else if (qTokens.includes('cabine')) pecaHint = 'Filtro de Cabine';
      else if (qTokens.includes('combustivel') || qTokens.includes('combustível')) pecaHint = 'Filtro de Combustível';
      else if (qTokens.includes('ar')) pecaHint = 'Filtro de Ar';
    }

    // 2) Resolve best matches from catalog values
    const grupoMatch = grupoHint ? findBestMatch(grupoHint, grupos) : findBestMatch(query, grupos);
    const pecaMatch = pecaHint ? findBestMatch(pecaHint, pecas) : findBestMatch(query, pecas);
    const fabMatch = findBestMatch(query, fabricantes);

    // Vehicle (marca/modelo): best-effort extraction from query.
    // NOTE: we do not override explicit context values coming from the UI.
    const marcaMatch = findBestMatch(query, marcas);
    const modeloMatch = findBestMatch(query, modelos);

    // 3) Build filters, preferring context for vehicle fields
    const anoFromQuery = extractFirstYear(query);
    const marcaFromQuery = (!context.marca && marcaMatch.best && marcaMatch.score >= 90) ? marcaMatch.best.value : '';
    const modeloFromQuery = (!context.modelo && modeloMatch.best && modeloMatch.score >= 90) ? modeloMatch.best.value : '';
    const filters = {
      grupo: grupoMatch.best && grupoMatch.score >= 80 ? grupoMatch.best.value : '',
      categoria: pecaMatch.best && pecaMatch.score >= 80 ? pecaMatch.best.value : '',
      fabricante: fabMatch.best && fabMatch.score >= 90 ? fabMatch.best.value : '',
      marca: context.marca || marcaFromQuery || '',
      modelo: context.modelo || modeloFromQuery || '',
      ano: context.ano || (anoFromQuery || '')
    };

    // If user typed an explicit year, keep it even if context has none.
    if (!filters.ano && anoFromQuery) filters.ano = anoFromQuery;

    // 4) Ensure we have at least one structural filter (grupo/peça/fabricante)
    const hasStructural = Boolean(filters.grupo || filters.categoria || filters.fabricante);

    const questions = [];
    if (!hasStructural) {
      questions.push('Qual peça você procura? (ex: pastilha, filtro de óleo, amortecedor)');
      questions.push('Se preferir, selecione um Grupo, Peça ou Fabricante para eu filtrar.');
    }

    // If we already identified the part/group but still have no vehicle context,
    // proactively ask for marca/modelo/ano to improve compatibility accuracy.
    const hasVehicleContext = Boolean(
      context && (
        context.carroSelecionadoId ||
        (context.marca && String(context.marca).trim()) ||
        (context.modelo && String(context.modelo).trim()) ||
        (context.ano && String(context.ano).trim())
      )
    );
    if (!hasVehicleContext) {
      const hasMarca = Boolean(filters.marca && String(filters.marca).trim());
      const hasModelo = Boolean(filters.modelo && String(filters.modelo).trim());
      const hasAno = Boolean(filters.ano && String(filters.ano).trim());

      if (!hasMarca && !hasModelo && !hasAno) {
        questions.push('Qual é o seu carro (marca, modelo e ano)?');
        questions.push('Ex: "Fiat Uno 2014" ou selecione em "Meus Carros".');
      } else if ((hasMarca || hasModelo) && !hasAno) {
        questions.push('Qual é o ano do carro? (ex: 2014)');
      }
    }

    // 5) Confidence heuristic
    const bestStructuralScore = Math.max(
      filters.grupo ? grupoMatch.score : 0,
      filters.categoria ? pecaMatch.score : 0,
      filters.fabricante ? fabMatch.score : 0
    );
    const confidence = hasStructural ? Math.max(0.3, Math.min(1, bestStructuralScore / 100)) : 0.15;

    const payload = { filters, questions, confidence };
    if (debug) {
      payload.debug = {
        query,
        queryNorm: qNorm,
        hints: { grupoHint, pecaHint },
        matches: {
          grupo: grupoMatch,
          categoria: pecaMatch,
          fabricante: fabMatch,
          marca: marcaMatch,
          modelo: modeloMatch
        }
      };
    }
    return res.json(payload);
  } catch (e) {
    console.error('Failed /api/ai/suggest-filters:', e && e.message ? e.message : e);
    return res.status(500).json({
      filters: {},
      questions: ['Não foi possível sugerir filtros agora. Tente novamente.'],
      confidence: 0
    });
  }
});

// Debug endpoint to check data source
app.get('/api/debug/datasource', async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  let supabaseCount = 0;
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl.replace(/\/$/, ''), supabaseKey);
      const { count, error } = await supabase.from('parts').select('*', { count: 'exact', head: true });
      if (!error) supabaseCount = count;
    } catch(e) {}
  }
  
  return res.json({
    jsonFileCount: PARTS_DB.length,
    supabaseCount,
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'not set'
  });
});

app.post('/api/pecas/filtrar', async (req, res) => {
  try {
    const data = req.body || {};
    const categoria = (data.grupo || '').toLowerCase();
    const peca = (data.categoria || '').toLowerCase();
    const marca = (data.marca || '').toLowerCase();
    const modelo = (data.modelo || '').toLowerCase();
    const ano = (data.ano || '').toLowerCase();
    const fabricante = (data.fabricante || '').toLowerCase();
    const motor = (data.motor || '').toLowerCase();
    const versao = (data.versao || '').toLowerCase();
    const combustivel = (data.combustivel || '').toLowerCase();
    const cambio = (data.cambio || '').toLowerCase();
    const carroceria = (data.carroceria || '').toLowerCase();
    
    console.log('🔍 /api/pecas/filtrar recebido:', { 
      original: data, 
      lowercase: { categoria, peca, marca, modelo, ano, fabricante, motor, versao, combustivel, cambio, carroceria } 
    });
    
    // Se nenhum filtro foi fornecido, retorna todas as peças
    const hasFilters = [categoria, peca, marca, modelo, ano, fabricante, motor, versao, combustivel, cambio, carroceria].some(v=>v && v.length);

    const matchOptional = (appValue, q) => {
      if (!q) return true;
      if (appValue === undefined || appValue === null || String(appValue).trim() === '') return true; // permissive
      return String(appValue).toLowerCase().includes(q);
    };
    
    // Try Supabase first
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('🗄️  Tentando buscar no Supabase...', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
      
      if (supabaseUrl && supabaseKey) {
        const supabaseAdmin = createClient(supabaseUrl.replace(/\/$/, ''), supabaseKey);
        let query = supabaseAdmin.from('parts').select('*');
        
        // Apply filters - use original case from request
        console.log('🔍 Aplicando filtros:', { 
          categoria: categoria ? data.grupo : null,
          peca: peca ? data.categoria : null,
          fabricante: fabricante ? data.fabricante : null
        });
        
        if (categoria) {
          query = query.eq('category', data.grupo);
        }
        if (peca) {
          query = query.eq('name', data.categoria);
        }
        if (fabricante) {
          query = query.eq('manufacturer', data.fabricante);
        }
        
        // For vehicle filters (marca, modelo, ano), we need to filter in-memory
        // because applications is a text[] field
        const { data: results, error } = await query;
        
        if (error) {
          console.error('Supabase query error:', error);
        } else {
          let filtered = results || [];
          
          // Filter by vehicle criteria (marca, modelo, ano)
          if (marca || modelo || ano) {
            filtered = filtered.filter(part => {
              const apps = part.applications || [];
              return apps.some(app => {
                const appStr = String(app).toLowerCase();
                if (marca && !appStr.includes(marca)) return false;
                if (modelo && !appStr.includes(modelo)) return false;
                if (ano) {
                  // Extract years from application string
                  const yearMatches = appStr.match(/\d{4}(?:-\d{4})?/g) || [];
                  const anos = [];
                  yearMatches.forEach(str => {
                    if (str.includes('-')) {
                      const [start, end] = str.split('-').map(Number);
                      for (let y = start; y <= end; y++) anos.push(String(y));
                    } else {
                      anos.push(str);
                    }
                  });
                  if (!anos.includes(ano)) return false;
                }
                return true;
              });
            });
          }

          // Apply heuristic fitment hint filters (permissive when hint missing)
          if (motor || versao || combustivel || cambio || carroceria) {
            const matchHint = (hintValue, q) => {
              if (!q) return true;
              if (hintValue === undefined || hintValue === null || String(hintValue).trim() === '') return true;
              return String(hintValue).toLowerCase().includes(q);
            };

            filtered = filtered.filter(part => {
              if (!matchHint(part.fit_motor_hint, motor)) return false;
              if (!matchHint(part.fit_versao_hint, versao)) return false;
              if (!matchHint(part.fit_combustivel_hint, combustivel)) return false;
              if (!matchHint(part.fit_cambio_hint, cambio)) return false;
              if (!matchHint(part.fit_carroceria_hint, carroceria)) return false;
              return true;
            });

            // Sort by best hint match (ranking), without excluding missing hints.
            const scorePart = (part) => {
              let score = 0;
              if (motor && part.fit_motor_hint && String(part.fit_motor_hint).toLowerCase().includes(motor)) score += 2;
              if (versao && part.fit_versao_hint && String(part.fit_versao_hint).toLowerCase().includes(versao)) score += 2;
              if (combustivel && part.fit_combustivel_hint && String(part.fit_combustivel_hint).toLowerCase().includes(combustivel)) score += 1;
              if (cambio && part.fit_cambio_hint && String(part.fit_cambio_hint).toLowerCase().includes(cambio)) score += 1;
              if (carroceria && part.fit_carroceria_hint && String(part.fit_carroceria_hint).toLowerCase().includes(carroceria)) score += 1;
              return score;
            };
            filtered = filtered
              .map((p, idx) => ({ p, idx, s: scorePart(p) }))
              .sort((a, b) => (b.s - a.s) || (a.idx - b.idx))
              .map(x => x.p);
          }
          
          console.log(`✅ Supabase filtrar: ${filtered.length} peças encontradas`);
          return res.json({ pecas: filtered, total: filtered.length });
        }
      }
    } catch (err) {
      console.warn('Failed to query Supabase, falling back to JSON:', err.message);
    }
  
  // Fallback to JSON file
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

    // Advanced fields: only enforce when structured application objects carry those fields.
    if (motor || versao || combustivel || cambio || carroceria) {
      const apps = part.applications || [];
      let found = false;
      for (const app of apps) {
        if (typeof app !== 'object' || !app) {
          // Free-form strings: don't exclude (we can't reliably parse)
          found = true;
          break;
        }
        const appMotor = app.motor || app.engine;
        const appVersao = app.versao || app.trim || app.version;
        const appCombustivel = app.combustivel || app.fuel || app.fuel_type;
        const appCambio = app.cambio || app.transmission || app.gearbox;
        const appCarroceria = app.carroceria || app.body || app.body_type;
        if (!matchOptional(appMotor, motor)) continue;
        if (!matchOptional(appVersao, versao)) continue;
        if (!matchOptional(appCombustivel, combustivel)) continue;
        if (!matchOptional(appCambio, cambio)) continue;
        if (!matchOptional(appCarroceria, carroceria)) continue;
        found = true;
        break;
      }
      if (!found) return false;
    }
    return true;
  }

    const filtered = PARTS_DB.filter(matches);
    return res.json({ pecas: filtered, total: filtered.length });
  } catch (mainError) {
    console.error('❌ Erro fatal em /api/pecas/filtrar:', mainError);
    return res.status(500).json({ pecas: [], total: 0, error: mainError.message });
  }
});

app.get('/api/pecas/compatibilidade/:part_id', (req, res) => {
  const part_id = req.params.part_id;
  const compatibles = get_compatible_parts(part_id);
  return res.json({ compatibilidade: compatibles, total: compatibles.length });
});

app.get('/api/pecas/:id', (req, res) => {
  const id = req.params.id;
  const idNum = Number(id);
  const matchesId = (v) => {
    if (v === undefined || v === null) return false;
    if (String(v) === String(id)) return true;
    if (Number.isFinite(idNum) && Number(v) === idNum) return true;
    return false;
  };

  const parseYearsFromApplicationString = (s) => {
    try {
      const text = String(s || '');
      if (!text.trim()) return { ano_inicio: null, ano_fim: null };

      // Collect all years first (covers formats like "2010-2011-2012-..." or scattered years)
      const years = (text.match(/\b(?:19|20)\d{2}\b/g) || []).map(Number).filter(Number.isFinite);
      if (years.length === 1) return { ano_inicio: years[0], ano_fim: years[0] };
      if (years.length > 2) return { ano_inicio: Math.min(...years), ano_fim: Math.max(...years) };

      // Try explicit ranges like 2010-2015
      const range = text.match(/\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})\b/);
      if (range) {
        const a = Number(range[1]);
        const b = Number(range[2]);
        if (Number.isFinite(a) && Number.isFinite(b)) {
          return { ano_inicio: Math.min(a, b), ano_fim: Math.max(a, b) };
        }
      }
      // Otherwise, pick the min/max of all found years
      if (years.length > 1) return { ano_inicio: Math.min(...years), ano_fim: Math.max(...years) };
    } catch (e) {
      // ignore
    }
    return { ano_inicio: null, ano_fim: null };
  };
  
  // Tentar carregar dados detalhados do JSON
  try {
    const detailsPath = path.join(__dirname, 'parts_detailed.json');
    if (fs.existsSync(detailsPath)) {
      const detailedParts = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
      const detailedPart = detailedParts.find(p => matchesId(p && p.id));
      
      if (detailedPart) {
        return res.json(detailedPart);
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados detalhados:', error);
  }
  
  // Fallback para dados básicos se não encontrar no detailed
  const basicPart = PARTS_DB.find(p => matchesId(p && p.id));
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
      aplicacoes_detalhadas: (basicPart.applications || []).map(app => {
        const appStr = String(app || '').trim();
        const veiculoSemAnos = appStr
          .replace(/\b(?:19|20)\d{2}\b/g, ' ')
          .replace(/[()?,]/g, ' ')
          .replace(/[-–—]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const years = parseYearsFromApplicationString(appStr);
        return {
          // Prefer a string vehicle label so the UI can always render something meaningful
          veiculo: veiculoSemAnos || appStr,
          marca: null,
          modelo: null,
          ano_inicio: years.ano_inicio,
          ano_fim: years.ano_fim,
          motor: null,
          observacoes: appStr
        };
      }),
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

function normalizeVin(v) {
  try {
    return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  } catch (e) {
    return '';
  }
}

let _carsChassiKeyWarned = false;
function getCarsChassiKey(){
  const raw = process.env.CARS_CHASSI_ENCRYPTION_KEY || '';
  if (!raw) return null;
  const s = String(raw).trim();
  try {
    // hex (64 chars => 32 bytes)
    if (/^[0-9a-fA-F]{64}$/.test(s)) return Buffer.from(s, 'hex');

    // base64 (44 chars for 32 bytes, but allow other valid lengths)
    if (/^[A-Za-z0-9+/=]+$/.test(s)) {
      const b = Buffer.from(s, 'base64');
      if (b.length === 32) return b;
    }

    // fallback: treat as utf8, but require 32 bytes
    const b = Buffer.from(s, 'utf8');
    if (b.length === 32) return b;
  } catch (e) {
    // fall through
  }

  if (!_carsChassiKeyWarned) {
    _carsChassiKeyWarned = true;
    console.warn('CARS_CHASSI_ENCRYPTION_KEY invalid (expected 32 bytes; use hex/base64). Chassi encryption disabled.');
  }
  return null;
}

function stripChassiFromDados(dados){
  if (!dados || typeof dados !== 'object') return null;
  const copy = { ...dados };
  delete copy.chassi;
  delete copy.vin;
  delete copy.VIN;
  delete copy.chassis;
  return Object.keys(copy).length ? copy : null;
}

function encryptChassiToColumns(rawChassi){
  const key = getCarsChassiKey();
  const vin = normalizeVin(rawChassi);
  if (!key || !vin) return null;

  // AES-256-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(vin, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const packed = Buffer.concat([iv, tag, ciphertext]).toString('base64');
  const enc = `v1:${packed}`;
  const last4 = vin.slice(-4);
  const hash = crypto.createHmac('sha256', key).update(vin, 'utf8').digest('hex');
  return { enc, last4, hash, vin };
}

function decryptChassiFromColumn(encValue){
  const key = getCarsChassiKey();
  if (!key || !encValue) return '';
  try {
    const s = String(encValue);
    if (!s.startsWith('v1:')) return '';
    const buf = Buffer.from(s.slice(3), 'base64');
    if (buf.length < 12 + 16 + 1) return '';
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    return normalizeVin(plain);
  } catch (e) {
    return '';
  }
}

function isValidVin(v) {
  const vin = normalizeVin(v);
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

// VIN/Chassi decoder (baseline). Uses NHTSA VPIC which is best for US-market vehicles.
app.get('/api/vin/decode/:vin', async (req, res) => {
  const vin = normalizeVin(req.params.vin);
  if (!vin) return res.status(400).json({ ok: false, error: 'vin required' });
  if (!isValidVin(vin)) return res.status(400).json({ ok: false, error: 'invalid vin' });

  try {
    const nf = require('node-fetch');
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`;
    const r = await nf(url, { method: 'GET', redirect: 'follow', timeout: 15000, headers: { 'User-Agent': 'GaragemSmart-VIN/1.0' } });
    if (!r.ok) return res.status(502).json({ ok: false, error: `decoder status ${r.status}` });
    const payload = await r.json();
    const results = Array.isArray(payload && payload.Results) ? payload.Results : [];
    const get = (name) => {
      const row = results.find(x => x && String(x.Variable || '').toLowerCase() === String(name).toLowerCase());
      const val = row && row.Value != null ? String(row.Value) : '';
      return val && val !== 'Not Applicable' && val !== '0' ? val : '';
    };

    const make = get('Make');
    const model = get('Model');
    const year = get('Model Year');
    const engineModel = get('Engine Model');
    const cylinders = get('Engine Number of Cylinders');
    const displacementL = get('Displacement (L)');
    const fuel = get('Fuel Type - Primary');
    const bodyClass = get('Body Class');

    const driveType = get('Drive Type');
    const transmissionStyle = get('Transmission Style');
    const transmissionSpeeds = get('Transmission Speeds');
    const trim = get('Trim');
    const series = get('Series');

    const enginePowerKw = get('Engine Power (kW)');
    const enginePowerHp = get('Engine Power (hp)');

    const engineParts = [engineModel, displacementL ? `${displacementL}L` : '', cylinders ? `${cylinders}cyl` : '', fuel].filter(Boolean);
    const engine = engineParts.join(' ').trim();

    return res.json({
      ok: true,
      vin,
      decoded: {
        make,
        model,
        year,
        bodyClass,
        engine,
        fuelPrimary: fuel,
        driveType,
        transmissionStyle,
        transmissionSpeeds,
        displacementL,
        cylinders,
        enginePowerKw,
        enginePowerHp,
        trim,
        series,
      }
    });
  } catch (e) {
    console.error('VIN decode failed:', e && e.message ? e.message : e);
    return res.status(502).json({ ok: false, error: 'vin decode failed' });
  }
});

function shapeCarRow(row){
  const dados = row && row.dados && typeof row.dados === 'object' ? row.dados : null;
  const shaped = {
    id: row.id,
    userId: row.user_id,
    marca: row.marca,
    modelo: row.modelo,
    ano: row.ano,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(dados || {})
  };

  // Prefer encrypted-at-rest storage when available.
  try {
    const decrypted = row && row.chassi_enc ? decryptChassiFromColumn(row.chassi_enc) : '';
    if (decrypted) shaped.chassi = decrypted;
  } catch (e) { /* ignore */ }

  return shaped;
}

// Carros do usuário (tabela `cars` do Postgres). Mantém compatibilidade com o frontend (`cars-auto`).
app.get('/api/users/:userId/cars-auto', async (req, res) => {
  const userId = String(req.params.userId || '');
  if (!userId) return res.json([]);
  if (!pgClient) return res.json([]);
  try {
    const r = await pgClient.query('SELECT * FROM cars WHERE user_id = $1 ORDER BY updated_at DESC NULLS LAST, created_at DESC', [userId]);

    // Lazy-migrate legacy plaintext chassi from JSONB into encrypted columns (best-effort).
    try {
      const key = getCarsChassiKey();
      if (key && carsHasChassiEnc && (r.rows || []).length) {
        for (const row of (r.rows || [])) {
          if (!row || row.chassi_enc) continue;
          const dados = row.dados && typeof row.dados === 'object' ? row.dados : null;
          const legacyChassi = dados && (dados.chassi || dados.vin || dados.VIN || dados.chassis) ? (dados.chassi || dados.vin || dados.VIN || dados.chassis) : '';
          const enc = encryptChassiToColumns(legacyChassi);
          if (!enc) continue;
          const newDados = stripChassiFromDados(dados);
          try {
            await pgClient.query(
              'UPDATE cars SET chassi_enc = $1, chassi_hash = $2, chassi_last4 = $3, dados = $4, updated_at = now() WHERE user_id = $5 AND id = $6',
              [enc.enc, enc.hash, enc.last4, newDados, userId, row.id]
            );
            row.chassi_enc = enc.enc;
            row.chassi_hash = enc.hash;
            row.chassi_last4 = enc.last4;
            row.dados = newDados;
          } catch (e) {
            // best-effort only
          }
        }
      }
    } catch (e) {
      // ignore migration errors
    }

    return res.json((r.rows || []).map(shapeCarRow));
  } catch (e) {
    console.error('PG query failed /api/users/:userId/cars-auto:', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'internal' });
  }
});

app.post('/api/users/:userId/cars-auto', async (req, res) => {
  const userId = String(req.params.userId || '');
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (!pgClient) return res.status(503).json({ error: 'database not available' });

  const body = req.body || {};
  const marca = body.marca || body.brand || body.fabricante;
  const modelo = body.modelo || body.model;
  const ano = (body.ano !== undefined && body.ano !== null && body.ano !== '') ? Number(body.ano) : null;
  if (!marca || !modelo) return res.status(400).json({ error: 'marca and modelo are required' });

  const id = body.id || `car_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const rawChassi = body.chassi || body.vin || body.VIN || body.chassis || '';
  const { marca: _m, modelo: _mo, ano: _a, brand: _b, model: _mm, fabricante: _f, chassi: _c, vin: _v, VIN: _V, chassis: _cs, ...rest } = body;
  const dadosBase = Object.keys(rest || {}).length ? rest : null;

  const canEncrypt = carsHasChassiEnc && !!getCarsChassiKey();
  const enc = canEncrypt ? encryptChassiToColumns(rawChassi) : null;
  const willEncrypt = canEncrypt && !!enc;
  // Safe diagnostics (no VIN content). Helps verify the client is actually sending chassi.
  try {
    const uid = String(userId || '');
    const hasKey = !!getCarsChassiKey();
    const len = rawChassi ? String(rawChassi).length : 0;
    const b = body || {};
    const hasChassiKey = Object.prototype.hasOwnProperty.call(b, 'chassi') || Object.prototype.hasOwnProperty.call(b, 'vin') || Object.prototype.hasOwnProperty.call(b, 'VIN') || Object.prototype.hasOwnProperty.call(b, 'chassis');
    console.log('cars-auto:create', { user: uid ? `${uid.slice(0, 6)}…` : '', hasChassiKey, hasChassi: !!rawChassi, chassiLen: len, carsHasChassiEnc, hasKey, willEncrypt, encProduced: !!enc });
  } catch (e) { /* ignore */ }
  // If encryption isn't available, preserve legacy behavior by storing plaintext in JSONB.
  // Only remove plaintext from JSONB when encryption actually happens.
  const dadosWithChassi = (!willEncrypt && rawChassi)
    ? ({ ...(dadosBase || {}), chassi: normalizeVin(rawChassi) || String(rawChassi) })
    : dadosBase;
  const safeDados = willEncrypt ? stripChassiFromDados(dadosWithChassi) : dadosWithChassi;

  try {
    const sql = (carsHasChassiEnc && enc)
      ? 'INSERT INTO cars (id, user_id, marca, modelo, ano, dados, chassi_enc, chassi_hash, chassi_last4, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now()) RETURNING *'
      : 'INSERT INTO cars (id, user_id, marca, modelo, ano, dados, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, now(), now()) RETURNING *';
    const params = (carsHasChassiEnc && enc)
      ? [id, userId, String(marca), String(modelo), Number.isFinite(ano) ? ano : null, safeDados, enc.enc, enc.hash, enc.last4]
      : [id, userId, String(marca), String(modelo), Number.isFinite(ano) ? ano : null, safeDados];
    const r = await pgClient.query(sql, params);
    const row = r && r.rows && r.rows[0] ? r.rows[0] : null;
    return res.json(row ? shapeCarRow(row) : { id, userId, marca, modelo, ano });
  } catch (e) {
    console.error('PG insert failed /api/users/:userId/cars-auto:', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'internal' });
  }
});

app.delete('/api/users/:userId/cars-auto/:carId', async (req, res) => {
  const userId = String(req.params.userId || '');
  const carId = String(req.params.carId || '');
  if (!userId || !carId) return res.status(400).json({ error: 'userId and carId required' });
  if (!pgClient) return res.status(503).json({ error: 'database not available' });
  try {
    const r = await pgClient.query('DELETE FROM cars WHERE user_id = $1 AND id = $2', [userId, carId]);
    return res.json({ ok: true, deleted: r && typeof r.rowCount === 'number' ? r.rowCount : 0 });
  } catch (e) {
    console.error('PG delete failed /api/users/:userId/cars-auto/:carId:', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'internal' });
  }
});

// Bulk replace (used by saveCars). Accepts { cars: [...] }.
app.put('/api/users/:userId/cars', async (req, res) => {
  const userId = String(req.params.userId || '');
  const cars = (req.body && Array.isArray(req.body.cars)) ? req.body.cars : null;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (!cars) return res.status(400).json({ error: 'cars array required' });
  if (!pgClient) return res.status(503).json({ error: 'database not available' });
  try {
    await pgClient.query('BEGIN');
    await pgClient.query('DELETE FROM cars WHERE user_id = $1', [userId]);
    let diagTotal = 0;
    let diagWithChassi = 0;
    let diagEncrypted = 0;
    for (const c of cars) {
      diagTotal++;
      const body = c || {};
      const marca = body.marca || body.brand || body.fabricante;
      const modelo = body.modelo || body.model;
      const ano = (body.ano !== undefined && body.ano !== null && body.ano !== '') ? Number(body.ano) : null;
      if (!marca || !modelo) continue;
      const id = body.id || `car_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const rawChassi = body.chassi || body.vin || body.VIN || body.chassis || '';
      const { marca: _m, modelo: _mo, ano: _a, brand: _b, model: _mm, fabricante: _f, chassi: _c, vin: _v, VIN: _V, chassis: _cs, ...rest } = body;
      const dadosBase = Object.keys(rest || {}).length ? rest : null;

      const canEncrypt = carsHasChassiEnc && !!getCarsChassiKey();
      const enc = canEncrypt ? encryptChassiToColumns(rawChassi) : null;
      const willEncrypt = canEncrypt && !!enc;
      if (rawChassi) diagWithChassi++;
      if (willEncrypt) diagEncrypted++;
      const dadosWithChassi = (!willEncrypt && rawChassi)
        ? ({ ...(dadosBase || {}), chassi: normalizeVin(rawChassi) || String(rawChassi) })
        : dadosBase;
      const safeDados = willEncrypt ? stripChassiFromDados(dadosWithChassi) : dadosWithChassi;

      const sql = (carsHasChassiEnc && enc)
        ? 'INSERT INTO cars (id, user_id, marca, modelo, ano, dados, chassi_enc, chassi_hash, chassi_last4, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())'
        : 'INSERT INTO cars (id, user_id, marca, modelo, ano, dados, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, now(), now())';
      const params = (carsHasChassiEnc && enc)
        ? [id, userId, String(marca), String(modelo), Number.isFinite(ano) ? ano : null, safeDados, enc.enc, enc.hash, enc.last4]
        : [id, userId, String(marca), String(modelo), Number.isFinite(ano) ? ano : null, safeDados];
      await pgClient.query(sql, params);
    }
    try {
      const uid = String(userId || '');
      const hasKey = !!getCarsChassiKey();
      console.log('cars:bulkReplace', { user: uid ? `${uid.slice(0, 6)}…` : '', total: diagTotal, withChassi: diagWithChassi, encrypted: diagEncrypted, carsHasChassiEnc, hasKey });
    } catch (e) { /* ignore */ }
    await pgClient.query('COMMIT');
    return res.json({ ok: true });
  } catch (e) {
    try { await pgClient.query('ROLLBACK'); } catch (e2) { /* ignore */ }
    console.error('PG bulk replace failed /api/users/:userId/cars:', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'internal' });
  }
});

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
          // ignore and fall back to previously-detected columns
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

// Endpoint para validar token de redefinição de senha
app.get('/api/validate-reset-token', async (req, res) => {
  try {
    const token = req.query && req.query.token ? String(req.query.token).trim() : null;
    if (!token) return res.status(400).json({ error: 'token required' });
    if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });
    const q = `SELECT * FROM reset_password_tokens WHERE token = $1 LIMIT 1`;
    const r = await pgClient.query(q, [token]);
    if (r.rowCount === 0) return res.status(400).json({ error: 'invalid token' });
    const info = r.rows[0];
    if (info.used) return res.status(400).json({ error: 'token already used' });
    if (new Date(info.expires_at) < new Date()) return res.status(400).json({ error: 'token expired' });
    return res.json({ ok: true, email: info.email });
  } catch (e) {
    console.error('/api/validate-reset-token failed', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'internal' });
  }
});

// Aceita POST também para validar token de redefinição de senha
app.post('/api/validate-reset-token', async (req, res) => {
  try {
    const token = req.body && req.body.token ? String(req.body.token).trim() : null;
    if (!token) return res.status(400).json({ error: 'token required' });
    if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });
    const q = `SELECT * FROM reset_password_tokens WHERE token = $1 LIMIT 1`;
    const r = await pgClient.query(q, [token]);
    if (r.rowCount === 0) return res.status(400).json({ error: 'invalid token' });
    const info = r.rows[0];
    if (info.used) return res.status(400).json({ error: 'token already used' });
    if (new Date(info.expires_at) < new Date()) return res.status(400).json({ error: 'token expired' });
    return res.json({ ok: true, email: info.email });
  } catch (e) {
    console.error('/api/validate-reset-token (POST) failed', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'internal' });
  }
});

// Endpoint de produção para solicitar redefinição de senha
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : null;
    if (!email) return res.status(400).json({ error: 'email required' });
    if (!pgClient) return res.status(503).json({ error: 'pgClient not available' });
    // Buscar usuário
    const q = `SELECT id, email FROM users WHERE lower(email) = lower($1) LIMIT 1`;
    const r = await pgClient.query(q, [email]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    const row = r.rows[0];
    // Gerar token
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + (1000 * 60 * 15)); // 15 minutos
    // Salvar no banco
    await pgClient.query(
      `INSERT INTO reset_password_tokens (user_id, email, token, expires_at, used, created_at) VALUES ($1, $2, $3, $4, false, NOW())`,
      [row.id, row.email, token, expiresAt]
    );
    // Retornar token para o frontend montar o link e enviar o e-mail
    return res.json({ ok: true, token, expiresAt });
  } catch (e) {
    console.error('/api/auth/request-password-reset failed', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'internal' });
  }
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
  // Fim do bloco assíncrono principal
})();

// Serve frontend build (if exists) - place after app.listen para garantir que APIs sejam registradas primeiro
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

    // SPA fallback: serve index.html for non-API GET routes only.
    // IMPORTANT: never respond with HTML for /api/* paths (it breaks clients expecting JSON).
    app.get('*', (req, res) => {
      try {
        const requestPath = String(req.path || '');
        if (requestPath.startsWith('/api/')) {
          return res.status(404).json({ error: 'not found' });
        }
        return res.sendFile(path.join(distPath, 'index.html'));
      } catch (e) {
        return res.status(500).send('error');
      }
    });
  }

}catch(e){
  try {
    console.warn('Failed to serve static frontend build:', e && e.message ? e.message : e);
  } catch (e2) { /* ignore */ }
}

// NOTE: keep all API routes above the SPA fallback (app.get('*'))
