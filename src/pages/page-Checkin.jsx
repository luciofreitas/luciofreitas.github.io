import React, { useState, useContext } from 'react';
import Menu from '../components/Menu';
import { AuthContext } from '../App';
import '../styles/pages/page-Checkin.css';

export default function Checkin() {
  const [name, setName] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [coupon, setCoupon] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [cardError, setCardError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [cvcError, setCvcError] = useState('');

  const { usuarioLogado, setUsuarioLogado } = useContext(AuthContext);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    // validação final antes de processar
    let hasError = false;
    if (!name.trim()) {
      setNameError('Nome é obrigatório.');
      hasError = true;
    }
    const digits = card.replace(/\D/g, '');
    if (digits.length < 12) {
      setCardError('Número de cartão inválido.');
      hasError = true;
    }
    // expiry MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setExpiryError('Validade inválida. Use MM/AA.');
      hasError = true;
    } else {
      const [mm, yy] = expiry.split('/').map(s => parseInt(s, 10));
      if (!(mm >= 1 && mm <= 12)) {
        setExpiryError('Mês inválido.');
        hasError = true;
      }
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      setCvcError('CVC inválido.');
      hasError = true;
    }
    if (hasError) {
      setError('Revise os campos destacados.');
      return;
    }

    setProcessing(true);
    // simula processamento de pagamento
      setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
        // grava pagamento no localStorage (simulação de persistência)
        try {
          const payments = JSON.parse(localStorage.getItem('payments') || '[]');
          const record = { id: Date.now(), user: usuarioLogado ? usuarioLogado.email || usuarioLogado.nome : 'guest', amount: 9.9, currency: 'BRL', date: new Date().toISOString(), card: '**** **** **** ' + card.replace(/\s+/g, '').slice(-4) };
          payments.push(record);
          localStorage.setItem('payments', JSON.stringify(payments));
        } catch (e) {}

      // atualiza usuário para Pro
      if (usuarioLogado && setUsuarioLogado) {
        const updated = { ...usuarioLogado, isPro: true };
        setUsuarioLogado(updated);
        localStorage.setItem('usuario-logado', JSON.stringify(updated));
      } else {
        // marca flag geral
        try { localStorage.setItem('versaoProAtiva', 'true'); } catch (e) {}
      }
    }, 1200);
  }

  // helpers for realTime formatting and validation
  function handleNameChange(v) {
    setName(v);
    if (nameError && v.trim()) setNameError('');
  }

  function handleCardChange(v) {
    // keep only digits and format as groups of 4
    const digits = v.replace(/\D/g, '').slice(0, 19); // max 19 digits
    const parts = digits.match(/\d{1,4}/g) || [];
    const formatted = parts.join(' ');
    setCard(formatted);
    if (cardError && digits.length >= 12) setCardError('');
  }

  function handleExpiryChange(v) {
    // accept MMYY or MM/YY and format to MM/YY
    const digits = v.replace(/\D/g, '').slice(0,4);
    let out = digits;
    if (digits.length >= 3) out = digits.slice(0,2) + '/' + digits.slice(2);
    setExpiry(out);
    if (expiryError && /^\d{2}\/\d{2}$/.test(out)) setExpiryError('');
  }

  function handleCvcChange(v) {
    const digits = v.replace(/\D/g, '').slice(0,4);
    setCvc(digits);
    if (cvcError && /^\d{3,4}$/.test(digits)) setCvcError('');
  }

  if (success) {
    return (
      <>
  <Menu />
        <div className="page-wrapper menu-page">
        <div className="page-content">
              <h2 className="page-title">Pagamento concluído</h2>
            <p className="checkin-success-text">Obrigado — sua assinatura Pro foi ativada (simulado).</p>
            <p className="checkin-success-text">Você pode retornar à <a href="/">página inicial</a>.</p>
  </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page">
        <div className="page-content checkin-section">
          <div className="checkin-container">
            <h2 className="page-title">Finalizar Assinatura — Versão Pro</h2>
          <p className="checkin-intro">R$ 9,90/mês — cancelamento a qualquer momento.</p>

          <form onSubmit={handleSubmit} className="checkin-form">
            <label className="checkin-label">
              Nome no cartão
              <input className="checkin-input checkin-input" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Nome completo" />
              {nameError && <div className="checkin-error">{nameError}</div>}
            </label>

            <label className="checkin-label">
              Número do cartão
              <input className="checkin-input checkin-input" value={card} onChange={e => handleCardChange(e.target.value)} placeholder="1234 5678 9012 3456" inputMode="numeric" />
              {cardError && <div className="checkin-error">{cardError}</div>}
            </label>

            <div className="checkin-row">
              <label className="checkin-label checkin-row-item">
                Validade
                <input className="checkin-input checkin-input" value={expiry} onChange={e => handleExpiryChange(e.target.value)} placeholder="MM/AA" inputMode="numeric" />
                {expiryError && <div className="checkin-error">{expiryError}</div>}
              </label>
              <label className="checkin-label checkin-row-item-small">
                CVC
                <input className="checkin-input checkin-input" value={cvc} onChange={e => handleCvcChange(e.target.value)} placeholder="123" inputMode="numeric" />
                {cvcError && <div className="checkin-error">{cvcError}</div>}
              </label>
            </div>

            <label className="checkin-label">
              Cupom (opcional)
              <input className="checkin-input checkin-input" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="CUPOM" />
            </label>

            {error && <div className="checkin-error-global">{error}</div>}

            <div className="checkin-actions">
              <button type="submit" disabled={processing} className="checkin-btn-primary">
                {processing ? 'Processando...' : 'Pagar R$ 9,90'}
              </button>
              <button type="button" onClick={() => { /* voltar */ window.history.back(); }} className="checkin-btn-secondary">
                Voltar
              </button>
            </div>

            <div className="checkin-note">
              Este é um formulário de pagamento simulado. Integre seu provedor de pagamentos (Stripe, PayPal, PagSeguro etc.) conforme necessário.
            </div>
          </form>
        </div>
  </div>
  </div>
    </>
  );
}
