/* Delete parts created in a time window
   Usage (irreversible):
     node delete-imported-parts-by-window.js --since=2025-11-21T00:00:00Z --until=2025-11-22T00:00:00Z [--batch=200]
   This will collect ids in the window and delete them in batches.
   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set (we load from backend/.env in the wrapper).
*/
const { createClient } = require('@supabase/supabase-js');

function parseCliArgs() {
  const args = process.argv.slice(2);
  const out = { batch: 200, since: null, until: null };
  for (const a of args) {
    if (a.startsWith('--batch=')) out.batch = Number(a.split('=')[1]) || 200;
    if (a.startsWith('--since=')) out.since = a.split('=')[1];
    if (a.startsWith('--until=')) out.until = a.split('=')[1];
  }
  return out;
}

async function main() {
  const { batch, since, until } = parseCliArgs();
  if (!since || !until) {
    console.error('Please provide --since and --until ISO timestamps.');
    process.exit(1);
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. Load backend/.env first.');
    process.exit(1);
  }
  const sb = createClient(supabaseUrl.replace(/\/$/, ''), supabaseKey, { auth: { persistSession: false } });

  console.log(`Collecting ids to delete where created_at >= ${since} and created_at < ${until}`);
  const ids = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from('parts').select('id').gte('created_at', since).lt('created_at', until).order('created_at', { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) {
      console.error('Error fetching ids:', error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    data.forEach(r => ids.push(r.id));
    offset += data.length;
    if (data.length < pageSize) break;
  }

  console.log(`Collected ${ids.length} ids to delete. Deleting in batches of ${batch}...`);
  let deleted = 0;
  for (let i = 0; i < ids.length; i += batch) {
    const batchIds = ids.slice(i, i + batch);
    try {
      const { error } = await sb.from('parts').delete().in('id', batchIds);
      if (error) {
        console.error(`Batch ${Math.floor(i / batch) + 1} error:`, error.message || error);
      } else {
        deleted += batchIds.length;
        console.log(`Batch ${Math.floor(i / batch) + 1}: deleted ${batchIds.length} (total deleted: ${deleted})`);
      }
    } catch (err) {
      console.error(`Batch ${Math.floor(i / batch) + 1} unexpected error:`, err && err.message ? err.message : err);
    }
  }

  console.log(`Done. Attempted to delete ${ids.length} records. Approx deleted: ${deleted}`);
}

main().catch(err => { console.error('Fatal error:', err && err.message ? err.message : err); process.exit(1); });
