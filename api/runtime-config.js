// Simple Vercel-style serverless function that returns a minimal runtime
// configuration containing only values safe to expose to the client.
// It reads from process.env; prefer non-VITE names for secrets stored in
// server/CI. The endpoint sets no-cache to ensure callers always revalidate.
module.exports = (req, res) => {
  // Define an explicit mapping of keys we allow to expose to the client.
  // For each exposed key we try a small ordered list of env names (prefer non-VITE names).
  const MAP = {
    SUPABASE_URL: ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
    SUPABASE_ANON_KEY: ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'],
    FIREBASE_API_KEY: ['FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'],
    FIREBASE_AUTH_DOMAIN: ['FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'],
    API_URL: ['API_URL', 'VITE_API_URL'],
    EMAILJS_PUBLIC_KEY: ['EMAILJS_PUBLIC_KEY', 'VITE_EMAILJS_PUBLIC_KEY'],
  };

  const cfg = Object.keys(MAP).reduce((acc, key) => {
    const envNames = MAP[key];
    let val = '';
    for (const name of envNames) {
      if (Object.prototype.hasOwnProperty.call(process.env, name) && process.env[name]) {
        val = process.env[name];
        break;
      }
    }
    acc[key] = val;
    return acc;
  }, {});

  // Support an audit-only mode: if the caller requests `?keysOnly=1` (or true),
  // return only the list of allowed keys (no values). To avoid letting
  // anonymous visitors enumerate keys, require a header `x-audit-token` that
  // matches `process.env.RUNTIME_CONFIG_AUDIT_TOKEN` (or `AUDIT_TOKEN`). If the
  // token is missing or doesn't match, return 403.
  const AUDIT_TOKEN = process.env.RUNTIME_CONFIG_AUDIT_TOKEN || process.env.AUDIT_TOKEN || '';
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const keysOnly = url.searchParams.get('keysOnly');
    if (keysOnly === '1' || keysOnly === 'true') {
      // header names are lower-cased in Node's req.headers
      const headerToken = (req.headers && (req.headers['x-audit-token'] || req.headers['X-Audit-Token'])) || '';
      if (!AUDIT_TOKEN || String(headerToken) !== String(AUDIT_TOKEN)) {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }

      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ keys: Object.keys(cfg) }));
      return;
    }
  } catch (err) {
    // If URL parsing fails, fall through to normal response.
  }

  // Ensure we do not leak anything unexpected: explicitly avoid returning
  // known sensitive env vars like SUPABASE_SERVICE_ROLE_KEY or FIREBASE_PRIVATE_KEY
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(cfg));
};
