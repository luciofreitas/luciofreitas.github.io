const http = require('http');

// Test 1: Search by Direção
console.log('=== TESTE 1: Buscar apenas por Direção ===\n');

const data1 = JSON.stringify({ grupo: 'Direção' });

const req1 = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/pecas/filtrar',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data1.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const result = JSON.parse(body);
    console.log(`Resultado: ${result.total} peças`);
    if (result.total > 0) {
      console.log('Primeira:', result.pecas[0].name);
    }
    
    // Test 2: Search without filters to see all parts
    console.log('\n=== TESTE 2: Buscar fabricante ZF ===\n');
    
    const data2 = JSON.stringify({ fabricante: 'ZF' });
    const req2 = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/pecas/filtrar',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data2.length
      }
    }, (res2) => {
      let body2 = '';
      res2.on('data', (chunk) => body2 += chunk);
      res2.on('end', () => {
        const result2 = JSON.parse(body2);
        console.log(`Resultado: ${result2.total} peças da ZF`);
        if (result2.total > 0) {
          result2.pecas.slice(0, 3).forEach(p => {
            console.log(`  - ${p.name} (${p.category})`);
          });
        }
      });
    });
    req2.on('error', (e) => console.error('Erro teste 2:', e.message));
    req2.write(data2);
    req2.end();
  });
});

req1.on('error', (e) => console.error('Erro teste 1:', e.message));
req1.write(data1);
req1.end();
