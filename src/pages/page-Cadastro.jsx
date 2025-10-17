import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleCar, MenuLogin } from '../components';
import '../styles/pages/page-Cadastro.css';

export default function PageCadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmSenha, setShowConfirmSenha] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validate() {
    const e = {};
    if (!nome || !nome.trim()) e.nome = 'Nome é obrigatório.';
    if (!email || !email.trim()) e.email = 'E-mail é obrigatório.';
    else if (!emailRegex.test(email)) e.email = 'E-mail inválido.';
    if (!senha) e.senha = 'Senha é obrigatória.';
    else if (senha.length < 6) e.senha = 'Senha deve ter pelo menos 6 caracteres.';
    if (senha !== confirmSenha) e.confirmSenha = 'As senhas não conferem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    setSuccess('');
    if (!validate()) return;

    // Try to create user via API; fallback to localStorage when unavailable
    (async () => {
      try {
        const apiBase = window.__API_BASE || '';
        const resp = await fetch(`${apiBase}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha }),
        });

        if (resp.status === 201) {
          setSuccess('Cadastro realizado com sucesso!');
          if (window.showToast) window.showToast('Cadastro realizado com sucesso! Redirecionando para o login...', 'success', 2000);
          setTimeout(() => { try { navigate('/login', { state: { email: email.trim() } }); } catch (e) {} }, 1500);
          setNome(''); setEmail(''); setSenha(''); setConfirmSenha(''); setErrors({});
          return;
        }

        if (resp.status === 409) {
          // User exists
          const body = await resp.json().catch(() => ({}));
          setErrors({ form: 'Usuário já existe. Tente recuperar a senha ou entre em contato.' });
          console.warn('User exists:', body);
          return;
        }

        // Other non-OK: fall back to localStorage
        console.warn('API /api/users returned non-201 status, falling back to localStorage', resp.status);
      } catch (err) {
        // Network or other error -> fallback
        console.warn('Failed to call /api/users, falling back to localStorage', err && err.message);
      }

      // Fallback persistence in localStorage
      try {
        const key = 'usuarios';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push({ nome: nome.trim(), email: email.trim(), senha, criadoEm: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(existing));
        setSuccess('Cadastro (local) realizado com sucesso!');
        if (window.showToast) window.showToast('Cadastro realizado (local). Redirecionando para o login...', 'success', 2000);
        setTimeout(() => { try { navigate('/login', { state: { email: email.trim() } }); } catch (e) {} }, 1500);
        setNome(''); setEmail(''); setSenha(''); setConfirmSenha(''); setErrors({});
      } catch (err) {
        setErrors({ form: 'Erro ao salvar os dados localmente. Verifique o console.' });
        // eslint-disable-next-line no-console
        console.error('Erro salvando usuário localmente:', err);
      }
    })();
  }

  return (
    <>
      <MenuLogin />
      <div className="page-wrapper">
        <div className="page-content">
          <div className="cadastro-card-outer">
            <div className="cadastro-card-grid">
                <section className="cadastro-card">
        <h1 className="cadastro-title">Cadastro</h1>
        <p className="cadastro-sub">Crie sua conta para acessar recursos adicionais</p>

        <form className="cadastro-form" onSubmit={handleSubmit} noValidate>
          {errors.form && <div className="form-error">{errors.form}</div>}

          <label className="field">
            <span className="label">Nome completo</span>
            <input
              className={`input ${errors.nome ? 'input-error' : ''}`}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? 'err-nome' : undefined}
            />
            {errors.nome && <div id="err-nome" className="error">{errors.nome}</div>}
          </label>

          <label className="field">
            <span className="label">E-mail</span>
            <input
              className={`input ${errors.email ? 'input-error' : ''}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@exemplo.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'err-email' : undefined}
            />
            {errors.email && <div id="err-email" className="error">{errors.email}</div>}
          </label>

          <label className="field">
            <span className="label">Senha</span>
            <div className="password-field">
              <input
                className={`input password-input ${errors.senha ? 'input-error' : ''}`}
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Crie uma senha"
                aria-invalid={!!errors.senha}
                aria-describedby={errors.senha ? 'err-senha' : undefined}
              />
              <ToggleCar on={showSenha} onClick={() => setShowSenha((s) => !s)} ariaLabel={showSenha ? 'Ocultar senha' : 'Mostrar senha'} />
            </div>
            {errors.senha && <div id="err-senha" className="error">{errors.senha}</div>}
          </label>

          <label className="field field-password">
            <span className="label">Confirmar senha</span>
            <div className="password-field">
              <input
                className={`input password-input ${errors.confirmSenha ? 'input-error' : ''}`}
                type={showConfirmSenha ? 'text' : 'password'}
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                placeholder="Repita a senha"
                aria-invalid={!!errors.confirmSenha}
                aria-describedby={errors.confirmSenha ? 'err-confirm' : undefined}
              />
              <ToggleCar on={showConfirmSenha} onClick={() => setShowConfirmSenha((s) => !s)} ariaLabel={showConfirmSenha ? 'Ocultar senha' : 'Mostrar senha'} />
            </div>
            {errors.confirmSenha && <div id="err-confirm" className="error">{errors.confirmSenha}</div>}
          </label>

          <button className="submit" type="submit">Criar conta</button>

          {success && <div className="success">{success}</div>}
        </form>
                </section>

                <div className="cadastro-right" aria-hidden="true">
                  <div className="cadastro-hero" role="img" aria-label="Imagem ilustrativa de peças automotivas"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
