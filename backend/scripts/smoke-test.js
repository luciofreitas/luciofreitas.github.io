const http = require('http');

function get(path){
  return new Promise((resolve,reject)=>{
    http.get({ host: 'localhost', port: 3001, path, timeout: 3000 }, (res)=>{
      let b=''; res.on('data', c=>b+=c); res.on('end', ()=>resolve({ status: res.statusCode, body: b }));
    }).on('error', reject).on('timeout', ()=>reject(new Error('timeout')));
  });
}

(async ()=>{
  try{
    const h = await get('/api/health');
    console.log('/api/health', h.status, h.body);
    const m = await get('/api/pecas/meta');
    console.log('/api/pecas/meta', m.status, m.body.substring(0, 400));
    process.exit(0);
  }catch(e){ console.error('smoke failed', e && e.message ? e.message : e); process.exit(2); }
})();
