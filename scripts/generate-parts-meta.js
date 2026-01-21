const fs = require('fs');
const path = require('path');

function uniqSorted(arr) {
  return Array.from(new Set((arr || []).filter(Boolean).map(v => String(v).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function readFirstExistingJson(candidatePaths) {
  for (const candidatePath of candidatePaths) {
    if (!candidatePath) continue;
    if (!fs.existsSync(candidatePath)) continue;
    try {
      const raw = fs.readFileSync(candidatePath, 'utf8');
      return { path: candidatePath, json: JSON.parse(raw) };
    } catch (err) {
      console.error('[generate-parts-meta] failed reading/parsing:', candidatePath);
      console.error(err);
      return { path: candidatePath, json: null, error: err };
    }
  }
  return null;
}

function coercePartsArray(maybeJson) {
  if (Array.isArray(maybeJson)) return maybeJson;
  if (maybeJson && Array.isArray(maybeJson.parts)) return maybeJson.parts;
  if (maybeJson && Array.isArray(maybeJson.data)) return maybeJson.data;
  return null;
}

function pickField(obj, keys) {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') return obj[key];
  }
  return undefined;
}

function main() {
  const repoRoot = path.join(__dirname, '..');
  const publicDataDir = path.join(repoRoot, 'public', 'data');
  const outPath = path.join(publicDataDir, 'parts_meta.json');

  // NOTE: `src/data/parts_db.json` is ignored by .gitignore in this repo, so it won't exist in CI.
  // Prefer committed sources so GitHub Actions build doesn't fail.
  const candidateSources = [
    path.join(publicDataDir, 'parts_db.json'),
    path.join(repoRoot, 'src', 'data', 'parts_db.json'),
    path.join(repoRoot, 'data', 'parts_detailed.json'),
  ];

  const source = readFirstExistingJson(candidateSources);
  const parts = source ? coercePartsArray(source.json) : null;

  if (!parts) {
    console.warn('[generate-parts-meta] no valid source found; writing empty meta. candidates:', candidateSources);
    const emptyMeta = {
      version: 1,
      generatedAt: new Date().toISOString(),
      counts: { parts: 0, grupos: 0, pecas: 0, fabricantes: 0 },
      grupos: [],
      pecas: [],
      fabricantes: [],
    };
    fs.mkdirSync(publicDataDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(emptyMeta, null, 2) + '\n', 'utf8');
    console.log('[generate-parts-meta] wrote', outPath, '(empty meta)');
    return;
  }

  const grupos = uniqSorted(parts.map(p => pickField(p, ['category', 'categoria', 'grupo', 'grouping'])));
  const pecas = uniqSorted(parts.map(p => pickField(p, ['name', 'nome', 'peca'])));
  const fabricantes = uniqSorted(parts.map(p => pickField(p, ['manufacturer', 'fabricante', 'marca_fabricante'])));

  const meta = {
    version: 1,
    generatedAt: new Date().toISOString(),
    counts: {
      parts: parts.length,
      grupos: grupos.length,
      pecas: pecas.length,
      fabricantes: fabricantes.length,
    },
    grupos,
    pecas,
    fabricantes,
  };

  fs.mkdirSync(publicDataDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  if (source && source.path) console.log('[generate-parts-meta] source:', source.path);
  console.log('[generate-parts-meta] wrote', outPath, `(${Buffer.byteLength(JSON.stringify(meta))} bytes)`);
}

main();
