/* Preview Supabase parts to delete
   Usage: node preview-delete-imported-parts.js [--days=N]
   Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from env (use backend/.env)
   Default: last 7 days
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
  console.log(`Preview: counting records in 'parts' with created_at >= ${since}`);

  // Count - try RPC first, fallback to select count
  let count = null;
  try {
    const rpcRes = await sb.rpc('count_parts_created_since', { since_ts: since });
    if (rpcRes && rpcRes.data && typeof rpcRes.data === 'number') {
      count = rpcRes.data;
    } else if (rpcRes && typeof rpcRes === 'object' && rpcRes.count != null) {
      count = rpcRes.count;
    }
  } catch (err) {
    console.warn('RPC count_parts_created_since not available or failed, falling back to select count');
  }

  if (count === null) {
    const { error, count: cnt } = await sb.from('parts').select('id', { count: 'exact' }).gte('created_at', since);
    if (error) throw error;
    count = cnt;
  }

  console.log(`Found ~${count} records (created in the last ${days} days)`);

  // Sample up to 10 ids
  const { data: sample, error: sampleErr } = await sb.from('parts').select('id, manufacturer, name, created_at').gte('created_at', since).order('created_at', { ascending: true }).limit(10);
  if (sampleErr) throw sampleErr;
  console.log('Sample rows:');
  console.table(sample || []);
}

main().catch(err => { console.error('Error during preview:', err && err.message ? err.message : err); process.exit(1); });
