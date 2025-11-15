// Simple Vercel-style serverless function that returns a minimal runtime
// configuration containing only values safe to expose to the client.
// It reads from process.env; prefer non-VITE names for secrets stored in
// server/CI. The endpoint sets no-cache to ensure callers always revalidate.
module.exports = (req, res) => {
  const cfg = {
    // Supabase: expose URL and anon key if present (anon key is intended for client-side use)
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',

    // Firebase client config (apiKey is OK to be public; service account must NOT be exposed)
    FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
    FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
    FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
    FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',

    // Public EmailJS keys / templates
    EMAILJS_PUBLIC_KEY: process.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY || '',
    EMAILJS_SERVICE_ID: process.env.VITE_EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID || '',
    EMAILJS_TEMPLATE_CONTACT: process.env.VITE_EMAILJS_TEMPLATE_CONTACT || process.env.EMAILJS_TEMPLATE_CONTACT || '',

    // Generic API URL used by the client
    API_URL: process.env.VITE_API_URL || process.env.API_URL || '',
  };

  // Ensure we do not leak anything unexpected: explicitly avoid returning
  // known sensitive env vars like SUPABASE_SERVICE_ROLE_KEY or FIREBASE_PRIVATE_KEY
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(cfg));
};
