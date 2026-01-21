import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailService from '../services/emailService';
import './ContatoForm.css';

function ContatoForm({ requireAuth = false, user = null, initialValues = {}, onRequireLogin = null, onSubmit = null }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nome: '', email: '', mensagem: '', ...initialValues });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const saveTimer = useRef(null);

  const draftKey = () => `contato_rascunho_${user && user.id ? user.id : 'anon'}`;

  // restore draft on mount or when user changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setFormData(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (err) {
      console.warn('Failed to restore contato draft', err);
    }
    // clear any existing timer when user changes
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nome: prev.nome || user.nome || user.name || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);

    if (status.type) setStatus({ type: '', message: '' });

    // debounce save to localStorage
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        // only save when there is some content
        if (next.nome || next.email || next.mensagem) {
          localStorage.setItem(draftKey(), JSON.stringify(next));
        } else {
          localStorage.removeItem(draftKey());
        }
      } catch (err) {
        console.warn('Failed to save contato draft', err);
      }
      saveTimer.current = null;
    }, 700);
  };

  if (requireAuth && !user) {
    const goLogin = () => {
      if (typeof onRequireLogin === 'function') return onRequireLogin();
      navigate('/login');
    };
    return (
      <div className="contato-need-login">
        <p>Faça login para enviar uma mensagem.</p>
        <button type="button" className="contato-login-btn" onClick={goLogin}>Entrar</button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus({ type: '', message: '' });
    
    try {
      // Enviar email usando o serviço centralizado
      await EmailService.sendContactEmail({
        nome: formData.nome,
        email: formData.email,
        mensagem: formData.mensagem,
        userId: user?.id || 'Visitante'
      });

      // Callback customizado (se fornecido)
      if (typeof onSubmit === 'function') {
        await onSubmit(formData);
      }

      // Limpar formulário e rascunho
      setFormData({ nome: '', email: '', mensagem: '', ...initialValues });
      try { 
        localStorage.removeItem(draftKey()); 
      } catch (err) { 
        console.warn('Erro ao limpar rascunho', err);
      }

      // Mensagem de sucesso
      const successMessage = 'Mensagem enviada com sucesso! Em breve entraremos em contato.';
      setStatus({ type: 'success', message: successMessage });
      if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast(successMessage, 'success', 3500);
      }
      console.log('✅ Email enviado para: suportegaragemsmart@gmail.com');
      
    } catch (err) {
      console.error('❌ Erro ao enviar email:', err);
      
      // Mensagem de erro amigável
      const errorMessage = EmailService.getErrorMessage(err);
      const msg = `Falha ao enviar a mensagem. ${errorMessage}`;
      setStatus({ type: 'error', message: msg });
      if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast(msg, 'error', 4500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contato-form-card">
      <div className="contato-form-header">
        <div className="contato-form-title">Fale com a Garagem Smart</div>
        <div className="contato-form-subtitle">
          Suporte, dúvidas e sugestões. Resposta geralmente em até 1 dia útil.
        </div>
      </div>

      <form className="contato-form-wrapper" onSubmit={handleSubmit}>
        <div className="contato-field">
          <label className="contato-label" htmlFor="contato-nome">Nome</label>
          <input
            id="contato-nome"
            name="nome"
            className="contato-input"
            type="text"
            placeholder="Ex: João Silva"
            value={formData.nome}
            onChange={handleChange}
            required
            autoComplete="name"
          />
        </div>

        <div className="contato-field">
          <label className="contato-label" htmlFor="contato-email">E-mail</label>
          <input
            id="contato-email"
            name="email"
            className="contato-input"
            type="email"
            placeholder="Ex: joao@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="contato-field">
          <label className="contato-label" htmlFor="contato-mensagem">Mensagem</label>
          <textarea
            id="contato-mensagem"
            name="mensagem"
            className="contato-textarea"
            placeholder="Explique em detalhes para a gente te ajudar mais rápido…"
            rows={6}
            value={formData.mensagem}
            onChange={handleChange}
            required
          />
        </div>

        {status.message ? (
          <div
            className={`contato-status ${status.type === 'success' ? 'is-success' : status.type === 'error' ? 'is-error' : ''}`}
            role={status.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {status.message}
          </div>
        ) : null}

        <div className="contato-actions">
          <button className="contato-submit" type="submit" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar mensagem'}
          </button>
          <div className="contato-privacy">
            Ao enviar, você concorda em ser contatado(a) por e-mail.
          </div>
        </div>
      </form>
    </div>
  );
}

export default ContatoForm;
