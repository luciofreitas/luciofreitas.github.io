// Frontend Supabase client wrapper
import { createClient } from '@supabase/supabase-js';

const url = (process.env.REACT_APP_SUPABASE_URL || window.__SUPABASE_URL || '');
const anonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY || '');

if (!url || !anonKey) {
  console.warn('Supabase client not configured (REACT_APP_SUPABASE_* or window.__SUPABASE_* not set)');
}

export const supabase = createClient(url.replace(/\/$/, ''), anonKey, { auth: { persistSession: false } });

export default supabase;
