const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { createClient } = require('@supabase/supabase-js');

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
        try {
          // Try using auth.admin.getUserById-like approach: upsert into `users` table
          // Respect common column differences: name/nome and created_at/criado_em
          const nameCol = 'name';
          const insert = await sb.from('users').upsert({ id: uid, email: email, [nameCol]: displayName, photo_url: photoURL }, { onConflict: 'id' });
          // Return a normalized user
          const upserted = (insert && insert.data && insert.data[0]) ? insert.data[0] : null;
          return res.json({ success: true, user: upserted || { id: uid, email, name: displayName, photoURL } });
        } catch (e) {
          console.warn('firebaseVerify: Supabase upsert failed, falling back to token user', e && e.message ? e.message : e);
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
