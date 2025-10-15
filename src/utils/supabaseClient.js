// Lazy-safe supabase client helper. The project currently disables Supabase by default.
let supabase = null

function readRuntimeSupabase() {
  if (typeof window !== 'undefined') {
    const win = window
    if (win.__SUPABASE_DISABLED) return { url: null, key: null }
    const url = (win.__RUNTIME_ENV__ && win.__RUNTIME_ENV__.VITE_SUPABASE_URL) || win.__SUPABASE_URL || win.REACT_APP_SUPABASE_URL || null
    const key = (win.__RUNTIME_ENV__ && win.__RUNTIME_ENV__.VITE_SUPABASE_ANON_KEY) || win.__SUPABASE_ANON_KEY || win.REACT_APP_SUPABASE_ANON_KEY || null
    if (url || key) return { url, key }
  }

  const url = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL) || null
  const key = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY) || null
  return { url, key }
}

export async function getSupabase() {
  if (supabase) return supabase

  const { url, key } = readRuntimeSupabase()
  if (!url || !key) {
    console.warn('[supabase] client not configured or explicitly disabled.')
    return null
  }

  // Lazy import so removing @supabase/* from package.json won't crash code paths that never call getSupabase().
  try {
    const mod = await import('@supabase/supabase-js')
    const createClient = mod.createClient || (mod.default && mod.default.createClient)
    if (!createClient) {
      console.warn('[supabase] createClient not available from package')
      return null
    }
    supabase = createClient(url, key)
    return supabase
  } catch (e) {
    console.warn('[supabase] failed to import @supabase/supabase-js (likely removed):', e)
    return null
  }
}

export default getSupabase
