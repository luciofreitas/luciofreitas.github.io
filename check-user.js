// Script para verificar se um usuário existe no Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
  console.log(`\n🔍 Procurando usuário: ${email}\n`);

  // Buscar na tabela users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (userError) {
    console.log('❌ Erro ao buscar na tabela users:', userError.message);
  } else if (userData) {
    console.log('✅ Usuário encontrado na tabela users:');
    console.log(userData);
  } else {
    console.log('⚠️  Usuário NÃO encontrado na tabela users');
  }

  // Buscar todos os usuários para debug
  console.log('\n📋 Listando todos os usuários na tabela users:');
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('id, email, nome');

  if (allError) {
    console.log('❌ Erro ao listar usuários:', allError.message);
  } else {
    console.log(allUsers);
  }
}

// Email para verificar
const emailToCheck = process.argv[2] || 'luciodfp@gmail.com';
checkUser(emailToCheck);
