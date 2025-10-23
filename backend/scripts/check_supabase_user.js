// Script de debugging: checar usuário Supabase via admin API
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
(async () => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !key) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
      process.exit(2);
    }
    const supabaseAdmin = createClient(url, key);
    const email = process.argv[2] || 'luciodfp@gmail.com';
    console.log('Checking Supabase user for email:', email);
    if (!(supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin)) {
      console.error('Supabase admin API not available in this client.');
      process.exit(3);
    }
    try {
      const res = await supabaseAdmin.auth.admin.getUserByEmail(email);
      console.log('Result:', JSON.stringify(res, null, 2));
    } catch (e) {
      console.error('Error from getUserByEmail:', e && e.message ? e.message : e);
      // fallback: try listing users and filtering
      try {
        const listRes = await supabaseAdmin.auth.admin.listUsers();
        const users = (listRes && listRes.data && listRes.data.users) ? listRes.data.users : (listRes && listRes.data) ? listRes.data : [];
        const found = users.find(u => u.email && String(u.email).toLowerCase() === String(email).toLowerCase());
        console.log('List fallback found:', found || null);
      } catch (e2) {
        console.error('listUsers fallback failed:', e2 && e2.message ? e2.message : e2);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
