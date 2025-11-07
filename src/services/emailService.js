import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs.config';

/**
 * Serviço centralizado para envio de emails via EmailJS
 */
class EmailService {
  /**
   * Verifica se o EmailJS está configurado
   */
  static isConfigured() {
    return (
      EMAILJS_CONFIG.PUBLIC_KEY &&
      EMAILJS_CONFIG.PUBLIC_KEY !== 'SUA_PUBLIC_KEY_AQUI' &&
      EMAILJS_CONFIG.SERVICE_ID &&
      EMAILJS_CONFIG.SERVICE_ID !== 'SEU_SERVICE_ID_AQUI'
    );
  }

  /**
   * Envia email de contato
   */
  static async sendContactEmail({ nome, email, mensagem, userId = 'Visitante' }) {
    if (!this.isConfigured()) {
      throw new Error('EmailJS não configurado. Configure em src/config/emailjs.config.js');
    }

    const templateParams = {
      from_name: nome,
      from_email: email,
      message: mensagem,
      user_id: userId,
      to_email: EMAILJS_CONFIG.DESTINATION_EMAIL
    };

    const templateId = EMAILJS_CONFIG.TEMPLATE_ID_CONTACT || EMAILJS_CONFIG.TEMPLATE_ID;

    return await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      templateId,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
  }

  /**
   * Envia email de boas-vindas ao novo usuário
   */
  static async sendWelcomeEmail({ nome, email, userId }) {
    if (!this.isConfigured()) {
      console.warn('⚠️ EmailJS não configurado. Email de boas-vindas não enviado.');
      return null;
    }

    if (!EMAILJS_CONFIG.TEMPLATE_ID_WELCOME || EMAILJS_CONFIG.TEMPLATE_ID_WELCOME === 'SEU_TEMPLATE_BOAS_VINDAS_AQUI') {
      console.warn('⚠️ Template de boas-vindas não configurado. Email não enviado.');
      return null;
    }

    const templateParams = {
      from_name: nome,
      from_email: email,
      user_id: userId,
      to_email: email // Email vai para o próprio usuário
    };

    try {
      return await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID_WELCOME,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      // Não bloqueia o cadastro se o email falhar
      return null;
    }
  }

  /**
   * Envia email de recuperação de senha
   */
  static async sendPasswordResetEmail({ nome, email, userId, resetLink }) {
    if (!this.isConfigured()) {
      throw new Error('EmailJS não configurado. Configure em src/config/emailjs.config.js');
    }

    if (!EMAILJS_CONFIG.TEMPLATE_ID_RESET_PASSWORD || EMAILJS_CONFIG.TEMPLATE_ID_RESET_PASSWORD === 'SEU_TEMPLATE_SENHA_AQUI') {
      throw new Error('Template de recuperação de senha não configurado.');
    }

    const templateParams = {
      from_name: nome,
      from_email: email,
      user_id: userId,
      reset_link: resetLink,
      to_email: email // Email vai para o próprio usuário
    };

    return await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID_RESET_PASSWORD,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
  }

  /**
   * Trata erros do EmailJS de forma amigável
   */
  static getErrorMessage(error) {
    if (error.text) {
      return error.text;
    } else if (error.status === 400) {
      return 'Credenciais do EmailJS inválidas. Verifique a configuração.';
    } else if (error.status === 412) {
      return 'Template do EmailJS não encontrado.';
    } else if (error.message) {
      return error.message;
    } else {
      return 'Erro desconhecido ao enviar email. Tente novamente.';
    }
  }
}

export default EmailService;
