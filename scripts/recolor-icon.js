const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const [,, filename, color = '#dc2626'] = process.argv;
if(!filename) {
  console.error('Usage: node recolor-icon.js <filename> [hexColor]');
  process.exit(2);
}

const imagesDir = path.join(__dirname, '..', 'images', 'luzes-no-painel');
const src = path.join(imagesDir, filename);
const bak = path.join(imagesDir, `${filename}.bak`);

(async () => {
  try {
    if (!fs.existsSync(src)) throw new Error('Source file not found: ' + src);
    if (!fs.existsSync(bak)) {
      fs.copyFileSync(src, bak);
      console.log('Backup created:', bak);
    } else {
      console.log('Backup already exists:', bak);
    }
    const img = await Jimp.read(bak);
    img.rgba(true);
    img.color([{ apply: 'mix', params: [color, 100] }]);
    await img.writeAsync(src);
    console.log('Recolored image written to:', src);
    process.exit(0);
  } catch (err) {
    console.error('Failed to recolor:', err.message || err);
    process.exit(3);
  }
})();
