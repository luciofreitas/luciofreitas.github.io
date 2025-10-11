import { createClient } from '@supabase/supabase-js'

function readRuntimeSupabase() {
  if (typeof window !== 'undefined') {
    const win = window
    const url = (win.__RUNTIME_ENV__ && win.__RUNTIME_ENV__.VITE_SUPABASE_URL) || win.__SUPABASE_URL || win.REACT_APP_SUPABASE_URL || null
    const key = (win.__RUNTIME_ENV__ && win.__RUNTIME_ENV__.VITE_SUPABASE_ANON_KEY) || win.__SUPABASE_ANON_KEY || win.REACT_APP_SUPABASE_ANON_KEY || null
    if (url || key) return { url, key }
  }

  const url = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL) || null
  const key = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY) || null
  return { url, key }
}

let supabase = null

export function getSupabase() {
  if (supabase) return supabase

  const { url, key } = readRuntimeSupabase()
  if (!url || !key) {
    console.warn('[supabase] client not configured (url/key missing).')
    return null
  }

  supabase = createClient(url, key)
  return supabase
}

export default getSupabase
