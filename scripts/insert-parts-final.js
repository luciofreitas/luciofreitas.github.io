const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variaveis de ambiente nao encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function parseSQLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex para capturar cada INSERT de forma individual
  const regex = /\('(\d+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'({[^}]+})'::jsonb,\s*''({[^}]+})'',\s*'([^']+)'\)/g;
  
  const parts = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    try {
      // Parse specifications
      const specs = JSON.parse(match[7].replace(/'/g, '"'));
      
      // Parse applications - remover as chaves e split
      const appsRaw = match[8].replace(/^{|}$/g, '');
      const apps = appsRaw.split('","').map(s => s.replace(/"/g, ''));
      
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
      console.error('Erro ao parsear:', e.message);
    }
  }
  
  return parts;
}

async function insertParts(parts) {
  console.log(`Inserindo ${parts.length} pecas...`);
  
  // Remover duplicatas
  const uniqueParts = [];
  const seenIds = new Set();
  
  for (const part of parts) {
    if (!seenIds.has(part.id)) {
      seenIds.add(part.id);
      uniqueParts.push(part);
    }
  }
  
  console.log(`Removidas ${parts.length - uniqueParts.length} duplicadas`);
  console.log(`Inserindo ${uniqueParts.length} unicas...`);
  
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < uniqueParts.length; i += batchSize) {
    const batch = uniqueParts.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('parts')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Erro lote ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Lote ${Math.floor(i / batchSize) + 1}: ${inserted}/${uniqueParts.length}`);
    }
  }
  
  console.log(`\nConcluido! ${inserted} pecas inseridas`);
}

async function main() {
  const sqlFile = path.join(__dirname, '..', 'insert_all_500_parts.sql');
  console.log('Lendo arquivo SQL...');
  const parts = await parseSQLFile(sqlFile);
  console.log(`${parts.length} pecas encontradas`);
  await insertParts(parts);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
