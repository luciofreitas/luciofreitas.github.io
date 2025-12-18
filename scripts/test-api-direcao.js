const http = require('http');

const data = JSON.stringify({ grupo: 'Direção' });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/pecas/filtrar',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Enviando requisição para buscar peças de Direção...\n');

const req = http.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      console.log(`✅ Total encontrado: ${result.total} peças`);
      
      if (result.total > 0) {
        console.log('\nPrimeiras peças:');
        result.pecas.slice(0, 5).forEach((peca, i) => {
          console.log(`${i+1}. ${peca.name} - ${peca.manufacturer}`);
        });
      } else {
        console.log('\n❌ Nenhuma peça encontrada!');
      }
    } catch (err) {
      console.error('Erro ao parsear resposta:', err.message);
      console.log('Resposta:', body);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro na requisição: ${e.message}`);
  console.error('Stack:', e.stack);
  console.error('Code:', e.code);
});

req.write(data);
req.end();
