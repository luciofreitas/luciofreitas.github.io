const Jimp = require('jimp');
const path = require('path');

const imgs = ['falha-de-freio.png', 'freio-de-mao.png'];

(async () => {
  for (const name of imgs) {
    const p = path.join(__dirname, '..', 'images', 'luzes-no-painel', name);
    try {
      const img = await Jimp.read(p);
      let r=0,g=0,b=0,count=0;
      img.scan(0,0,img.bitmap.width,img.bitmap.height, function(x,y,idx){
        const alpha = this.bitmap.data[idx+3];
        if (alpha>10) {
          r += this.bitmap.data[idx+0];
          g += this.bitmap.data[idx+1];
          b += this.bitmap.data[idx+2];
          count++;
        }
      });
      if(count===0) { console.log(name+': no pixels counted'); continue; }
      r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
      const hex = ((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1);
      console.log(`${name}: avg rgb=${r},${g},${b} hex=#${hex}`);
    } catch (e) {
      console.error('error reading', name, e.message || e);
    }
  }
})();
