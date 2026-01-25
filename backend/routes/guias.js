const express = require('express');
const fs = require('fs');
const path = require('path');

// Module-local getter for pgClient to avoid circular requires. Index.js sets this via setPgClientGetter(() => pgClient).
let getPgClient = () => null;
function setPgClientGetter(fn) { getPgClient = fn; }

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

const router = express.Router();

// GET /api/guias
router.get('/', async (req, res) => {
  const pgClient = getPgClient();
  if(pgClient){
    try{
      const result = await pgClient.query('SELECT * FROM guias WHERE status = $1 ORDER BY criado_em DESC', ['ativo']);
      const mapped = result.rows.map(row => snakeToCamelKeys(row));
      return res.json(mapped);
    }catch(err){ console.error('PG query failed /api/guias:', err && err.message ? err.message : err); }
  }

  const candidates = [
    path.join(__dirname, '..', 'data', 'guias.json'),
    // Repo root: public/data/guias.json
    path.join(__dirname, '..', '..', 'public', 'data', 'guias.json'),
  ];
  for (const guiasPath of candidates) {
    if (fs.existsSync(guiasPath)) {
      const guias = JSON.parse(fs.readFileSync(guiasPath, 'utf8'));
      return res.json(guias);
    }
  }
  res.json([]);
});

// GET /api/guias/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const pgClient = getPgClient();
  if (pgClient) {
    try {
      const result = await pgClient.query('SELECT * FROM guias WHERE id = $1', [id]);
      if (!result.rows || !result.rows.length) return res.status(404).json({ error: 'not found' });
      return res.json(snakeToCamelKeys(result.rows[0]));
    } catch (err) {
      console.error('PG query failed /api/guias/:id:', err && err.message ? err.message : err);
    }
  }

  const candidates = [
    path.join(__dirname, '..', 'data', 'guias.json'),
    path.join(__dirname, '..', '..', 'public', 'data', 'guias.json'),
  ];
  for (const guiasPath of candidates) {
    if (fs.existsSync(guiasPath)) {
      try {
        const guias = JSON.parse(fs.readFileSync(guiasPath, 'utf8'));
        const found = (Array.isArray(guias) ? guias : []).find(g => String(g.id) === String(id));
        if (!found) return res.status(404).json({ error: 'not found' });
        return res.json(found);
      } catch (e) {
        console.error('Failed to read guias fallback JSON:', e && e.message ? e.message : e);
        break;
      }
    }
  }

  return res.status(404).json({ error: 'not found' });
});

// POST /api/guias
router.post('/', async (req, res) => {
  const guia = req.body;
  try {
    console.info('Received POST /api/guias id=%s autor=%s', guia && guia.id ? guia.id : '(no-id)', guia && guia.autorEmail ? guia.autorEmail : '(no-author)');
  } catch(e) { console.warn('Failed to log incoming guia payload:', e && e.message ? e.message : e); }

  const pgClient = getPgClient();
  if(pgClient){
    try{
      const id = guia.id || `guia_${Date.now()}`;
      const insertSql = `INSERT INTO guias(id, autor_email, titulo, descricao, categoria, conteudo, imagem, criado_em, atualizado_em, status)
         VALUES($1, $2, $3, $4, $5, $6, $7, now(), now(), $8) RETURNING *`;
      const result = await pgClient.query(insertSql, [id, guia.autorEmail, guia.titulo, guia.descricao, guia.categoria, guia.conteudo, guia.imagem || null, guia.status || 'ativo']);
      const created = result.rows && result.rows[0] ? snakeToCamelKeys(result.rows[0]) : { id };
      return res.json({ success: true, id, guia: created });
    }catch(err){ 
      console.error('Error creating guia:', err && err.message ? err.message : err); 
      return res.status(500).json({ error: err && err.message ? err.message : String(err) }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

// PUT /api/guias/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const guia = req.body;
  const pgClient = getPgClient();
  if(pgClient){
    try{
      await pgClient.query(
        `UPDATE guias SET titulo=$1, descricao=$2, categoria=$3, conteudo=$4, imagem=$5, atualizado_em=now() WHERE id=$6`,
        [guia.titulo, guia.descricao, guia.categoria, guia.conteudo, guia.imagem, id]
      );
      return res.json({ success: true });
    }catch(err){ 
      console.error('Error updating guia:', err && err.message ? err.message : err); 
      return res.status(500).json({ error: err && err.message ? err.message : String(err) }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

// DELETE /api/guias/:id (soft-delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const pgClient = getPgClient();
  if(pgClient){
    try{
      await pgClient.query('UPDATE guias SET status=$1 WHERE id=$2', ['inativo', id]);
      return res.json({ success: true });
    }catch(err){ 
      console.error('Error deleting guia:', err && err.message ? err.message : err); 
      return res.status(500).json({ error: err && err.message ? err.message : String(err) }); 
    }
  }
  return res.status(500).json({ error: 'Database not available' });
});

// POST /api/guias/:id/ratings
router.post('/:id/ratings', async (req, res) => {
  const { id } = req.params;
  const { userEmail, rating } = req.body || {};
  if (!userEmail || typeof rating !== 'number') {
    return res.status(400).json({ error: 'userEmail and numeric rating are required' });
  }

  const pgClient = getPgClient();
  if (pgClient) {
    try {
      const result = await pgClient.query('SELECT ratings FROM guias WHERE id = $1', [id]);
      const existing = result && result.rows && result.rows[0] ? result.rows[0].ratings || [] : [];
      const filtered = (existing || []).filter(r => String(r.userEmail || '').toLowerCase() !== String(userEmail).toLowerCase());
      const novo = { userEmail, rating, timestamp: new Date().toISOString() };
      filtered.push(novo);
      const upd = await pgClient.query('UPDATE guias SET ratings = $1 WHERE id = $2 RETURNING *', [JSON.stringify(filtered), id]);
      const updated = upd && upd.rows && upd.rows[0] ? snakeToCamelKeys(upd.rows[0]) : null;
      return res.json({ success: true, guia: updated });
    } catch (err) {
      console.error('Error adding rating to guia:', err && err.message ? err.message : err);
      return res.status(500).json({ error: err && err.message ? err.message : String(err) });
    }
  }

  return res.status(500).json({ error: 'Database not available' });
});

// POST /api/guias/ratings (body-based fallback)
router.post('/ratings', async (req, res) => {
  const { guiaId, userEmail, rating } = req.body || {};
  if (!guiaId || !userEmail || typeof rating !== 'number') {
    return res.status(400).json({ error: 'guiaId, userEmail and numeric rating are required' });
  }

  const pgClient = getPgClient();
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

module.exports = { router, setPgClientGetter };
