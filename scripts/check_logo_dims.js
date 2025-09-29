const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'public', 'logo-teste.png');
if (!fs.existsSync(p)) {
  console.error(JSON.stringify({ error: 'missing', path: p }));
  process.exit(2);
}
const buf = fs.readFileSync(p);
const out = { path: p, size: buf.length };
const head = buf.toString('utf8', 0, 512);
if (head.trim().indexOf('<svg') === 0) {
  out.type = 'svg';
  const vb = head.match(/viewBox\s*=\s*\"([^\"]+)\"/i);
  const w = head.match(/width\s*=\s*\"([^\"]+)\"/i);
  const h = head.match(/height\s*=\s*\"([^\"]+)\"/i);
  out.viewBox = vb ? vb[1] : null;
  out.widthAttr = w ? w[1] : null;
  out.heightAttr = h ? h[1] : null;
  console.log(JSON.stringify(out));
  process.exit(0);
}
// PNG signature
if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
  out.type = 'png';
  const ihdrOff = 8 + 4;
  out.width = buf.readUInt32BE(ihdrOff + 4);
  out.height = buf.readUInt32BE(ihdrOff + 8);
  console.log(JSON.stringify(out));
  process.exit(0);
}
// JPEG signature
if (buf[0] === 0xFF && buf[1] === 0xD8) {
  out.type = 'jpeg';
  // scan for SOF0 marker
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const marker = buf[i+1];
    const len = buf.readUInt16BE(i+2);
    if (marker >= 0xC0 && marker <= 0xC3) {
      out.height = buf.readUInt16BE(i+5);
      out.width = buf.readUInt16BE(i+7);
      console.log(JSON.stringify(out));
      process.exit(0);
    }
    i += 2 + len;
  }
  console.log(JSON.stringify(out));
  process.exit(0);
}
out.type = 'unknown';
console.log(JSON.stringify(out));
process.exit(0);
