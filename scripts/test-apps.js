const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // Buscar uma peça qualquer para ver a estrutura
  const { data, error } = await supabase.from('parts').select('*').limit(1);
  if (error) console.error('Erro:', error);
  else {
    console.log('Estrutura de uma peca:');
    console.log(JSON.stringify(data[0], null, 2));
  }
  
  // Teste: Buscar Fiat com overlap
  console.log('\n\nTestando busca por Fiat com overlap:');
  const { data: fiatParts, error: err2 } = await supabase
    .from('parts')
    .select('id, name, applications')
    .overlaps('applications', ['Fiat']);
  
  if (err2) console.error('Erro:', err2);
  else console.log('Encontradas:', fiatParts.length, 'pecas');
}

test();
