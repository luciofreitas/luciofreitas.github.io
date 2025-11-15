const functions = require('firebase-functions');
const admin = require('firebase-admin');
const createCors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Restrict CORS to known frontend origins (match backend allowedOrigins)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://luciofreitas.github.io'
];
const cors = createCors({
  origin: function(origin, callback){
    // allow requests with no origin (curl, mobile)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  }
});

// Initialize Firebase Admin using application default credentials or explicitly
// provided service account via environment variable (FIREBASE_SERVICE_ACCOUNT_JSON)
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    } else {
      admin.initializeApp();
    }
  } catch (e) {
    console.error('Failed to initialize Firebase Admin:', e && e.message ? e.message : e);
    // still allow function to load; verification will fail at runtime if admin not initialized
  }
}

// Helper: upsert user into Supabase via REST (service role key) or client
function getSupabaseClient(){
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Cloud Function: verify Firebase ID token and upsert user in Supabase
exports.firebaseVerify = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const idToken = (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) ? req.headers.authorization.split(' ')[1] : (req.body && req.body.idToken);
      if(!idToken) return res.status(400).json({ error: 'idToken required (Authorization: Bearer <token> or body.idToken)' });

      // Verify with Firebase Admin
      let decoded = null;
      try {
        decoded = await admin.auth().verifyIdToken(idToken);
      } catch (e) {
        console.warn('firebaseVerify: token verification failed', e && e.message ? e.message : e);
        return res.status(401).json({ error: 'invalid token' });
      }

      const uid = decoded.uid;
      const email = decoded.email || null;
      const displayName = decoded.name || decoded.displayName || (email ? email.split('@')[0] : null);
      const photoURL = decoded.picture || decoded.photoURL || null;

      // Attempt upsert via Supabase service role client if configured
      const sb = getSupabaseClient();
      if(sb){
        // Try upsert first using 'name' column, fall back to 'nome' if server reports unknown column
        const attempts = [ 'name', 'nome' ];
        for(const nameCol of attempts){
          try{
            // Build upsert payload dynamically
            const payload = { id: uid, email: email, photo_url: photoURL };
            payload[nameCol] = displayName;
            const insert = await sb.from('users').upsert(payload, { onConflict: 'id' });
            // On success, try to read back the row to normalize shape
            try{
              const qry = await sb.from('users').select('id,email,photo_url,is_pro,created_at,criado_em,' + nameCol).eq('id', uid).limit(1).maybeSingle();
              const row = qry && qry.data ? qry.data : null;
              if(row){
                // Normalize field names to match backend response
                const normalized = {
                  id: row.id,
                  email: row.email || null,
                  name: (row[nameCol] || '') || null,
                  nome: (row[nameCol] || '') || null,
                  photoURL: row.photo_url || null,
                  is_pro: row.is_pro || false,
                  created_at: row.created_at || row.criado_em || null
                };
                return res.json({ success: true, user: normalized });
              }
            }catch(e){
              // If select failed, still return upsert result if available
              const upserted = (insert && insert.data && insert.data[0]) ? insert.data[0] : null;
              if(upserted) return res.json({ success: true, user: { id: upserted.id || uid, email: upserted.email || email, name: upserted[nameCol] || displayName, nome: upserted[nameCol] || displayName, photoURL: upserted.photo_url || photoURL } });
            }
            // If we reach here, upsert didn't return row but didn't throw - accept token user
            return res.json({ success: true, user: { id: uid, email, name: displayName, nome: displayName, photoURL } });
          }catch(e){
            // If error message indicates unknown column, try next attempt; otherwise log and break
            const msg = (e && e.message) ? String(e.message).toLowerCase() : '';
            if(msg.includes('column') && (msg.includes(nameCol) || msg.includes('unknown'))){
              // try next name column
              console.warn(`firebaseVerify: upsert with column ${nameCol} failed, trying fallback`, msg);
              continue;
            }
            console.warn('firebaseVerify: Supabase upsert failed (non-column error), falling back to token user', e && e.message ? e.message : e);
            break;
          }
        }
      }

      // Fallback: return token-derived user
      return res.json({ success: true, user: { id: uid, email, name: displayName, photoURL } });
    } catch (err) {
      console.error('firebaseVerify error:', err && err.stack ? err.stack : err);
      return res.status(500).json({ error: 'internal error' });
    }
  });
});
