const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function copyPath(src, dest) {
  try {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      // Windows pode falhar ao sobrescrever diretórios parcialmente copiados.
      // Remover o destino antes torna a cópia idempotente.
      fs.rmSync(dest, { recursive: true, force: true });
      fs.mkdirSync(dest, { recursive: true });

      const manualCopyDir = () => {
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const from = path.join(src, entry.name);
          const to = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyPath(from, to);
          } else {
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.copyFileSync(from, to);
          }
        }
      };

      try {
        if (typeof fs.cpSync === 'function') {
          fs.cpSync(src, dest, { recursive: true, force: true });
        } else {
          manualCopyDir();
        }
      } catch (e) {
        manualCopyDir();
      }
      console.log('copied dir', src, '->', dest);
      return;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log('copied', src, '->', dest);
  } catch (e) {
    console.warn('failed to copy', src, e && e.message ? e.message : e);
  }
}

// Copy images folder(s)
// Prefer `images/` (new name). If it doesn't exist but `imagens/` does, copy that.
const imagesCandidates = ['images', 'imagens'];
const imagesDest = path.join(dist, 'images');
const imagensDest = path.join(dist, 'imagens');
let copiedAny = false;
imagesCandidates.forEach(dirName => {
  const srcDir = path.join(root, dirName);
  if (fs.existsSync(srcDir)) {
    const items = fs.readdirSync(srcDir);
    items.forEach(item => {
      const s = path.join(srcDir, item);
      const dImages = path.join(imagesDest, item);
      const dImagens = path.join(imagensDest, item);
      copyPath(s, dImages);
      copyPath(s, dImagens);
      copiedAny = true;
    });
  }
});
if (!copiedAny) {
  console.warn('No images/ or imagens/ folder found at', path.join(root));
}

// Copy data parts_db.json from src/data
const partsSrc = path.join(root, 'src', 'data', 'parts_db.json');
const partsDest = path.join(dist, 'data', 'parts_db.json');
if (fs.existsSync(partsSrc)) {
  copyPath(partsSrc, partsDest);
} else {
  console.warn('No src/data/parts_db.json found at', partsSrc);
}

// Note: oauth-callback.html is no longer required for Firebase popup flow.
// If you rely on redirect flows, restore a callback page and copy logic here.

console.log('static copy complete');

// Stamp deploy timestamp into dist/index.html so hosting environments that
// run the build (like Render) will serve a page that indicates the build time.
try {
  const indexPath = path.join(dist, 'index.html');
  if (fs.existsSync(indexPath)) {
    let s = fs.readFileSync(indexPath, 'utf8');
    const ts = new Date().toISOString();
    if (/meta name="deploy-timestamp"/.test(s)) {
      s = s.replace(/<meta name="deploy-timestamp" content="[^"]*">/, `<meta name="deploy-timestamp" content="${ts}">`);
      // also update the commented line if present
      s = s.replace(/<!-- deploy-timestamp: [^>]* -->/, `<!-- deploy-timestamp: ${ts} -->`);
    } else {
      s = s.replace('</head>', `  <!-- deploy-timestamp: ${ts} -->\n  <meta name="deploy-timestamp" content="${ts}">\n</head>`);
    }
    fs.writeFileSync(indexPath, s, 'utf8');
    console.log('Stamped deploy-timestamp into', indexPath, ts);
  }
} catch (e) { console.warn('Failed to stamp deploy-timestamp into dist/index.html', e && e.message ? e.message : e); }
