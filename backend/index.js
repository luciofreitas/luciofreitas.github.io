require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const cors = require('cors');
const { Client } = require('pg');
const crypto = require('crypto');

// Firebase Admin SDK removed: this project now uses Supabase for auth verification.
// If you previously used Firebase Admin for token verification, the behavior is
// intentionally disabled. To re-enable Firebase Admin, restore FIREBASE_SERVICE_ACCOUNT_JSON
// usage and add the dependency back to backend/package.json.

const app = express();
// CORS: permitir solicitações do frontend hospedado no GitHub Pages e do próprio Render
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://luciofreitas.github.io',
  'https://luciofreitas-github-io.onrender.com'
];
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps, curl)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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
    const client = new Client(cfg);
    await client.connect();
    // handle async errors from the postgres client so they don't crash the Node process
    client.on('error', err => {
      console.error('Postgres client emitted error, falling back to CSV and clearing client:', err && err.message ? err.message : err);
      try { pgClient = null; } catch(e){}
      try { client.end().catch(() => {}); } catch(e){}
    });
    await client.query('SELECT 1');
    console.log('Connected to Postgres for backend API');
    // detect users.name vs users.nome column to avoid schema mismatch
    try {
      const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
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
  console.log('Detected users name column:', userNameColumn, 'password column:', userPasswordColumn, 'createdAt:', userCreatedAtColumn, 'hasIsPro:', userHasIsPro, 'hasProSince:', userHasProSince);
    } catch (e) {
      console.warn('Could not detect users table columns:', e && e.message ? e.message : e);
    }
    return client;
  }catch(err){
    console.warn('Postgres connection failed, falling back to CSV:', err && err.message ? err.message : err);
    return null;
  }
}
// Retry wrapper around tryConnectPg with progressive backoff
async function connectWithRetry(retries = 5) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await tryConnectPg();
      if (client) return client;
      console.warn(`Postgres connection attempt ${i} failed (no client).`);
    } catch (err) {
      console.error(`Postgres connection attempt ${i} errored:`, err && err.message ? err.message : err);
    }
    if (i < retries) {
      const delay = 3000 * i; // backoff: 3s, 6s, 9s...
      console.log(`Retrying Postgres connection in ${delay / 1000}s...`);
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
app.get('/api/debug/users-columns', async (req, res) => {
  try {
    if (!pgClient) return res.json({ ok: false, reason: 'no pgClient' });
    const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
    const names = (cols.rows || []).map(r => String(r.column_name));
    return res.json({ ok: true, detectedUserNameColumn: userNameColumn, runtimePid: process.pid, time: new Date().toISOString(), columns: names });
  } catch (e) {
    console.error('debug/users-columns failed:', e && e.message ? e.message : e);
    return res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) });
  }
});

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
  // Initialize firebase-admin lazily if possible
  tryInitFirebaseAdmin();
  if (!firebaseAdmin) return res.status(503).json({ error: 'Firebase Admin not configured on server' });

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.body && (req.body.idToken || req.body.access_token));
  if (!idToken) return res.status(400).json({ error: 'idToken required (use Authorization: Bearer <idToken> or body.idToken)' });

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    if (!decoded || !decoded.uid) return res.status(401).json({ error: 'invalid token' });
    const uid = decoded.uid;
    const email = decoded.email || null;
    let photoURL = decoded.picture || null;
    let name = decoded.name || decoded.displayName || null;

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
          const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
          const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
          if (names.indexOf('nome') >= 0) nameCol = 'nome';
          else if (names.indexOf('name') >= 0) nameCol = 'name';
        } catch (e) {}

        const insertSql = `INSERT INTO users(id, email, ${nameCol}, photo_url, criado_em, atualizado_em)
          VALUES($1, $2, $3, $4, now(), now())
          ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ${nameCol} = EXCLUDED.${nameCol}, photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url), atualizado_em = now()`;
        try {
          await pgClient.query(insertSql, [uid, email, name, photoURL]);
        } catch (e) {
          console.warn('firebase-verify: Upsert query failed', e && e.message ? e.message : e);
        }

        const r = await pgClient.query(`SELECT id, email, ${nameCol} as name, photo_url, is_pro, criado_em FROM users WHERE id = $1`, [uid]);
        if (r.rowCount > 0) {
          const row = r.rows[0];
          const displayName = ((row.name || '') + '').trim();
          return res.json({ success: true, user: { id: row.id, email: row.email, name: displayName, nome: displayName, photoURL: row.photo_url || null, is_pro: row.is_pro, created_at: row.criado_em || null } });
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
          const cols = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
          const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
          if (names.indexOf('nome') >= 0) nameCol = 'nome';
          else if (names.indexOf('name') >= 0) nameCol = 'name';
        } catch (e) {
          // ignore and fall back to previously-detected column
        }

        // Build SQL specifically for the detected name column to avoid referencing a missing column
        const insertSql = `INSERT INTO users(id, email, ${nameCol}, photo_url, criado_em, atualizado_em)
           VALUES($1, $2, $3, $4, now(), now())
           ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ${nameCol} = EXCLUDED.${nameCol}, photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url), atualizado_em = now()`;
        try {
          await pgClient.query(insertSql, [uid, email, nome, photoURL]);
        } catch (e) {
          // Log full SQL and params at debug level so we can see what failed without exposing secrets
          console.warn('supabase-verify: Upsert query failed. nameCol=', nameCol, 'sql=', insertSql, 'params=', [uid, email, nome, photoURL]);
          throw e;
        }

        const r = await pgClient.query(`SELECT id, email, ${nameCol} as name, photo_url, is_pro, criado_em FROM users WHERE id = $1`, [uid]);
        if (r.rowCount > 0) {
          const row = r.rows[0];
          const displayName = ((row.name || '') + '').trim();
          return res.json({ success: true, user: { id: row.id, email: row.email, name: displayName, nome: displayName, photoURL: row.photo_url || null, is_pro: row.is_pro, created_at: row.criado_em || null } });
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
  return safe;
}

