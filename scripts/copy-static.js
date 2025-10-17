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

// Copy images folder
const imagensSrc = path.join(root, 'imagens');
const imagensDest = path.join(dist, 'imagens');
if (fs.existsSync(imagensSrc)) {
  const items = fs.readdirSync(imagensSrc);
  items.forEach(item => {
    const s = path.join(imagensSrc, item);
    const d = path.join(imagensDest, item);
    copyFile(s, d);
  });
} else {
  console.warn('No imagens/ folder found at', imagensSrc);
}

// Copy data parts_db.json from src/data
const partsSrc = path.join(root, 'src', 'data', 'parts_db.json');
const partsDest = path.join(dist, 'data', 'parts_db.json');
if (fs.existsSync(partsSrc)) {
  copyFile(partsSrc, partsDest);
} else {
  console.warn('No src/data/parts_db.json found at', partsSrc);
}

console.log('static copy complete');
