const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('parts')
    .select('category');
  
  if (error) console.error('Erro:', error);
  else {
    const categories = [...new Set(data.map(p => p.category))].sort();
    console.log('Categorias/Grupos disponiveis no banco:');
    categories.forEach(c => console.log('  -', c));
    console.log('\nTotal de grupos:', categories.length);
  }
}

test();
