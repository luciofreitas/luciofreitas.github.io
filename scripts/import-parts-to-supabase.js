#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY in env.');
    process.exit(1);
  }

  const table = process.env.SUPABASE_PARTS_TABLE || 'parts';
  const jsonFile = process.argv[2] || path.join(__dirname, '..', 'data', 'parts_db.json');

  let previewCount = null;
  for (const arg of process.argv.slice(3)) {
    if (arg.startsWith('--preview=')) previewCount = Number(arg.split('=')[1]) || null;
    if (arg.startsWith('--batch=')) process.env.IMPORT_BATCH = arg.split('=')[1];
  }

  const batchSize = Number(process.env.IMPORT_BATCH) || 200;

  console.log(`Using Supabase: ${supabaseUrl}`);
  console.log(`Target table: ${table}`);
  console.log(`Reading JSON from: ${jsonFile}`);

  let raw;
  try {
    raw = fs.readFileSync(jsonFile, 'utf8');
  } catch (err) {
    console.error('Failed to read JSON file:', err.message);
    process.exit(1);
  }

  let items;
  try {
    items = JSON.parse(raw);
  } catch (err) {
    console.error('Invalid JSON:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(items)) {
    console.error('Expected top-level array in JSON.');
    process.exit(1);
  }

  if (previewCount) items = items.slice(0, previewCount);

  const supabase = createClient(supabaseUrl.replace(/\/$/, ''), supabaseKey, { auth: { persistSession: false } });

  // Normalize each item to match table cols: keep specifications as JSON, applications as array
  const prepared = items.map(i => ({
    id: i.id != null ? String(i.id) : null,
    name: i.name || null,
    category: i.category || null,
    manufacturer: i.manufacturer || null,
    part_number: i.part_number || i.partNumber || null,
    description: i.description || null,
    specifications: i.specifications || null,
    applications: Array.isArray(i.applications) ? i.applications : (i.applications ? [i.applications] : []),
  }));

  console.log(`Inserting ${prepared.length} records in batches of ${batchSize}...`);

  let inserted = 0;
  // Use upsert to avoid duplicate primary key errors: update existing rows by `id`.
  for (let i = 0; i < prepared.length; i += batchSize) {
    const batch = prepared.slice(i, i + batchSize);
    try {
      const { data, error } = await supabase.from(table).upsert(batch, { onConflict: 'id', returning: 'minimal' });
      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error.message || error);
      } else {
        inserted += batch.length;
        console.log(`Batch ${i / batchSize + 1}: upserted ${batch.length} records (total ${inserted})`);
      }
    } catch (err) {
      console.error(`Batch ${i / batchSize + 1} unexpected error:`, err && err.message ? err.message : err);
    }
  }

  console.log(`Done. Attempted to insert ${prepared.length} records. Approx inserted: ${inserted}`);
}

main().catch(err => {
  console.error('Fatal error:', err && err.message ? err.message : err);
  process.exit(1);
});
