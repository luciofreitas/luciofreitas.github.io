const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log('Teste 1: Buscar usando textSearch');
  const { data: test1, error: err1 } = await supabase
    .from('parts')
    .select('id, name, applications')
    .textSearch('applications', 'Fiat', { type: 'plain' });
  
  console.log('Resultado:', test1 ? test1.length : 0, 'pecas');
  if (err1) console.log('Erro:', err1.message);
  
  console.log('\nTeste 2: Buscar usando like');
  const { data: test2, error: err2 } = await supabase
    .from('parts')
    .select('id, name, applications')
    .like('applications', '%Fiat%');
  
  console.log('Resultado:', test2 ? test2.length : 0, 'pecas');
  if (err2) console.log('Erro:', err2.message);
  
  console.log('\nTeste 3: Buscar usando cs (contains)');
  const { data: test3, error: err3 } = await supabase
    .from('parts')
    .select('id, name, applications')
    .contains('applications', ['Fiat Uno 2010-2011-2012-2013-2014-2015']);
  
  console.log('Resultado:', test3 ? test3.length : 0, 'pecas');
  if (err3) console.log('Erro:', err3.message);
}

test();
