require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
app.use(cors());
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
async function tryConnectPg(){
  const conn = process.env.DATABASE_URL || process.env.PGHOST;
  if(!conn) return null;
  try{
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    // handle async errors from the postgres client so they don't crash the Node process
    client.on('error', err => {
      console.error('Postgres client emitted error, falling back to CSV and clearing client:', err && err.message ? err.message : err);
      // mark global pgClient null so later requests use CSV fallback
      try { pgClient = null; } catch(e){}
      // best-effort close
      try { client.end().catch(() => {}); } catch(e){}
    });
    // quick test query
    await client.query('SELECT 1');
    console.log('Connected to Postgres for backend API');
    return client;
  }catch(err){
    console.warn('Postgres connection failed, falling back to CSV:', err.message);
    return null;
  }
}

// Helpers for CSV fallback
function findById(list, id){ return list.find(x => String(x.id) === String(id)); }

// Load legacy parts DB (used to serve /api/pecas/* endpoints to keep frontend unchanged)
let PARTS_DB = [];
try{
  const partsPath = path.join(__dirname, '..', 'src', 'parts_db.json');
  if(fs.existsSync(partsPath)){
    PARTS_DB = JSON.parse(fs.readFileSync(partsPath, 'utf8'));
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
    const re = /\d{4}/g;
    (PARTS_DB||[]).forEach(part => {
      try{
        (part.applications||[]).forEach(app => {
          if(typeof app === 'string'){
            let m; while((m = re.exec(app))){ years.add(m[0]); }
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
    return res.json({
      grupos: get_unique('category'),
      pecas: PARTS_DB,
      marcas: extract_brands(),
      modelos: extract_models(),
      anos: extract_years(),
      fabricantes: get_unique('manufacturer')
    });
  }catch(err){
    console.error('Failed to build /api/pecas/meta:', err && err.message ? err.message : err);
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
  if(![categoria, peca, marca, modelo, ano, fabricante].some(v=>v && v.length)){
    return res.json({ pecas: [], total: 0, mensagem: 'Selecione ao menos um filtro para buscar peças.'});
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
