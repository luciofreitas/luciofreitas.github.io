import { createClient } from '@supabase/supabase-js'

// Cole aqui as credenciais do seu projeto Supabase:
// Settings → API → Project URL e anon/public key
const SUPABASE_URL  = 'https://SEU_PROJECT_ID.supabase.co'
const SUPABASE_ANON = 'SUA_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