// Create user (try DB, fallback to csvData.users)
app.post('/api/users', async (req, res) => {
  const { nome, email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: 'email and senha are required' });
  const normalizedEmail = String(email).trim().toLowerCase();
  const debugMode = String(req.headers['x-debug'] || '').toLowerCase() === 'true';
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
      const selectCols = ['id', 'email', `${userNameColumn} as name`, `${userPasswordColumn} as password_hash`];
      if (userHasIsPro) selectCols.push('is_pro');
      if (userHasProSince) selectCols.push('pro_since');
      if (userCreatedAtColumn) selectCols.push(userCreatedAtColumn + ' as created_at');
      const r = await pgClient.query(`SELECT ${selectCols.join(', ')} FROM users WHERE lower(email) = $1`, [normalizedEmail]);
      if (r.rowCount === 0) return res.status(401).json({ error: 'invalid credentials' });
  const u = r.rows[0];
  if (!u.password_hash || !verifyPassword(senha, u.password_hash)) return res.status(401).json({ error: 'invalid credentials' });
  const displayName = ((u.name || u.nome) || '').trim();
  const safe = { id: u.id, email: u.email, name: displayName, nome: displayName };
      if (userHasIsPro) safe.is_pro = u.is_pro;
      if (userHasProSince) safe.pro_since = u.pro_since;
      if (userCreatedAtColumn) safe.created_at = u.created_at;
      return res.json({ success: true, user: safe });
    }
    // Try Supabase REST fallback if configured
    if(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY){
      try{
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

// TEMP DEBUG: check DB connection and quick guias sampling
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

// Temporary debug helper: echo headers and body when X-Debug-Key is provided.
// This endpoint is intentionally minimal and should be removed after diagnosis.
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

// Endpoints de Carros do Usuário
app.get('/api/users/:userId/cars', async (req, res) => {
  const { userId } = req.params;
  if(pgClient){
    try{
      const result = await pgClient.query('SELECT * FROM cars WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return res.json(result.rows);
    }catch(err){ 
      console.error('PG query failed /api/users/:userId/cars:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }
  res.json([]);
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

// Start server after attempting PG connect
const PORT = process.env.PORT || 3001;
(async () => {
  pgClient = await connectWithRetry(5);
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

  app.listen(PORT, '0.0.0.0', () => console.log(`Parts API listening on http://0.0.0.0:${PORT} (pg=${pgClient?true:false})`));

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
