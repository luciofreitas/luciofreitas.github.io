const fetch = require('node-fetch');

async function test() {
  try {
    console.log('Testando busca por Direção...\n');
    
    const response = await fetch('http://localhost:3001/api/pecas/filtrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grupo: 'Direção' })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (text) {
      const result = JSON.parse(text);
      console.log('\nTotal:', result.total);
      if (result.total > 0) {
        console.log('Peças:', result.pecas.map(p => p.name));
      }
    }
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

test();
