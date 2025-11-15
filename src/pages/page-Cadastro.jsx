import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleCar, MenuLogin } from '../components';
import '../styles/pages/page-Cadastro.css';
// Supabase is lazily imported where needed to avoid bundling it into unrelated pages.
import { AuthContext } from '../App';

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
  const { setUsuarioLogado } = useContext(AuthContext || {});

  // Helper to compute deterministic avatar background color from a name/email
  const computeAvatarBg = (seed) => {
    try {
      const palette = ['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFEB3B','#FFC107','#FF9800','#FF5722'];
      const s = String(seed || '').trim() || 'user';
      let h = 0;
      for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
      return palette[Math.abs(h) % palette.length];
    } catch (e) { return '#2196F3'; }
  };

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

    // Normalize name (collapse whitespace, trim) and attempt create -> then auto-login
    const normalizedNome = String(nome || '').trim().replace(/\s+/g, ' ');
    // Try to create user via API; fallback to localStorage when unavailable
    (async () => {
      try {
        const apiBase = window.__API_BASE || '';
        const resp = await fetch(`${apiBase}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: normalizedNome, email: email.trim(), senha }),
        });

        if (resp.status === 201) {
          // Parse created user (may include id/email/name)
          const created = await resp.json().catch(() => ({}));
          const normalizedUsuario = {
            id: created.id || (`local_${Date.now()}`),
            email: created.email || email.trim(),
            nome: (created.nome || created.name) ? String(created.nome || created.name).trim() : normalizedNome,
            name: (created.nome || created.name) ? String(created.nome || created.name).trim() : normalizedNome,
            avatarBg: computeAvatarBg((created.nome || created.name) ? String(created.nome || created.name).trim() : normalizedNome),
            photoURL: created.photoURL || created.photo_url || null
          };
          // Auto-login: set context and localStorage so header updates with initials
          try { if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario); } catch(e){}
          try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch(e){}
          setSuccess('Cadastro realizado com sucesso! Entrando...');
          if (window.showToast) window.showToast('Cadastro realizado com sucesso! Entrando...', 'success', 1200);
          setTimeout(() => { try { navigate('/buscar-pecas'); } catch (e) {} }, 1000);
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

        // Other non-OK: fall back to attempt creating the user directly in Supabase
        console.warn('API /api/users returned non-201 status, attempting Supabase signup fallback', resp.status);
        try {
          const emailAddr = email.trim();
          const pw = senha;
          // Lazy-import supabase client for fallback
          let _supabase = null;
          try { const mod = await import('../supabase'); _supabase = mod.default || mod.supabase; } catch (e) { _supabase = null; }
          if (_supabase && _supabase.auth && typeof _supabase.auth.signUp === 'function') {
            const { data, error } = await _supabase.auth.signUp({ email: emailAddr, password: pw, options: { data: { nome: normalizedNome } } });
            if (error) {
              console.warn('Supabase signup fallback failed:', error);
            } else if (data && (data.user || data)) {
              const sbUser = data.user || data;
              const normalizedUsuario = {
                id: sbUser.id || sbUser.user?.id || (`local_${Date.now()}`),
                email: sbUser.email || emailAddr,
                nome: (sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name)) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : normalizedNome,
                name: (sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name)) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : normalizedNome,
                avatarBg: computeAvatarBg((sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name)) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : normalizedNome),
                photoURL: sbUser.photoURL || sbUser.avatar_url || null
              };
              try { if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario); } catch(e){}
              try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch(e){}
              setSuccess('Cadastro realizado (Supabase). Entrando...');
              if (window.showToast) window.showToast('Cadastro realizado (Supabase).', 'success', 1200);
              setTimeout(() => { try { navigate('/buscar-pecas'); } catch (e) {} }, 1000);
              setNome(''); setEmail(''); setSenha(''); setConfirmSenha(''); setErrors({});
              return;
            }
          }
        } catch (err2) {
          console.warn('Supabase signup fallback threw:', err2 && err2.message ? err2.message : err2);
        }
        
        console.warn('Falling back to localStorage after API + Supabase attempts failed');
      } catch (err) {
        // Network or other error -> try supabase signup fallback
        console.warn('Failed to call /api/users, attempting Supabase signup fallback', err && err.message);
        try {
          if (supabase && supabase.auth && typeof supabase.auth.signUp === 'function') {
            const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha });
            if (!error && (data && (data.user || data))) {
              setSuccess('Cadastro realizado (Supabase). Redirecionando para o login...');
              if (window.showToast) window.showToast('Cadastro realizado (Supabase).', 'success', 2000);
              setTimeout(() => { try { navigate('/login', { state: { email: email.trim() } }); } catch (e) {} }, 1500);
              setNome(''); setEmail(''); setSenha(''); setConfirmSenha(''); setErrors({});
              return;
            }
            console.warn('Supabase signup fallback returned error', error);
          }
        } catch (err2) {
          console.warn('Supabase signup fallback threw:', err2 && err2.message ? err2.message : err2);
        }
      }

      // Fallback persistence in localStorage
      try {
  const key = 'usuarios';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const createdLocal = { id: `local_${Date.now()}`, nome: normalizedNome, email: email.trim(), senha, criadoEm: new Date().toISOString(), avatarBg: computeAvatarBg(normalizedNome) };
  existing.push(createdLocal);
  localStorage.setItem(key, JSON.stringify(existing));
  // Auto-login local user
  try { if (setUsuarioLogado) setUsuarioLogado(createdLocal); } catch(e){}
  try { localStorage.setItem('usuario-logado', JSON.stringify(createdLocal)); } catch(e){}
  setSuccess('Cadastro (local) realizado com sucesso! Entrando...');
  if (window.showToast) window.showToast('Cadastro realizado (local). Entrando...', 'success', 1200);
  setTimeout(() => { try { navigate('/buscar-pecas'); } catch (e) {} }, 1000);
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
                  <img className="cadastro-hero" loading="lazy" src="/images/imagem-login.png" alt="Imagem ilustrativa de peças automotivas" />
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
