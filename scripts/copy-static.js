const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function copyFile(src, dest) {
  try {
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
let copiedAny = false;
imagesCandidates.forEach(dirName => {
  const srcDir = path.join(root, dirName);
  if (fs.existsSync(srcDir)) {
    const items = fs.readdirSync(srcDir);
    items.forEach(item => {
      const s = path.join(srcDir, item);
      const d = path.join(imagesDest, item);
      copyFile(s, d);
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
  copyFile(partsSrc, partsDest);
} else {
  console.warn('No src/data/parts_db.json found at', partsSrc);
}

// Note: oauth-callback.html is no longer required for Firebase popup flow.
// If you rely on redirect flows, restore a callback page and copy logic here.

console.log('static copy complete');
