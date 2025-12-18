const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testando busca direta no Supabase:\n');
  
  // Teste 1: Buscar apenas por categoria Direção
  console.log('=== TESTE 1: Buscar grupo Direção ===');
  const { data: direcao, error: err1 } = await supabase
    .from('parts')
    .select('*')
    .eq('category', 'Direção');
  
  if (err1) {
    console.error('Erro:', err1.message);
  } else {
    console.log(`Total: ${direcao.length} peças de Direção`);
    if (direcao.length > 0) {
      console.log('Exemplo:', direcao[0].name, '|', direcao[0].manufacturer);
    }
  }
  
  // Teste 2: Comparação com arquivo JSON
  console.log('\n=== TESTE 2: Comparar com parts_db.json ===');
  const fs = require('fs');
  const path = require('path');
  
  try {
    const jsonPath = path.join(__dirname, '../backend/parts_db.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Total no JSON: ${jsonData.length} peças`);
    
    const direcaoJson = jsonData.filter(p => p.category === 'Direção');
    console.log(`Direção no JSON: ${direcaoJson.length} peças`);
    
    // Comparar total
    const { count, error: err2 } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true });
    
    if (!err2) {
      console.log(`Total no Supabase: ${count} peças`);
      console.log(`\nDiferença: ${count - jsonData.length} peças`);
    }
  } catch (err) {
    console.error('Erro ao ler JSON:', err.message);
  }
}

test();
