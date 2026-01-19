import React, { useMemo, useState, useContext } from 'react';
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUsuarioLogado } = useContext(AuthContext || {});

  const passwordChecklist = useMemo(() => {
    const s = String(senha || '');
    return {
      upper: /\p{Lu}/u.test(s),
      lower: /\p{Ll}/u.test(s),
      number: /\d/.test(s),
      minLength: s.length >= 6,
    };
  }, [senha]);

  const isPasswordValid = useMemo(() => {
    return !!(passwordChecklist.upper && passwordChecklist.lower && passwordChecklist.number && passwordChecklist.minLength);
  }, [passwordChecklist]);

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
    else if (!isPasswordValid) e.senha = 'Senha fraca. Atenda aos requisitos abaixo.';
    if (!confirmSenha) e.confirmSenha = 'Confirme sua senha.';
    else if (senha !== confirmSenha) e.confirmSenha = 'As senhas não conferem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const normalizeNome = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const s = raw.replace(/\s+/g, ' ');
    const lowerWords = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
    return s
      .split(' ')
      .map((part, idx) => {
        if (!part) return '';
        const lower = part.toLocaleLowerCase('pt-BR');
        if (idx > 0 && lowerWords.has(lower)) return lower;
        const isAllUpper = part === part.toLocaleUpperCase('pt-BR');
        const rest = isAllUpper ? part.slice(1).toLocaleLowerCase('pt-BR') : part.slice(1);
        return part.charAt(0).toLocaleUpperCase('pt-BR') + rest;
      })
      .join(' ')
      .trim();
  };

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSuccess('');
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    // Normalize name (collapse whitespace, trim) and attempt create -> then auto-login
    const normalizedNome = normalizeNome(nome);
    try {
      const apiBase = window.__API_BASE || '';
      const resp = await fetch(`${apiBase}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: normalizedNome, email: email.trim(), senha }),
      });
      if (resp.status === 201) {
        const created = await resp.json().catch(() => ({}));
        const createdNome = normalizeNome((created.nome || created.name) ? String(created.nome || created.name).trim() : normalizedNome);
        const normalizedUsuario = {
          id: created.id || (`local_${Date.now()}`),
          email: created.email || email.trim(),
          nome: createdNome,
          name: createdNome,
          avatarBg: computeAvatarBg(createdNome || normalizedNome),
          photoURL: created.photoURL || created.photo_url || null,
          isPro: false
        };
        try { localStorage.removeItem('versaoProAtiva'); } catch(e){}
        try { if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario); } catch(e){}
        try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch(e){}
        setSuccess('Cadastro realizado com sucesso! Entrando...');
        if (window.showToast) window.showToast('Cadastro realizado com sucesso! Entrando...', 'success', 1200);
        setTimeout(() => { try { navigate('/buscar-pecas'); } catch (e) {} }, 1000);
        setNome(''); setEmail(''); setSenha(''); setConfirmSenha(''); setErrors({});
        setLoading(false);
        return;
      }
      if (resp.status === 409) {
        const body = await resp.json().catch(() => ({}));
        setErrors({ form: 'Usuário já existe. Tente recuperar a senha ou entre em contato.' });
        setLoading(false);
        return;
      }
      // Other non-OK: fall back to attempt creating the user directly in Supabase
      try {
        const emailAddr = email.trim();
        const pw = senha;
        let _supabase = null;
        try { const mod = await import('../supabase'); _supabase = mod.default || mod.supabase; } catch (e) { _supabase = null; }
        if (_supabase && _supabase.auth && typeof _supabase.auth.signUp === 'function') {
          const { data, error } = await _supabase.auth.signUp({ email: emailAddr, password: pw, options: { data: { nome: normalizedNome } } });
          if (error) {
            setErrors({ form: 'Erro ao cadastrar no Supabase: ' + (error.message || 'Erro desconhecido') });
            setLoading(false);
            return;
          } else if (data && (data.user || data)) {
            const sbUser = data.user || data;
            const sbNome = normalizeNome((sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name)) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : normalizedNome);
            const normalizedUsuario = {
              id: sbUser.id || sbUser.user?.id || (`local_${Date.now()}`),
              email: sbUser.email || emailAddr,
              nome: sbNome,
              name: sbNome,
              avatarBg: computeAvatarBg(sbNome || normalizedNome),
              photoURL: sbUser.photoURL || sbUser.avatar_url || null,
              isPro: false
            };
            try { localStorage.removeItem('versaoProAtiva'); } catch(e){}
            try { if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario); } catch(e){}
            try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch(e){}
            setSuccess('Cadastro realizado (Supabase). Entrando...');
            if (window.showToast) window.showToast('Cadastro realizado (Supabase).', 'success', 1200);
            setTimeout(() => { try { navigate('/buscar-pecas'); } catch (e) {} }, 1000);
            setNome(''); setEmail(''); setSenha(''); setConfirmSenha(''); setErrors({});
            setLoading(false);
            return;
          }
        }
      } catch (err2) {
        setErrors({ form: 'Erro ao cadastrar no Supabase. Tente novamente.' });
        setLoading(false);
        return;
      }
      // Fallback persistence in localStorage
      try {
        const key = 'usuarios';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const createdLocal = { id: `local_${Date.now()}`, nome: normalizedNome, email: email.trim(), senha, criadoEm: new Date().toISOString(), avatarBg: computeAvatarBg(normalizedNome), isPro: false };
        try { localStorage.removeItem('versaoProAtiva'); } catch(e){}
        existing.push(createdLocal);
        localStorage.setItem(key, JSON.stringify(existing));
        try { if (setUsuarioLogado) setUsuarioLogado(createdLocal); } catch(e){}
        try { localStorage.setItem('usuario-logado', JSON.stringify(createdLocal)); } catch(e){}
        setSuccess('Cadastro (local) realizado com sucesso! Entrando...');
        if (window.showToast) window.showToast('Cadastro realizado (local). Entrando...', 'success', 1200);
        setTimeout(() => { try { navigate('/buscar-pecas'); } catch (e) {} }, 1000);
        setNome(''); setEmail(''); setSenha(''); setConfirmSenha(''); setErrors({});
        setLoading(false);
        return;
      } catch (err) {
        setErrors({ form: 'Erro ao salvar os dados localmente. Verifique o console.' });
        setLoading(false);
        return;
      }
    } catch (err) {
      setErrors({ form: 'Erro inesperado ao cadastrar. Verifique sua conexão ou tente novamente.' });
      setLoading(false);
    }
  }

  return (
    <>
      <MenuLogin />
      <div className="cadastro-main relative">
        <div className="cadastro-main-inner">
          {/* Lado esquerdo: formulário de cadastro */}
          <div className="cadastro-logo-wrapper">
            <h2 className="cadastro-section-title cadastro-title">Criar conta grátis</h2>
            <p className="cadastro-instruction">Crie sua conta para acessar todos os recursos.</p>
            <form className="cadastro-form" autoComplete="on" onSubmit={handleSubmit}>
              {errors.form && (
                <div className="form-error" style={{ marginBottom: 12, color: '#b91c1c', background: '#fff1f2', border: '1px solid #fecaca', padding: 8, borderRadius: 6, textAlign: 'center' }}>
                  {errors.form}
                </div>
              )}
              <label className="field">
                <input
                  className="input"
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Nome Completo"
                  autoComplete="name"
                  disabled={loading}
                />
                {errors.nome && <div className="error">{errors.nome}</div>}
              </label>
              <label className="field">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  disabled={loading}
                />
                {errors.email && <div className="error">{errors.email}</div>}
              </label>
              <label className="field">
                <div className="password-field">
                  <input
                    className="input password-input"
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Senha"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <ToggleCar
                    on={showSenha}
                    onClick={() => setShowSenha(s => !s)}
                    ariaLabel={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    disabled={loading}
                  />
                </div>

                <div className="password-checklist" aria-live="polite">
                  <ul className="password-checklist-list">
                    <li className={passwordChecklist.upper ? 'ok' : 'missing'}>Letra maiúscula</li>
                    <li className={passwordChecklist.lower ? 'ok' : 'missing'}>Letra minúscula</li>
                    <li className={passwordChecklist.number ? 'ok' : 'missing'}>Números</li>
                    <li className={passwordChecklist.minLength ? 'ok' : 'missing'}>Mínimo 6 dígitos</li>
                  </ul>
                </div>

                {errors.senha && <div className="error">{errors.senha}</div>}
              </label>
              <label className="field">
                <div className="password-field">
                  <input
                    className="input password-input"
                    type={showConfirmSenha ? 'text' : 'password'}
                    value={confirmSenha}
                    onChange={e => setConfirmSenha(e.target.value)}
                    placeholder="Confirmar Senha"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <ToggleCar
                    on={showConfirmSenha}
                    onClick={() => setShowConfirmSenha(s => !s)}
                    ariaLabel={showConfirmSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    disabled={loading}
                  />
                </div>
                {errors.confirmSenha && <div className="error">{errors.confirmSenha}</div>}
              </label>
              <button
                className="submit"
                type="submit"
                disabled={loading}
                style={loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
              {success && (
                <div className="success" style={{ marginTop: 12, color: '#065f46', background: '#ecfeff', border: '1px solid #bbf7d0', padding: 8, borderRadius: 6, textAlign: 'center' }}>
                  {success}
                </div>
              )}
            </form>
          </div>
          {/* Separador central */}
          <div className="cadastro-separador-central" />
          {/* Lado direito: Por que usar */}
          <div className="cadastro-content-right">
            <div className="cadastro-info-card">
              <h3 className="cadastro-info-title">Por que usar o Garagem Smart?</h3>
              <p className="cadastro-info-subtitle">
                Centralize informações, encontre peças com mais precisão e economize tempo no dia a dia.
              </p>
              <ul className="cadastro-benefits-list">
                <li className="cadastro-benefit-item">
                  <div className="cadastro-benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="cadastro-benefit-text">
                    <strong>Busca inteligente de peças</strong>
                    <span>Resultados mais precisos por modelo e categoria.</span>
                  </div>
                </li>
                <li className="cadastro-benefit-item">
                  <div className="cadastro-benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="cadastro-benefit-text">
                    <strong>Consulta de valores FIPE</strong>
                    <span>Preços atualizados para tomada de decisão.</span>
                  </div>
                </li>
                <li className="cadastro-benefit-item">
                  <div className="cadastro-benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="cadastro-benefit-text">
                    <strong>Suporte direto</strong>
                    <span>Atendimento via e-mail e WhatsApp.</span>
                  </div>
                </li>
                <li className="cadastro-benefit-item">
                  <div className="cadastro-benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="cadastro-benefit-text">
                    <strong>Comunidade exclusiva</strong>
                    <span>Troca de experiências no Discord.</span>
                  </div>
                </li>
                <li className="cadastro-benefit-item">
                  <div className="cadastro-benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15L12 3M12 3L16 7M12 3L8 7M2 17L2.621 19.485C2.72915 19.9177 2.97882 20.3018 3.33033 20.5763C3.68184 20.8508 4.11501 20.9999 4.561 21L19.439 21C19.885 20.9999 20.3182 20.8508 20.6697 20.5763C21.0212 20.3018 21.2708 19.9177 21.379 19.485L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="cadastro-benefit-text">
                    <strong>Comece grátis</strong>
                    <span>Você pode fazer upgrade quando quiser, direto pela sua conta.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
