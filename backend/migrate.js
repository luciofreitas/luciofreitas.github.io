#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

async function run(){
  const cfg = buildPgConfig();
  if(!cfg){
    console.error('No Postgres configuration detected. Please set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE');
    process.exit(1);
  }
  const client = new Client(cfg);
  try{
    await client.connect();
    console.log('Connected to Postgres');
    
    // Apply all .sql files in migrations/ in sorted order
    const migrationsDir = path.join(__dirname, 'migrations');
    if(fs.existsSync(migrationsDir)){
      const files = fs.readdirSync(migrationsDir).filter(f=>f.toLowerCase().endsWith('.sql')).sort();
      for(const f of files){
        const p = path.join(migrationsDir, f);
        try{
          const sql = fs.readFileSync(p, 'utf8');
          console.log('Applying migration', p);
          await client.query(sql);
          console.log('Applied', f);
        }catch(e){
          console.warn('Migration', f, 'failed:', e && e.message ? e.message : e);
        }
      }
    }
    
    // Executar schema.sql legado se existir
    const sqlPath = path.join(__dirname, '..', 'db', 'schema.sql');
    if(fs.existsSync(sqlPath)){
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log('Applying legacy schema from', sqlPath);
      try{
        await client.query(sql);
        console.log('Legacy migration applied successfully');
      }catch(e){
        console.warn('Direct full-file execution failed, attempting split execution:', e.message);
        const statements = sql.split(/;\s*\n/).map(s=>s.trim()).filter(Boolean);
        for(const stmt of statements){
          try{ await client.query(stmt); }catch(err){ console.error('Statement failed:', err.message); }
        }
        console.log('Migration finished with split execution');
      }
    }
    
    // Popular dados de parts_db.json se existir
    await populateProducts(client);
    
    console.log('All migrations completed');
  }catch(err){
    console.error('Migration failed:', err && err.message ? err.message : err);
    process.exit(1);
  }finally{
    try{ await client.end(); }catch(e){}
  }
}

async function populateProducts(client){
  try{
    // Verificar se já existem produtos
    const checkResult = await client.query('SELECT COUNT(*) as count FROM products');
    if(checkResult.rows[0].count > 0){
      console.log('Products table already has data, skipping population');
      return;
    }
    
    // Tentar carregar parts_db.json
    const partsJsonPaths = [
      path.join(__dirname, 'parts_db.json'),
      path.join(__dirname, '..', 'data', 'parts_db.json'),
      path.join(__dirname, '..', 'src', 'data', 'parts_db.json')
    ];
    
    let partsData = null;
    for(const pPath of partsJsonPaths){
      if(fs.existsSync(pPath)){
        console.log('Loading parts from', pPath);
        partsData = JSON.parse(fs.readFileSync(pPath, 'utf8'));
        break;
      }
    }
    
    if(!partsData || !partsData.pecas || partsData.pecas.length === 0){
      console.log('No parts data found to populate');
      return;
    }
    
    console.log(`Populating ${partsData.pecas.length} products...`);
    
    // Obter ID do fabricante genérico
    const mfgResult = await client.query('SELECT id FROM manufacturers WHERE code = $1', ['GEN']);
    const genericMfgId = mfgResult.rows[0]?.id || 1;
    
    for(const peca of partsData.pecas){
      try{
        await client.query(
          `INSERT INTO products (id, nome, descricao, fabricante_id, part_number, imagens, codigos_oem, especificacoes, instalacao, recall_relacionado, recall_detalhes, pecas_relacionadas, perguntas_frequentes, dados_extra)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING`,
          [
            peca.id,
            peca.nome,
            peca.descricao || null,
            genericMfgId,
            peca.part_number || peca.codigo_peca || null,
            JSON.stringify(peca.imagens || []),
            JSON.stringify(peca.codigos || {}),
            JSON.stringify(peca.especificacoes_tecnicas || {}),
            JSON.stringify(peca.instalacao || {}),
            peca.recall_relacionado || false,
            JSON.stringify(peca.recall_detalhes || null),
            JSON.stringify(peca.pecas_relacionadas || []),
            JSON.stringify(peca.perguntasFrequentes || []),
            JSON.stringify(peca)
          ]
        );
        
        // Inserir aplicações se existirem
        if(peca.aplicacoes_detalhadas && Array.isArray(peca.aplicacoes_detalhadas)){
          for(const app of peca.aplicacoes_detalhadas){
            await client.query(
              `INSERT INTO applications (product_id, marca, modelo, ano_inicio, ano_fim, motor, observacoes)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                peca.id,
                app.marca,
                app.modelo,
                app.ano_inicio || null,
                app.ano_fim || null,
                app.motor || null,
                app.observacoes || null
              ]
            );
          }
        }
      }catch(err){
        console.error(`Error inserting product ${peca.id}:`, err.message);
      }
    }
    
    console.log('Products populated successfully');
  }catch(err){
    console.error('Error populating products:', err.message);
  }
}

run();
