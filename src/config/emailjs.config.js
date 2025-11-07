// Configuração do EmailJS
// Para obter essas credenciais:
// 1. Acesse https://emailjs.com e crie uma conta
// 2. Vá em "Email Services" e adicione seu provedor de email (Gmail, Outlook, etc.)
// 3. Vá em "Email Templates" e crie os templates
// 4. Copie as credenciais abaixo do dashboard

export const EMAILJS_CONFIG = {
  // Sua Public Key (encontrada em "Account" -> "API Keys")
  PUBLIC_KEY: 'SUA_PUBLIC_KEY_AQUI',
  
  // Service ID (encontrado em "Email Services")
  SERVICE_ID: 'SEU_SERVICE_ID_AQUI',
  
  // Template IDs (encontrados em "Email Templates")
  TEMPLATE_ID_CONTACT: 'SEU_TEMPLATE_CONTATO_AQUI',        // Template: Formulário de Contato
  TEMPLATE_ID_WELCOME: 'SEU_TEMPLATE_BOAS_VINDAS_AQUI',    // Template: Boas-Vindas ao Cadastro
  TEMPLATE_ID_RESET_PASSWORD: 'SEU_TEMPLATE_SENHA_AQUI',   // Template: Recuperação de Senha
  
  // Template ID padrão (compatibilidade com código antigo)
  TEMPLATE_ID: 'SEU_TEMPLATE_CONTATO_AQUI',
  
  // Email de destino (já configurado no template do EmailJS)
  DESTINATION_EMAIL: 'suportegaragemsmart@gmail.com'
};

// Instruções para configurar o template no EmailJS:
// 1. No template, use estas variáveis:
//    {{from_name}} - Nome do remetente
//    {{from_email}} - Email do remetente  
//    {{message}} - Mensagem do contato
//    {{user_id}} - ID do usuário (se logado)
// 2. Configure o email de destino como: suportegaragemsmart@gmail.com
