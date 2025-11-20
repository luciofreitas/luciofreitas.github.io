const Jimp = require('jimp');
const path = require('path');

const srcBak = path.join(__dirname, '..', 'images', 'luzes-no-painel', 'falha-de-freio.png.bak');
const dest = path.join(__dirname, '..', 'images', 'luzes-no-painel', 'falha-de-freio.png');

(async () => {
  try {
    const img = await Jimp.read(srcBak);
    img.rgba(true);
    // Mix a red color over the image preserving luminosity/shading
    // color 'mix' with 100% applies the color while keeping alpha/luminance
    img.color([{ apply: 'mix', params: ['#dc2626', 100] }]);
    await img.writeAsync(dest);
    console.log('Recolored image written to:', dest);
    process.exit(0);
  } catch (err) {
    console.error('Failed to recolor image:', err.message || err);
    process.exit(2);
  }
})();
