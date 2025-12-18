const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // Teste 1: Buscar todas as peças
  console.log('\n=== TESTE 1: Buscar todas as pecas ===');
  const { data: all, error: err1 } = await supabase.from('parts').select('*').limit(5);
  if (err1) console.error('Erro:', err1);
  else console.log('Total de pecas (sample):', all.length);
  
  // Teste 2: Buscar peças com categoria "Ignição"
  console.log('\n=== TESTE 2: Buscar por categoria Ignicao ===');
  const { data: byCategory, error: err2 } = await supabase.from('parts').select('*').eq('category', 'Ignição').limit(3);
  if (err2) console.error('Erro:', err2);
  else console.log('Encontradas:', byCategory.length, 'pecas', byCategory.map(p => p.name));
  
  // Teste 3: Buscar peças com Fiat nas applications
  console.log('\n=== TESTE 3: Buscar Fiat nas applications ===');
  const { data: byFiat, error: err3 } = await supabase.from('parts').select('*').filter('applications', 'cs', '{Fiat}').limit(3);
  if (err3) console.error('Erro:', err3);
  else {
    console.log('Encontradas:', byFiat.length, 'pecas para Fiat');
    if (byFiat.length > 0) {
      console.log('Exemplo:', JSON.stringify(byFiat[0], null, 2));
    }
  }
  
  // Teste 4: Contar total de peças
  console.log('\n=== TESTE 4: Contar total de pecas ===');
  const { count, error: err4 } = await supabase.from('parts').select('*', { count: 'exact', head: true });
  if (err4) console.error('Erro:', err4);
  else console.log('Total de pecas no banco:', count);
}

test();
