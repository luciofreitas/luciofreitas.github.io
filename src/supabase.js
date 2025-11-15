// Frontend Supabase client wrapper
import { createClient } from '@supabase/supabase-js';

// Resolve env sources in this order: Vite import.meta.env (VITE_), process.env (REACT_APP_ or SUPABASE_), window globals
let viteEnv = null;
try { viteEnv = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : null; } catch (e) { viteEnv = null; }

// Prefer runtime-provided configuration injected by server (/api/runtime-config)
// which is exposed on `window.__RUNTIME_CONFIG__`. This allows builds to avoid
// embedding secrets. Fall back to compile-time envs to keep backward compatibility.
const runtimeCfg = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};

const url = (runtimeCfg.SUPABASE_URL)
  || (viteEnv && (viteEnv.VITE_SUPABASE_URL))
  || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL)
  || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL)
  || (typeof window !== 'undefined' && window.__SUPABASE_URL)
  || '';

const anonKey = (runtimeCfg.SUPABASE_ANON_KEY)
  || (viteEnv && (viteEnv.VITE_SUPABASE_ANON_KEY))
  || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY)
  || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY)
  || (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY)
  || '';

let supabase = null;
let isConfigured = false;

function makeNotConfiguredStub() {
  const err = new Error('Supabase client not configured (missing URL or anon key)');
  const rejecter = () => Promise.reject(err);
  return {
    auth: { signIn: rejecter, signInWithOAuth: rejecter, getSessionFromUrl: rejecter },
    from: () => ({ select: rejecter, insert: rejecter, update: rejecter, delete: rejecter }),
    rpc: rejecter,
    storage: () => ({ from: () => ({ upload: rejecter, download: rejecter }) }),
    _notConfigured: true,
  };
}

(function createSupabaseClient() {
  if (!url || !anonKey) {
    console.warn('Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or REACT_APP_SUPABASE_* / window.__SUPABASE_*).');
    supabase = makeNotConfiguredStub();
    isConfigured = false;
    return;
  }

  // In dev we may want session persistence so tokens survive a reload while
  // debugging the link flow. Change to true only for dev if needed.
  supabase = createClient(String(url).replace(/\/$/, ''), String(anonKey), { auth: { persistSession: true } });
  isConfigured = true;
})();

export { supabase, isConfigured };
export default supabase;

// DEV-ONLY: expose supabase client on window for interactive debugging
// Only enabled in Vite dev or when explicit debug env var is set.
try {
  const isDev = !!(viteEnv && (viteEnv.DEV || viteEnv.VITE_DEBUG_SUPABASE === 'true')) || (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production' && process.env.DEBUG_SUPABASE === 'true');
  if (typeof window !== 'undefined' && isDev && supabase && !window.__debugSupabase) {
    // eslint-disable-next-line no-console
    console.info('[supabase] dev: exposing supabase on window.__debugSupabase');
    Object.defineProperty(window, '__debugSupabase', { value: supabase, writable: false, configurable: true });
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.debug('[supabase] failed to attach debug client', e && e.message);
}
