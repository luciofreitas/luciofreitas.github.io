// Arquivo temporário para debug das variáveis de ambiente em produção
console.log('=== DEBUG EMAILJS CONFIG ===');
console.log('PUBLIC_KEY:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? '✓ Configurado' : '✗ Não encontrado');
console.log('SERVICE_ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID ? '✓ Configurado' : '✗ Não encontrado');
console.log('TEMPLATE_CONTACT:', import.meta.env.VITE_EMAILJS_TEMPLATE_CONTACT ? '✓ Configurado' : '✗ Não encontrado');
console.log('TEMPLATE_RESET:', import.meta.env.VITE_EMAILJS_TEMPLATE_RESET ? '✓ Configurado' : '✗ Não encontrado');
console.log('===========================');
