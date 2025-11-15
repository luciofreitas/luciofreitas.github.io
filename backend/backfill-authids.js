// backfill-authids.js
// Usage: set env DATABASE_URL (or PGHOST/PGUSER/PGPASSWORD/PGDATABASE), SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// node -r dotenv/config backfill-authids.js

const path = require('path');
// Load backend/.env automatically if present (same behavior as backend server)
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) { /* ignore */ }

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

function buildPgConfigFromEnv(){
  if(process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  const host = process.env.PGHOST || process.env.PG_HOST;
  const port = process.env.PGPORT || process.env.PG_PORT || 5432;
  const user = process.env.PGUSER || process.env.PG_USER;
  const password = process.env.PGPASSWORD || process.env.PG_PASSWORD;
  const database = process.env.PGDATABASE || process.env.PG_DATABASE;
  if(!host || !user || !password || !database) return null;
  return { host, port: Number(port), user, password, database };
}

// Detect useful columns (email, name, photo, updatedAt) in users table
async function detectColumns(pg){
  try{
    const cols = await pg.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'");
    const names = (cols.rows || []).map(r => String(r.column_name).toLowerCase());
    const emailCol = names.indexOf('email') >= 0 ? 'email' : (names.find(n => n.includes('email')) || null);
    const nameCol = names.indexOf('name') >= 0 ? 'name' : (names.indexOf('nome') >= 0 ? 'nome' : null);
    const photoCandidates = ['photo_url','avatar_url','picture','profile_image','image'];
    const photoCol = photoCandidates.find(c => names.indexOf(c) >= 0) || null;
    const updatedCandidates = ['atualizado_em','updated_at','updatedat','updated'];
    const updatedCol = updatedCandidates.find(c => names.indexOf(c) >= 0) || null;
    return { emailCol, nameCol, photoCol, updatedCol };
  }catch(e){
    console.warn('Could not detect users table columns:', e && e.message ? e.message : e);
    return { emailCol: null, nameCol: null, photoCol: null, updatedCol: null };
  }
}

async function main(){
  const pgCfg = buildPgConfigFromEnv();
  if(!pgCfg){
    console.error('No Postgres configuration found in env (DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE)');
    process.exit(1);
  }
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY){
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
  const pg = new Client(pgCfg);
  await pg.connect();
  console.log('Connected to Postgres, starting backfill...');

  // detect useful columns dynamically
  const { emailCol, nameCol, photoCol, updatedCol } = await detectColumns(pg);
  if(!emailCol){
    console.error('Could not detect an email column in users table. Aborting backfill.');
    await pg.end();
    process.exit(1);
  }
  console.log('Detected columns -> email:', emailCol, 'name:', nameCol, 'photo:', photoCol, 'updated:', updatedCol);

  // Paginate through Supabase auth users
  let page = 1;
  const perPage = 100;
  let processed = 0;
  while(true){
    console.log(`Fetching supabase users page ${page}`);
    const resp = await supabase.auth.admin.listUsers({ per_page: perPage, page });
    if(resp.error){
      console.error('Supabase listUsers error:', resp.error);
      break;
    }
    const users = (resp.data && resp.data.users) || resp.data || [];
    if(!users || users.length === 0) break;

    for(const u of users){
      try{
        const email = (u.email || '').trim().toLowerCase();
        if(!email){
          console.log('NO_EMAIL for supabase user', u && u.id);
          continue;
        }
        // find matching users row by detected email column and also fetch name/photo if available
        const selectCols = ['id', 'auth_id'];
        if (nameCol) selectCols.push(`${nameCol} AS detected_name`);
        else selectCols.push(`NULL AS detected_name`);
        if (photoCol) selectCols.push(`${photoCol} AS detected_photo`);
        else selectCols.push(`NULL AS detected_photo`);
        const q = `SELECT ${selectCols.join(', ')} FROM users WHERE lower(${emailCol}) = lower($1) LIMIT 1`;
        const r = await pg.query(q, [email]);
        if(r.rowCount === 0){
          console.log('NO_MATCH for supabase user', u && u.id, 'email=', email);
          continue;
        }
        const row = r.rows[0];
        if(row.auth_id){
          // Already linked; consider updating missing profile fields
          const updates = [];
          const vals = [];
          // Name from supabase meta
          const supaName = (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name || u.user_metadata.username)) || null;
          if(nameCol && (!row.detected_name || String(row.detected_name).trim() === '') && supaName){
            updates.push(`${nameCol} = $${updates.length + 1}`);
            vals.push(supaName);
          }
          // Photo from supabase meta
          const supaPhoto = (u.user_metadata && (u.user_metadata.avatar_url || u.user_metadata.picture || u.user_metadata.avatar || u.user_metadata.image || u.user_metadata.profile_image)) || null;
          if(photoCol && (!row.detected_photo || String(row.detected_photo).trim() === '') && supaPhoto){
            updates.push(`${photoCol} = $${updates.length + 1}`);
            vals.push(supaPhoto);
          }
          if(updates.length > 0){
            // optionally set updated timestamp
            if(updatedCol) updates.push(`${updatedCol} = now()`);
            const updQ = `UPDATE users SET ${updates.join(', ')} WHERE id = $${vals.length + 1}`;
            vals.push(row.id);
            try{
              await pg.query(updQ, vals);
              console.log('UPDATED_PROFILE for users.id', row.id, 'with fields', updates.join(', '));
            }catch(e){
              console.warn('Failed to update profile for users.id', row.id, e && e.message ? e.message : e);
            }
          } else {
            console.log('MATCH_BY_AUTH_ID (already linked) supabase', u && u.id, '-> users.id', row.id);
          }
          continue;
        }
        // Not linked yet: build update statement to set auth_id and optionally name/photo when available
        const uid = u.id;
        const setParts = [];
        const setVals = [];
        setParts.push(`auth_id = $${setParts.length + 1}`); setVals.push(uid);
        // name if available and row has detected_name empty
        const supaName = (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name || u.user_metadata.username)) || null;
        if(nameCol && supaName){
          setParts.push(`${nameCol} = $${setParts.length + 1}`);
          setVals.push(supaName);
        }
        const supaPhoto = (u.user_metadata && (u.user_metadata.avatar_url || u.user_metadata.picture || u.user_metadata.avatar || u.user_metadata.image || u.user_metadata.profile_image)) || null;
        if(photoCol && supaPhoto){
          setParts.push(`${photoCol} = $${setParts.length + 1}`);
          setVals.push(supaPhoto);
        }
        if(updatedCol) {
          setParts.push(`${updatedCol} = now()`);
        }
        const updQ = `UPDATE users SET ${setParts.join(', ')} WHERE id = $${setVals.length + 1}`;
        setVals.push(row.id);
        try{
          await pg.query(updQ, setVals);
          console.log('LINKED user', row.id, 'email=', email, '-> auth_id=', uid, 'updated fields:', setParts.join(', '));
          processed++;
        }catch(e){
          console.warn('Error updating user', row.id, e && e.message ? e.message : e);
        }
      }catch(e){
        console.warn('Error processing user', u && u.id, e && e.message ? e.message : e);
      }
    }

    // If less than perPage, we're done
    if(users.length < perPage) break;
    page++;
  }

  console.log('Backfill complete. total linked:', processed);
  await pg.end();
}

main().catch(e => { console.error('fatal', e && e.stack ? e.stack : e); process.exit(2); });
