import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailService from '../services/emailService';
import './ContatoForm.css';

function ContatoForm({ requireAuth = false, user = null, initialValues = {}, onRequireLogin = null, onSubmit = null }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nome: '', email: '', mensagem: '', ...initialValues });
  const [submitting, setSubmitting] = useState(false);
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
      alert('✅ Mensagem enviada com sucesso! Em breve entraremos em contato.');
      console.log('✅ Email enviado para: suportegaragemsmart@gmail.com');
      
    } catch (err) {
      console.error('❌ Erro ao enviar email:', err);
      
      // Mensagem de erro amigável
      const errorMessage = EmailService.getErrorMessage(err);
      alert(`Falha ao enviar a mensagem. ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="contato-form-wrapper" onSubmit={handleSubmit}>
      <input name="nome" className="contato-input" type="text" placeholder="Seu nome" value={formData.nome} onChange={handleChange} required />
      <input name="email" className="contato-input" type="email" placeholder="Seu e-mail" value={formData.email} onChange={handleChange} required />
      <textarea name="mensagem" className="contato-textarea" placeholder="Mensagem" rows={6} value={formData.mensagem} onChange={handleChange} required />
      <button className="contato-submit" type="submit" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar Mensagem'}</button>
    </form>
  );
}

export default ContatoForm;
