// runtimeConfig.js
// Fetch runtime configuration from server endpoint. If the endpoint is
// unavailable, fall back to compile-time `import.meta.env` values for
// compatibility while migrating away from build-time secrets.
const WHITELIST = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'API_URL',
  'EMAILJS_PUBLIC_KEY',
];

function pickWhitelist(obj = {}) {
  const out = {};
  for (const k of WHITELIST) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      out[k] = obj[k];
    }
  }
  return out;
}

export async function loadRuntimeConfig() {
  try {
    const res = await fetch('/api/runtime-config', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load runtime config');
    const json = await res.json();
    return pickWhitelist(json || {});
  } catch (e) {
    // Fallback: read a small, explicit set from import.meta.env so existing builds
    // keep working while we migrate. We intentionally only read whitelisted keys.
    const fallback = {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
      FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      API_URL: import.meta.env.VITE_API_URL || '',
      EMAILJS_PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
    };
    return pickWhitelist(fallback);
  }
}

export function getRuntimeConfig() {
  const cfg = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};
  return pickWhitelist(cfg);
}
