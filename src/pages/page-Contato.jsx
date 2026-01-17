import React, { useState } from 'react';
import { MenuLogin, ContatoForm } from '../components';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import EmailService from '../services/emailService';
import '../styles/pages/page-Contato.css';

export default function Contato() {
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (submittingFeedback) return;
    
    setSubmittingFeedback(true);
    const formData = new FormData(e.target);
    const feedback = formData.get('feedback');
    
    try {
      await EmailService.sendContactEmail({
        nome: 'Feedback do Projeto',
        email: 'feedback@sistema.com',
        mensagem: `FEEDBACK DO PROJETO:\n\n${feedback}`,
        userId: 'Visitante'
      });
      
      alert('Obrigado pelo seu feedback! Ele foi enviado com sucesso.');
      e.target.reset();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      alert('Erro ao enviar feedback. Por favor, tente novamente.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <>
  <MenuLogin />
  <div className="page-wrapper">
  <div className="page-content" id="contato">
          <h2 className="page-title">Contato</h2>
          
          <p className="page-subtitle">
            Entre em contato conosco pelo formulário abaixo ou pelos canais oficiais.
          </p>

          <ContatoForm />

          <div className="contato-buttons">
            <button 
              className="contato-btn contato-btn-whatsapp"
              onClick={() => window.open('https://wa.me/5500000000000', '_blank')}
              title="WhatsApp"
            >
              <FaWhatsapp />
            </button>
            
            <button 
              className="contato-btn contato-btn-instagram"
              onClick={() => window.open('https://www.instagram.com/garagemsmartofc/', '_blank')}
              title="Instagram"
            >
              <FaInstagram />
            </button>
          </div>

          {/* Seção de Feedback */}
          <div className="feedback-section">
            <h3 className="feedback-title">Feedback sobre o Projeto</h3>
            <p className="feedback-subtitle">
              Sua opinião é muito importante! Conte-nos o que achou do projeto.
            </p>
            <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
              <textarea
                name="feedback"
                className="feedback-textarea"
                placeholder="Digite aqui seu feedback sobre o projeto..."
                rows="5"
                required
              />
              <button type="submit" className="feedback-submit-btn" disabled={submittingFeedback}>
                {submittingFeedback ? 'Enviando...' : 'Enviar Feedback'}
              </button>
            </form>
          </div>
    </div>
  </div>
    </>
  );
}
