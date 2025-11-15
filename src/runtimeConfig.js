// runtimeConfig.js
// Fetch runtime configuration from server endpoint. If the endpoint is
// unavailable, fall back to compile-time `import.meta.env` values for
// compatibility while migrating away from build-time secrets.
export async function loadRuntimeConfig() {
  try {
    const res = await fetch('/api/runtime-config', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load runtime config');
    const json = await res.json();
    return json || {};
  } catch (e) {
    // Fallback: read from import.meta.env so existing builds keep working
    return {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      VITE_API_URL: import.meta.env.VITE_API_URL || '',
      VITE_EMAILJS_PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
    };
  }
}

export function getRuntimeConfig() {
  return (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};
}
