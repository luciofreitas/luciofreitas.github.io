const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function parseSQLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Split por INSERT INTO para pegar cada bloco
  const insertBlocks = content.split(/INSERT INTO[^V]+VALUES/gi);
  const parts = [];
  
  for (const block of insertBlocks) {
    if (!block.trim()) continue;
    
    // Usar regex para pegar cada linha de valores entre parênteses
    const regex = /\('(\d+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'({[^}]+})'::jsonb,\s*''({[^}]+})'',\s*'([^']+)'\)/g;
    
    let match;
    while ((match = regex.exec(block)) !== null) {
      try {
        const specs = JSON.parse(match[7].replace(/'/g, '"'));
        const apps = match[8].split('","').map(s => s.replace(/["{]/g, ''));
        
        parts.push({
          id: match[1],
          name: match[2],
          category: match[3],
          manufacturer: match[4],
          part_number: match[5],
          description: match[6],
          specifications: specs,
          applications: apps,
          created_at: match[9]
        });
      } catch (e) {
        console.error('Erro ao parsear linha:', match[0].substring(0, 50));
      }
    }
  }
  
  return parts;
}

async function insertParts(parts) {
  console.log(🔄 Inserindo  peças...);
  
  const uniqueParts = [];
  const seenIds = new Set();
  
  for (const part of parts) {
    if (!seenIds.has(part.id)) {
      seenIds.add(part.id);
      uniqueParts.push(part);
    }
  }
  
  console.log(✅ Removidas  duplicadas);
  console.log(📦 Inserindo  únicas...);
  
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < uniqueParts.length; i += batchSize) {
    const batch = uniqueParts.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('parts')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(❌ Lote :, error.message);
    } else {
      inserted += batch.length;
      console.log(✅ Lote : /);
    }
  }
  
  console.log(\n🎉 Concluído!  peças inseridas);
}

async function main() {
  const sqlFile = path.join(__dirname, '..', 'insert_all_500_parts.sql');
  console.log('📖 Lendo arquivo SQL...');
  const parts = await parseSQLFile(sqlFile);
  console.log(✅  peças encontradas);
  await insertParts(parts);
}

main();
