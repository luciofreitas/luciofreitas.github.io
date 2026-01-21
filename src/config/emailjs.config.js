// Configuração do EmailJS usando variáveis de ambiente
// Variáveis de ambiente do Vite começam com VITE_
// Para configurar localmente, crie um arquivo .env.local na raiz do projeto

export const EMAILJS_CONFIG = {
  // Credenciais vêm das variáveis de ambiente
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || import.meta.env.EMAILJS_PUBLIC_KEY || '',
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || import.meta.env.EMAILJS_SERVICE_ID || '',
  
  // Template IDs
  TEMPLATE_ID_CONTACT: import.meta.env.VITE_EMAILJS_TEMPLATE_CONTACT || import.meta.env.EMAILJS_TEMPLATE_CONTACT || '',
  TEMPLATE_ID_WELCOME: import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME || import.meta.env.EMAILJS_TEMPLATE_WELCOME || '',
  TEMPLATE_ID_RESET_PASSWORD: import.meta.env.VITE_EMAILJS_TEMPLATE_RESET || import.meta.env.EMAILJS_TEMPLATE_RESET || '',
  
  // Template ID padrão (compatibilidade)
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_CONTACT || import.meta.env.EMAILJS_TEMPLATE_CONTACT || '',
  
  // Email de destino
  DESTINATION_EMAIL: 'suportegaragemsmart@gmail.com'
};

// Instruções para configurar o template no EmailJS:
// 1. No template, use estas variáveis:
//    {{from_name}} - Nome do remetente
//    {{from_email}} - Email do remetente  
//    {{message}} - Mensagem do contato
//    {{user_id}} - ID do usuário (se logado)
// 2. Configure o email de destino como: suportegaragemsmart@gmail.com
