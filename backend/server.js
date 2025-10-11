// Minimal backend server (new entrypoint)
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(__dirname, 'users.json');

function loadJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function saveJson(p, obj) { try { fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8'); } catch (e) { /* ignore */ } }

let users = loadJson(USERS_FILE) || [];
const partsDb = loadJson(path.join(DATA_DIR, 'parts_db.json')) || [];
const partsDetailed = loadJson(path.join(DATA_DIR, 'parts_detailed.json')) || [];
const luzes = loadJson(path.join(DATA_DIR, 'luzes_painel.json')) || null;

app.get('/api/pecas/meta', (req, res) => res.json(partsDb));

// Health endpoint for smoke tests
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.post('/api/pecas/filtrar', (req, res) => {
  const q = req.body || {};
  let list = partsDb.slice();
  if (q.grupo) list = list.filter(p => String(p.category || '').toLowerCase() === String(q.grupo).toLowerCase());
  if (q.marca) list = list.filter(p => (p.manufacturer || '').toLowerCase().includes(String(q.marca).toLowerCase()));
  if (q.ano) list = list.filter(p => {
    const apps = p.applications || [];
    return apps.some(a => typeof a === 'string' && a.includes(String(q.ano)));
  });
  res.json({ pecas: list, total: list.length });
});

app.get('/api/pecas/:id', (req, res) => {
  const id = req.params.id;
  const found = partsDetailed.find(p => String(p.id) === String(id)) || partsDb.find(p => String(p.id) === String(id));
  if (!found) return res.status(404).json({ error: 'Peça não encontrada' });
  res.json(found);
});

app.get('/api/luzes-painel', (req, res) => {
  if (luzes) return res.json(luzes);
  return res.status(404).json({ error: 'Not found' });
});

app.post('/api/users', (req, res) => {
  const { nome, email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Usuário já existe' });
  const user = { id: `u_${Date.now()}`, nome: nome || '', email, senha };
  users.push(user);
  saveJson(USERS_FILE, users);
  return res.status(201).json({ id: user.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  return res.json({ user: { id: user.id, name: user.nome || '', email: user.email } });
});

app.all('/api/*', (req, res) => res.status(501).json({ error: 'Not implemented in local dev server' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Parts API (server.js) listening on http://0.0.0.0:${PORT}`));
