import('dotenv/config');
import { createClient } from '@supabase/supabase-js';

// Script para obter um access_token de sessão do Supabase via signInWithPassword
// Configure as variáveis de ambiente antes de executar:
// SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Erro: SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidas nas variáveis de ambiente.');
  process.exit(1);
}
if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Erro: TEST_EMAIL e TEST_PASSWORD devem estar definidas nas variáveis de ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main(){
  try{
    console.log('Tentando sign-in com', TEST_EMAIL);
    const res = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    if(res.error){
      console.error('Erro no sign-in:', res.error);
      process.exit(2);
    }
    const token = res.data?.session?.access_token;
    if(!token){
      console.error('Nenhum access_token retornado. Resposta completa:');
      console.error(JSON.stringify(res, null, 2));
      process.exit(3);
    }
    console.log('\n=== access_token ===');
    console.log(token);
    console.log('=== fim token ===\n');
  }catch(e){
    console.error('Erro inesperado:', e && e.message ? e.message : e);
    process.exit(4);
  }
}

main();
