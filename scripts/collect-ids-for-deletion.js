/* Collect ids to delete from 'parts' table by created_at window
   Usage: node collect-ids-for-deletion.js --since=2025-11-21T00:00:00Z --until=2025-11-22T00:00:00Z
   Or: node collect-ids-for-deletion.js --days=2  (defaults to last N days)
   Output: writes ids to stdout as JSON array
*/
const { createClient } = require('@supabase/supabase-js');

function parseCliArgs() {
  const args = process.argv.slice(2);
  const out = { days: null, since: null, until: null };
  for (const a of args) {
    if (a.startsWith('--days=')) out.days = Number(a.split('=')[1]) || 2;
    if (a.startsWith('--since=')) out.since = a.split('=')[1];
    if (a.startsWith('--until=')) out.until = a.split('=')[1];
  }
  return out;
}

async function main() {
  const { days, since, until } = parseCliArgs();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. Load backend/.env first.');
    process.exit(1);
  }
  let start = since;
  let end = until;
  if (!start && days) start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  if (!end) end = new Date().toISOString();

  const sb = createClient(supabaseUrl.replace(/\/$/, ''), supabaseKey, { auth: { persistSession: false } });
  console.log(`Collecting ids from 'parts' where created_at >= ${start} and created_at < ${end}`);

  const ids = [];
  const batch = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from('parts').select('id,created_at,manufacturer,name').gte('created_at', start).lt('created_at', end).order('created_at', { ascending: true }).range(offset, offset + batch - 1);
    if (error) {
      console.error('Error fetching ids:', error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    data.forEach(r => ids.push(r));
    offset += data.length;
    if (data.length < batch) break;
  }

  console.log(`Collected ${ids.length} rows. Showing up to 10 samples:`);
  console.table(ids.slice(0,10));
  // Output JSON array of ids to stdout so caller can pipe or capture
  console.log('IDS_JSON_START');
  console.log(JSON.stringify(ids.map(r=>r.id)));
  console.log('IDS_JSON_END');
}

main().catch(err=>{ console.error('Fatal:', err && err.message ? err.message : err); process.exit(1); });
