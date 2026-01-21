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

          <div className="contact-channels-card" aria-label="Canais rápidos de contato">
            <div className="contact-channels-title">Canais rápidos</div>
            <div className="contact-channels-subtitle">Se preferir, fale com a gente por aqui:</div>
            <div className="contact-channels-actions">
              <a
                className="contact-channel-btn is-whatsapp"
                href="https://wa.me/5500000000000"
                target="_blank"
                rel="noreferrer"
              >
                <span className="contact-channel-icon" aria-hidden="true"><FaWhatsapp /></span>
                <span className="contact-channel-text">
                  <span className="contact-channel-label">WhatsApp</span>
                  <span className="contact-channel-hint">Atendimento rápido</span>
                </span>
                <span className="contact-channel-arrow" aria-hidden="true">↗</span>
              </a>

              <a
                className="contact-channel-btn is-instagram"
                href="https://www.instagram.com/garagemsmartofc/"
                target="_blank"
                rel="noreferrer"
              >
                <span className="contact-channel-icon" aria-hidden="true"><FaInstagram /></span>
                <span className="contact-channel-text">
                  <span className="contact-channel-label">Instagram</span>
                  <span className="contact-channel-hint">Novidades e suporte</span>
                </span>
                <span className="contact-channel-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          {/* Feedback (opcional) */}
          <details className="feedback-collapsible">
            <summary className="feedback-summary">
              Feedback (opcional)
              <span className="feedback-summary-hint">Ajude a melhorar o app</span>
            </summary>
            <div className="feedback-panel">
              <p className="feedback-subtitle">
                Esse campo é temporário e ajuda a ajustar o projeto. Se preferir, pode ignorar.
              </p>
              <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                <textarea
                  name="feedback"
                  className="feedback-textarea"
                  placeholder="Escreva seu feedback aqui…"
                  rows="4"
                  required
                />
                <button type="submit" className="feedback-submit-btn" disabled={submittingFeedback}>
                  {submittingFeedback ? 'Enviando…' : 'Enviar feedback'}
                </button>
              </form>
            </div>
          </details>
    </div>
  </div>
    </>
  );
}
