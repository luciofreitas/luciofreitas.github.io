require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const cors = require('cors');
const { Client } = require('pg');

// Firebase Admin SDK (opcional - para verificação de tokens)
let admin = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    });
    console.log('Firebase Admin SDK initialized');
  }
} catch (err) {
  console.warn('Firebase Admin SDK not initialized:', err.message);
}

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

// Attempt Postgres connection if environment variables provided
let pgClient = null;
// Try to build a pg Client config from common env vars. Support DATABASE_URL or individual PG* vars.
function buildPgConfig(){
  if(process.env.DATABASE_URL) {
    const config = { 
      connectionString: process.env.DATABASE_URL,
      // Forçar uso de IPv4 (Render pode não suportar IPv6)
      options: '-c client_encoding=UTF8'
    };
    // Habilitar SSL se configurado (obrigatório para Supabase)
    if(process.env.PGSSL === 'true') {
      // Aceitar certificados self-signed (comum em desenvolvimento)
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
    return client;
  }catch(err){
    console.warn('Postgres connection failed, falling back to CSV:', err && err.message ? err.message : err);
    return null;
  }
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
      imagens: ["/assets/placeholder-part.jpg"],
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
app.get('/api/users', async (req, res) => { if(pgClient){ try{ const r = await pgClient.query('SELECT id,email,name,is_pro,pro_since,created_at FROM users'); return res.json(r.rows);}catch(err){ console.error('PG query failed /api/users:', err.message);} } res.json(csvData.users); });

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

// ============ AUTENTICAÇÃO FIREBASE + BANCO ============

// Verificar token Firebase e sincronizar usuário no banco
app.post('/api/auth/verify', async (req, res) => {
  if (!admin) {
    return res.status(503).json({ error: 'Firebase Admin SDK not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.body.idToken;
  
  if (!idToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verificar token com Firebase
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || null;
    const nome = decoded.name || null;

    // Sincronizar usuário no banco (se Postgres disponível)
    if (pgClient) {
      try {
        await pgClient.query(
          `INSERT INTO users(id, email, nome, criado_em, atualizado_em)
           VALUES($1, $2, $3, now(), now())
           ON CONFLICT (id) DO UPDATE SET 
             email = EXCLUDED.email, 
             nome = EXCLUDED.nome, 
             atualizado_em = now()`,
          [uid, email, nome]
        );

        const result = await pgClient.query(
          'SELECT id, email, nome, is_pro, criado_em FROM users WHERE id = $1',
          [uid]
        );

        return res.json({ 
          success: true, 
          user: result.rows[0],
          uid 
        });
      } catch (dbErr) {
        console.error('Database error during user sync:', dbErr.message);
        // Continua mesmo se o DB falhar
      }
    }

    // Retorna sucesso mesmo sem DB
    return res.json({ 
      success: true, 
      user: { id: uid, email, nome },
      uid 
    });
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid token', details: err.message });
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

// DEBUG: return ALL guias (no status filter) for diagnosis. REMOVE AFTER DIAGNOSIS.
app.get('/api/debug/guias-all', async (req, res) => {
  if (pgClient) {
    try {
      const result = await pgClient.query('SELECT * FROM guias ORDER BY criado_em DESC');
      const mapped = result.rows.map(r => snakeToCamelKeys(r));
      return res.json(mapped);
    } catch (err) {
      console.error('PG query failed /api/debug/guias-all:', err && err.message ? err.message : err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  }
  // fallback to data file
  const guiasPath = path.join(__dirname, '..', 'data', 'guias.json');
  if (fs.existsSync(guiasPath)) {
    const guias = JSON.parse(fs.readFileSync(guiasPath, 'utf8'));
    return res.json(guias);
  }
  return res.json([]);
});

app.post('/api/guias', async (req, res) => {
  const guia = req.body;
  // Debug: log received payload to console and to a local debug file so we can confirm arrival
  try {
    console.info('Received POST /api/guias payload:', typeof guia === 'object' ? JSON.stringify(guia) : String(guia));
    const debugPath = path.join(__dirname, 'received_guias_debug.log');
    const line = JSON.stringify({ ts: new Date().toISOString(), payload: guia }) + '\n';
    try { fs.appendFileSync(debugPath, line, 'utf8'); } catch(e){ console.warn('Failed to write received_guias_debug.log:', e && e.message ? e.message : e); }
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

// Temporary debug endpoint: return received POST payloads from the debug log
app.get('/api/debug/received-guia-logs', (req, res) => {
  try {
    const debugPath = path.join(__dirname, 'received_guias_debug.log');
    if(!fs.existsSync(debugPath)) return res.json([]);
    const raw = fs.readFileSync(debugPath, 'utf8').trim();
    if(!raw) return res.json([]);
    const lines = raw.split(/\n+/).map(l => {
      try { return JSON.parse(l); } catch(e){ return { raw: l }; }
    });
    return res.json(lines.reverse()); // mostrar mais recente primeiro
  } catch(err){
    console.error('Failed to read received_guia logs:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to read debug logs' });
  }
});

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
  pgClient = await tryConnectPg();
  app.listen(PORT, '0.0.0.0', () => console.log(`Parts API listening on http://0.0.0.0:${PORT} (pg=${pgClient?true:false})`));
})();
