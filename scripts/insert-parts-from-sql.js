const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configurar o cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não encontradas');
  console.log('Procurando em:', path.join(__dirname, '..', '.env'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function parseSQLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Remover comentários
  let cleanContent = content.replace(/--.*$/gm, '');
  
  // Extrair os valores INSERT
  const valuesRegex = /\(([^)]+)\)/g;
  const parts = [];
  let match;
  
  while ((match = valuesRegex.exec(cleanContent)) !== null) {
    const values = match[1];
    
    // Ignorar a linha de cabeçalho (que contém "id, name, category, manufacturer...")
    if (values.includes('id, name, category')) {
      continue;
    }
    
    // Parse manual dos valores (considerando strings com vírgulas)
    const parsed = parseValues(values);
    
    if (parsed.length >= 9) {
      parts.push({
        id: parsed[0],
        name: parsed[1],
        category: parsed[2],
        manufacturer: parsed[3],
        part_number: parsed[4],
        description: parsed[5],
        specifications: parsed[6],
        applications: parsed[7],
        created_at: parsed[8]
      });
    }
  }
  
  return parts;
}

function parseValues(valuesString) {
  const result = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  let depth = 0;
  
  for (let i = 0; i < valuesString.length; i++) {
    const char = valuesString[i];
    const nextChar = valuesString[i + 1];
    
    if ((char === "'" || char === '"') && (i === 0 || valuesString[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        // Check if it's an escaped quote
        if (nextChar === stringChar) {
          current += char;
          i++; // Skip next
        } else {
          inString = false;
          stringChar = null;
        }
      } else {
        current += char;
      }
    } else if (char === '{' && inString) {
      current += char;
      depth++;
    } else if (char === '}' && inString) {
      current += char;
      depth--;
    } else if (char === ',' && !inString && depth === 0) {
      result.push(cleanValue(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    result.push(cleanValue(current.trim()));
  }
  
  return result;
}

function cleanValue(value) {
  // Remove aspas externas
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    value = value.slice(1, -1);
  }
  
  // Remove ::jsonb ou ::text[]
  value = value.replace(/::jsonb$/, '').replace(/::text\[\]$/, '');
  
  // Parse JSON se for um objeto ou array
  if (value.startsWith('{') && value.endsWith('}')) {
    // Tenta parsear como JSON
    try {
      // Se é um objeto simples tipo {"texto1","texto2"}, converter para array
      if (!value.includes(':') && !value.includes('[')) {
        // Remove as chaves e split por vírgula respeitando aspas
        const inner = value.slice(1, -1);
        const items = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < inner.length; i++) {
          const char = inner[i];
          if (char === '"' && (i === 0 || inner[i-1] !== '\\')) {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            items.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        if (current.trim()) {
          items.push(current.trim());
        }
        
        return items;
      }
      return JSON.parse(value.replace(/'/g, '"'));
    } catch (e) {
      // Se falhar, tenta extrair como array de strings
      const match = value.match(/{(.+)}/);
      if (match) {
        return [match[1]];
      }
      return value;
    }
  }
  
  return value;
}

async function insertParts(parts) {
  console.log(`🔄 Iniciando inserção de ${parts.length} peças...`);
  
  // Remover duplicatas por ID
  const uniqueParts = [];
  const seenIds = new Set();
  
  for (const part of parts) {
    if (!seenIds.has(part.id)) {
      seenIds.add(part.id);
      uniqueParts.push(part);
    }
  }
  
  console.log(`✅ Removidas ${parts.length - uniqueParts.length} peças duplicadas`);
  console.log(`📦 Inserindo ${uniqueParts.length} peças únicas...`);
  
  // Inserir em lotes de 100
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < uniqueParts.length; i += batchSize) {
    const rawBatch = uniqueParts.slice(i, i + batchSize);
    
    // Debug: mostrar o primeiro item do primeiro lote
    if (i === 0 && rawBatch.length > 0) {
      console.log('Exemplo de dados (primeiro item):');
      console.log(JSON.stringify(rawBatch[0], null, 2));
    }
    
    const batch = rawBatch.map(part => ({
      ...part,
      // Garantir que applications seja um array válido
      applications: Array.isArray(part.applications) 
        ? part.applications 
        : typeof part.applications === 'string' 
          ? [part.applications] 
          : []
    }));
    
    try {
      const { data, error } = await supabase
        .from('parts')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error.message);
        console.error('Detalhes:', error);
        errors += batch.length;
      } else {
        inserted += batch.length;
        console.log(`✅ Lote ${Math.floor(i / batchSize) + 1}: ${batch.length} peças inseridas (${inserted}/${uniqueParts.length})`);
      }
    } catch (err) {
      console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, err.message);
      errors += batch.length;
    }
  }
  
  console.log(`\n🎉 Processo concluído!`);
  console.log(`   ✅ Inseridas: ${inserted}`);
  console.log(`   ❌ Erros: ${errors}`);
}

async function main() {
  try {
    const sqlFilePath = path.join(__dirname, '..', 'insert_all_500_parts_fixed.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Arquivo SQL não encontrado:', sqlFilePath);
      process.exit(1);
    }
    
    console.log('📖 Lendo arquivo SQL...');
    const parts = await parseSQLFile(sqlFilePath);
    
    console.log(`✅ ${parts.length} peças encontradas no arquivo SQL`);
    
    await insertParts(parts);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
