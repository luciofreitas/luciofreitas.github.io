const fs = require('fs');
const path = require('path');

function uniqSorted(arr) {
  return Array.from(new Set((arr || []).filter(Boolean).map(v => String(v).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function main() {
  const repoRoot = path.join(__dirname, '..');
  const srcPath = path.join(repoRoot, 'src', 'data', 'parts_db.json');
  const publicDataDir = path.join(repoRoot, 'public', 'data');
  const outPath = path.join(publicDataDir, 'parts_meta.json');

  if (!fs.existsSync(srcPath)) {
    console.error('[generate-parts-meta] source not found:', srcPath);
    process.exitCode = 1;
    return;
  }

  const raw = fs.readFileSync(srcPath, 'utf8');
  const parts = JSON.parse(raw);
  if (!Array.isArray(parts)) {
    console.error('[generate-parts-meta] invalid JSON shape: expected array');
    process.exitCode = 1;
    return;
  }

  const grupos = uniqSorted(parts.map(p => p && p.category));
  const pecas = uniqSorted(parts.map(p => p && p.name));
  const fabricantes = uniqSorted(parts.map(p => p && p.manufacturer));

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
  console.log('[generate-parts-meta] wrote', outPath, `(${Buffer.byteLength(JSON.stringify(meta))} bytes)`);
}

main();
