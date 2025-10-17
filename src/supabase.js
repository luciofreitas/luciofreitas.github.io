// Frontend Supabase client wrapper
import { createClient } from '@supabase/supabase-js';

// Resolve env sources in this order: Vite import.meta.env (VITE_), process.env (REACT_APP_ or SUPABASE_), window globals
let viteEnv = null;
try { viteEnv = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : null; } catch (e) { viteEnv = null; }

const url = (viteEnv && (viteEnv.VITE_SUPABASE_URL))
  || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL)
  || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL)
  || (typeof window !== 'undefined' && window.__SUPABASE_URL)
  || '';

const anonKey = (viteEnv && (viteEnv.VITE_SUPABASE_ANON_KEY))
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

  supabase = createClient(String(url).replace(/\/$/, ''), String(anonKey), { auth: { persistSession: false } });
  isConfigured = true;
})();

export { supabase, isConfigured };
export default supabase;
