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
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSuccess('');
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    // Normalize name (collapse whitespace, trim) and attempt create -> then auto-login
    const normalizedNome = String(nome || '').trim().replace(/\s+/g, ' ');
    try {
      const apiBase = window.__API_BASE || '';
      const resp = await fetch(`${apiBase}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: normalizedNome, email: email.trim(), senha }),
      });
      if (resp.status === 201) {
        const created = await resp.json().catch(() => ({}));
        const normalizedUsuario = {
          id: created.id || (`local_${Date.now()}`),
          email: created.email || email.trim(),
          nome: (created.nome || created.name) ? String(created.nome || created.name).trim() : normalizedNome,
          name: (created.nome || created.name) ? String(created.nome || created.name).trim() : normalizedNome,
          avatarBg: computeAvatarBg((created.nome || created.name) ? String(created.nome || created.name).trim() : normalizedNome),
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
            const normalizedUsuario = {
              id: sbUser.id || sbUser.user?.id || (`local_${Date.now()}`),
              email: sbUser.email || emailAddr,
              nome: (sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name)) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : normalizedNome,
              name: (sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name)) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : normalizedNome,
              avatarBg: computeAvatarBg((sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name)) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : normalizedNome),
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
            <h2 className="cadastro-section-title cadastro-title">Cadastrar</h2>
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
              <button className="submit" type="submit" disabled={loading} style={loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
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
          {/* Lado direito: Card Seja Pro */}
          <div className="cadastro-content-center">
            <div className="cadastro-inicio-pro-card cadastro-inicio-pro-card-featured">
              <div className="cadastro-pro-card-header">
                <h3 className="cadastro-pro-card-title">Seja Pro</h3>
                <p className="cadastro-pro-card-price">R$ 10,00</p>
                <p className="cadastro-pro-card-period">por mês</p>
              </div>
              <div className="cadastro-pro-card-body">
                <ul className="cadastro-pro-card-features">
                  <li className="cadastro-feature-enabled">
                    <span className="cadastro-feature-icon">✓</span>
                    <span>Acesso ao buscador de peças</span>
                  </li>
                  <li className="cadastro-feature-enabled">
                    <span className="cadastro-feature-icon">✓</span>
                    <span>Valores da Tabela FIPE</span>
                  </li>
                  <li className="cadastro-feature-enabled">
                    <span className="cadastro-feature-icon">✓</span>
                    <span>Suporte via email</span>
                  </li>
                  <li className="cadastro-feature-enabled">
                    <span className="cadastro-feature-icon">✓</span>
                    <span>Suporte via WhatsApp</span>
                  </li>
                  <li className="cadastro-feature-enabled">
                    <span className="cadastro-feature-icon">✓</span>
                    <span>Comunidade no Discord</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
