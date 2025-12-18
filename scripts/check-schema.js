const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  // Tentar obter uma peça para ver a estrutura
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Erro:', error.message);
  } else {
    console.log('Estrutura da tabela parts:');
    if (data && data.length > 0) {
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('Tabela vazia');
    }
  }
}

checkSchema();
