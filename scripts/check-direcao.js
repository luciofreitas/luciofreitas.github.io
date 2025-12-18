const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log('Buscando pecas de Direcao...\n');
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('category', 'Direção');
  
  if (error) console.error('Erro:', error);
  else {
    console.log('Total de pecas de Direcao:', data.length);
    if (data.length > 0) {
      console.log('\nExemplo de peca:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Verificar quantas têm Fiat
      const comFiat = data.filter(p => 
        p.applications && p.applications.some(app => 
          app.toLowerCase().includes('fiat')
        )
      );
      console.log('\nPecas de Direcao com Fiat:', comFiat.length);
    }
  }
}

test();
