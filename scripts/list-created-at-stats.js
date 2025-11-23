/* List distinct created_at timestamps and counts for 'parts' table in last N days
   Usage: node list-created-at-stats.js [--days=N]
*/
const { createClient } = require('@supabase/supabase-js');

function parseCliArgs() {
  const args = process.argv.slice(2);
  const out = { days: 7 };
  for (const a of args) {
    if (a.startsWith('--days=')) out.days = Number(a.split('=')[1]) || 7;
  }
  return out;
}

async function main() {
  const { days } = parseCliArgs();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. Load backend/.env first.');
    process.exit(1);
  }
  const sb = createClient(supabaseUrl.replace(/\/$/, ''), supabaseKey, { auth: { persistSession: false } });
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  console.log(`Listing distinct created_at timestamps for 'parts' since ${since}`);

  // Use raw SQL via rpc or via from/select; supabase-js doesn't support groupBy in a straightforward way, so use rpc to run SQL function
  const sql = `SELECT created_at, count(*) as cnt FROM parts WHERE created_at >= '${since}' GROUP BY created_at ORDER BY created_at DESC LIMIT 50`;
  try {
    const res = await sb.rpc('run_sql', { q: sql });
    // Some Supabase projects expose run_sql; if not, fall back to selecting a few rows sorted by created_at
    if (res && res.data) {
      console.log('res from rpc run_sql:', res.data);
    } else {
      console.warn('RPC run_sql not available or returned no data; falling back to sample list');
      const { data, error } = await sb.from('parts').select('created_at', { count: 'exact' }).gte('created_at', since).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      const map = {};
      data.forEach(r => { const k = r.created_at; map[k] = (map[k] || 0) + 1; });
      const entries = Object.entries(map).sort((a,b)=> new Date(b[0]) - new Date(a[0]));
      console.table(entries.slice(0,50).map(e=>({created_at:e[0],count:e[1]})));
    }
  } catch (err) {
    console.error('Failed to list timestamps via RPC, falling back to sample list. Error:', err && err.message ? err.message : err);
    const { data, error } = await sb.from('parts').select('created_at', { count: 'exact' }).gte('created_at', since).order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    const map = {};
    data.forEach(r => { const k = r.created_at; map[k] = (map[k] || 0) + 1; });
    const entries = Object.entries(map).sort((a,b)=> new Date(b[0]) - new Date(a[0]));
    console.table(entries.slice(0,50).map(e=>({created_at:e[0],count:e[1]})));
  }
}

main().catch(err=>{ console.error('Error:', err && err.message ? err.message : err); process.exit(1); });
