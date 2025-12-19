#!/usr/bin/env node
/**
 * Script para sincronizar dados do Supabase para os arquivos locais
 * Exporta os dados da tabela 'parts' para:
 * - public/data/parts_db.json (usado pelo Vite build e GitHub Pages)
 * - docs/data/parts_db.json (backup)
 * - backend/parts_db.json (usado pelo backend local)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  console.error('   Configure-as no arquivo backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncPartsFromSupabase() {
  console.log('🔄 Sincronizando dados do Supabase...\n');

  try {
    const { data, error, count } = await supabase
      .from('parts')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      process.exit(1);
    }

    console.log(`📊 Total de registros obtidos: ${data.length}`);
    
    // Mostrar estatísticas
    const categorias = {};
    data.forEach(part => {
      categorias[part.category] = (categorias[part.category] || 0) + 1;
    });
    
    console.log('\n📋 Categorias encontradas:');
    Object.entries(categorias)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} peças`);
      });

    const jsonContent = JSON.stringify(data, null, 2);
    
    // Definir os caminhos dos arquivos
    const files = [
      path.join(__dirname, '../public/data/parts_db.json'),
      path.join(__dirname, '../docs/data/parts_db.json'),
      path.join(__dirname, '../backend/parts_db.json')
    ];

    console.log('\n💾 Salvando arquivos...');
    
    for (const filePath of files) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, jsonContent);
      const size = (fs.statSync(filePath).size / 1024).toFixed(2);
      console.log(`   ✅ ${path.relative(process.cwd(), filePath)} (${size} KB)`);
    }

    console.log('\n✨ Sincronização concluída com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Execute: git add public/data/parts_db.json docs/data/parts_db.json backend/parts_db.json');
    console.log('   2. Execute: git commit -m "Sync: Atualizar parts_db.json do Supabase"');
    console.log('   3. Execute: git push origin master');
    console.log('   4. Aguarde ~2-3 minutos para o GitHub Pages atualizar');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

syncPartsFromSupabase();
