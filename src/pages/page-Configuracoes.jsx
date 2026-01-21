import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ToggleCar } from '../components';
import { AuthContext } from '../App';
import * as mlService from '../services/mlService';
import '../styles/pages/page-Configuracoes.css';

export default function PageConfiguracoes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuarioLogado: user, setUsuarioLogado } = useContext(AuthContext) || {};
  const [mlStatus, setMlStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileNome, setProfileNome] = useState('');
  const [profileTelefone, setProfileTelefone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecklist = useMemo(() => {
    const s = String(newPassword || '');
    return {
      upper: /\p{Lu}/u.test(s),
      lower: /\p{Ll}/u.test(s),
      number: /\d/.test(s),
      minLength: s.length >= 8,
    };
  }, [newPassword]);

  const isPasswordValid = useMemo(() => {
    return !!(passwordChecklist.upper && passwordChecklist.lower && passwordChecklist.number && passwordChecklist.minLength);
  }, [passwordChecklist]);

  function normalizeNome(value) {
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
  }

  function getUserNome(u) {
    if (!u) return '';
    const md = u.user_metadata || u.userMetadata || null;
    return (
      (md && (md.nome || md.name))
      || u.nome
      || u.name
      || ''
    );
  }

  function getUserTelefone(u) {
    if (!u) return '';
    const md = u.user_metadata || u.userMetadata || null;
    return (
      (md && (md.telefone || md.phone))
      || u.telefone
      || u.phone
      || ''
    );
  }

  useEffect(() => {
    const nome = getUserNome(user);
    const telefone = getUserTelefone(user);
    setProfileNome(String(nome || ''));
    setProfileTelefone(String(telefone || ''));
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Prefer server-side status (uses Supabase auth token; ML tokens stay on backend)
        const authToken = user?.access_token;
        const status = await mlService.getServerConnectionStatus({ authToken, userId: user?.id });
        if (!cancelled) setMlStatus(status);
      } catch (e) {
        if (!cancelled) setMlStatus({ connected: false, expired: false });
      }

      // Check for success parameter in URL
      const params = new URLSearchParams(location.search);
      if (params.get('ml_success') === 'true') {
        if (!cancelled) setShowSuccess(true);
        // Refresh status after successful connection
        try {
          const authToken = user?.access_token;
          const status = await mlService.getServerConnectionStatus({ authToken, userId: user?.id });
          if (!cancelled) setMlStatus(status);
        } catch (e) {}
        setTimeout(() => { if (!cancelled) setShowSuccess(false); }, 5000);
        navigate('/configuracoes', { replace: true });
      }
    })();

    return () => { cancelled = true; };
  }, [location, navigate, user]);

  const handleConnectML = async () => {
    try {
      if (!user || !user.id) {
        alert('Usuário não autenticado');
        return;
      }

      setIsConnecting(true);
      await mlService.initiateAuth(user.id);
    } catch (error) {
      console.error('Error connecting to ML:', error);
      alert('Erro ao conectar com Mercado Livre. Tente novamente.');
      setIsConnecting(false);
    }
  };

  const handleDisconnectML = async () => {
    try {
      if (confirm('Deseja realmente desconectar sua conta do Mercado Livre?')) {
        await mlService.disconnectServer({ authToken: user?.access_token, userId: user?.id });
        const status = await mlService.getServerConnectionStatus({ authToken: user?.access_token, userId: user?.id });
        setMlStatus(status);
        alert('Conta do Mercado Livre desconectada com sucesso!');
      }
    } catch (error) {
      console.error('Error disconnecting from ML:', error);
      alert('Erro ao desconectar. Tente novamente.');
    }
  };

  const handleSaveProfile = async (ev) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    setProfileError('');
    setProfileMessage('');

    if (!user) {
      setProfileError('Você precisa estar logado para editar o perfil.');
      return;
    }

    const normalizedNome = normalizeNome(profileNome);
    const telefone = String(profileTelefone || '').trim();

    if (!normalizedNome) {
      setProfileError('Informe seu nome.');
      return;
    }

    setProfileSaving(true);
    try {
      let _supabase = null;
      try {
        const mod = await import('../supabase');
        _supabase = mod.default || mod.supabase;
      } catch (e) {
        _supabase = null;
      }

      if (!_supabase || !_supabase.auth || typeof _supabase.auth.updateUser !== 'function' || _supabase._notConfigured) {
        setProfileError('Perfil indisponível: Supabase não configurado nesta build.');
        setProfileSaving(false);
        return;
      }

      const { data, error } = await _supabase.auth.updateUser({
        data: {
          nome: normalizedNome,
          telefone: telefone || null,
        }
      });

      if (error) {
        setProfileError(error.message || 'Erro ao salvar perfil.');
        setProfileSaving(false);
        return;
      }

      const updatedSbUser = data && data.user ? data.user : null;
      const mergedUser = {
        ...(user || {}),
        ...(updatedSbUser || {}),
        nome: normalizedNome,
        name: normalizedNome,
        telefone: telefone || '',
        user_metadata: {
          ...(((user || {}).user_metadata) || {}),
          ...((updatedSbUser && updatedSbUser.user_metadata) || {}),
          nome: normalizedNome,
          telefone: telefone || null,
        },
      };

      // Preserve access_token if present, as Supabase user object doesn't include it.
      if (user && user.access_token) mergedUser.access_token = user.access_token;

      try {
        // Update AuthContext + localStorage so the UI reflects changes immediately.
        if (typeof setUsuarioLogado === 'function') setUsuarioLogado(mergedUser);
      } catch (e) { /* ignore */ }

      try { localStorage.setItem('usuario-logado', JSON.stringify(mergedUser)); } catch (e) {}
      setProfileNome(normalizedNome);
      setProfileTelefone(telefone);
      setProfileMessage('Perfil atualizado com sucesso.');
      if (window.showToast) window.showToast('Perfil atualizado com sucesso.', 'success', 1800);
      setProfileSaving(false);
    } catch (e) {
      setProfileError('Erro inesperado ao salvar perfil.');
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (ev) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (!user) {
      setPasswordError('Você precisa estar logado para alterar a senha.');
      return;
    }

    if (!String(user?.email || '').trim()) {
      setPasswordError('Não foi possível identificar seu e-mail para confirmar a senha atual.');
      return;
    }

    if (!String(currentPassword || '').trim()) {
      setPasswordError('Digite sua senha atual para confirmar.');
      return;
    }

    if (!isPasswordValid) {
      setPasswordError('Senha fraca. Atenda aos requisitos abaixo.');
      return;
    }

    if (String(newPassword || '') !== String(confirmPassword || '')) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    setPasswordSaving(true);
    try {
      let _supabase = null;
      try {
        const mod = await import('../supabase');
        _supabase = mod.default || mod.supabase;
      } catch (e) {
        _supabase = null;
      }

      if (!_supabase || !_supabase.auth || typeof _supabase.auth.updateUser !== 'function' || _supabase._notConfigured) {
        setPasswordError('Alteração de senha indisponível: Supabase não configurado nesta build.');
        setPasswordSaving(false);
        return;
      }

      // Security: confirm the current password by re-authenticating.
      try {
        const email = String(user?.email || '').trim();
        const password = String(currentPassword || '');

        let reauthResult = null;
        if (typeof _supabase.auth.signInWithPassword === 'function') {
          reauthResult = await _supabase.auth.signInWithPassword({ email, password });
        } else if (typeof _supabase.auth.signIn === 'function') {
          reauthResult = await _supabase.auth.signIn({ email, password });
        }

        const reauthError = reauthResult && reauthResult.error ? reauthResult.error : null;
        if (reauthError) {
          const msg = (reauthError.message || '').toLowerCase();
          setPasswordError(msg.includes('invalid') || msg.includes('credentials') || msg.includes('senha')
            ? 'Senha atual incorreta.'
            : (reauthError.message || 'Não foi possível confirmar sua senha atual.'));
          setPasswordSaving(false);
          return;
        }

        const session = reauthResult && reauthResult.data ? reauthResult.data.session : null;
        const reauthUser = reauthResult && reauthResult.data ? reauthResult.data.user : null;

        if (session && session.access_token) {
          const merged = { ...(user || {}), ...(reauthUser || {}) };
          merged.access_token = session.access_token;
          try {
            if (typeof setUsuarioLogado === 'function') setUsuarioLogado(merged);
          } catch (e) { /* ignore */ }
          try { localStorage.setItem('usuario-logado', JSON.stringify(merged)); } catch (e) {}
        }
      } catch (e) {
        setPasswordError('Não foi possível confirmar sua senha atual.');
        setPasswordSaving(false);
        return;
      }

      const { error } = await _supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message || 'Erro ao alterar senha.');
        setPasswordSaving(false);
        return;
      }

      setPasswordMessage('Senha atualizada com sucesso.');
      if (window.showToast) window.showToast('Senha atualizada com sucesso.', 'success', 1800);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setShowPasswordForm(false);
      setPasswordSaving(false);
    } catch (e) {
      setPasswordError('Erro inesperado ao alterar senha.');
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <Menu />
      <div className="page-wrapper">
        <div className="page-content">
          <div className="config-container">
            <div className="config-header">
              <button 
                className="config-back-btn"
                onClick={() => navigate(-1)}
                aria-label="Voltar"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                </svg>
                Voltar
              </button>
              <h1 className="config-title">Configurações</h1>
              <p className="config-subtitle">Personalize sua experiência no Garagem Smart</p>
            </div>

            <div className="config-sections">
              {/* Seção de Perfil */}
              <section className="config-section">
                <div className="config-section-header">
                  <div className="config-section-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="config-section-info">
                    <h2 className="config-section-title">Perfil</h2>
                    <p className="config-section-description">Atualize seus dados de conta</p>
                  </div>
                </div>

                {profileError && (
                  <div className="config-banner error">
                    {profileError}
                  </div>
                )}
                {profileMessage && (
                  <div className="config-banner success">
                    {profileMessage}
                  </div>
                )}

                <div className="profile-form">
                  <form onSubmit={handleSaveProfile}>
                    <div className="profile-grid">
                      <label className="profile-field">
                        <span className="profile-label">E-mail</span>
                        <input
                          className="profile-input"
                          type="email"
                          value={String(user?.email || '')}
                          readOnly
                          disabled
                        />
                      </label>

                      <label className="profile-field">
                        <span className="profile-label">Nome</span>
                        <input
                          className="profile-input"
                          type="text"
                          value={profileNome}
                          onChange={(e) => setProfileNome(e.target.value)}
                          placeholder="Seu nome"
                          disabled={profileSaving}
                          autoComplete="name"
                        />
                      </label>

                      <label className="profile-field">
                        <span className="profile-label">Telefone (opcional)</span>
                        <input
                          className="profile-input"
                          type="tel"
                          value={profileTelefone}
                          onChange={(e) => setProfileTelefone(e.target.value)}
                          placeholder="(DDD) 99999-9999"
                          disabled={profileSaving}
                          autoComplete="tel"
                        />
                      </label>
                    </div>

                    <div className="profile-actions">
                      <button
                        type="button"
                        className="profile-btn secondary"
                        onClick={() => {
                          setPasswordMessage('');
                          setPasswordError('');
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setShowCurrentPassword(false);
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                          setShowPasswordForm(v => !v);
                        }}
                        disabled={profileSaving || passwordSaving}
                      >
                        {showPasswordForm ? 'Cancelar troca de senha' : 'Alterar senha'}
                      </button>
                      <button
                        type="submit"
                        className="profile-btn primary"
                        disabled={profileSaving}
                      >
                        {profileSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </form>

                  {showPasswordForm && (
                    <div className="profile-password">
                      {passwordError && (
                        <div className="config-banner error">
                          {passwordError}
                        </div>
                      )}
                      {passwordMessage && (
                        <div className="config-banner success">
                          {passwordMessage}
                        </div>
                      )}

                      <form onSubmit={handleChangePassword}>
                        <div className="profile-grid">
                          <label className="profile-field">
                            <span className="profile-label">Senha atual</span>
                            <div className="password-field">
                              <input
                                className="profile-input password-input"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => {
                                  setPasswordError('');
                                  setPasswordMessage('');
                                  setCurrentPassword(e.target.value);
                                }}
                                placeholder="Digite sua senha atual"
                                disabled={passwordSaving}
                                autoComplete="current-password"
                              />
                              <ToggleCar
                                on={showCurrentPassword}
                                onClick={() => { if (passwordSaving) return; setShowCurrentPassword(v => !v); }}
                                ariaLabel={showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                              />
                            </div>
                          </label>

                          <label className="profile-field">
                            <span className="profile-label">Nova senha</span>
                            <div className="password-field">
                              <input
                                className="profile-input password-input"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => {
                                  setPasswordError('');
                                  setPasswordMessage('');
                                  setNewPassword(e.target.value);
                                }}
                                placeholder="Digite a nova senha"
                                disabled={passwordSaving}
                                minLength={8}
                                autoComplete="new-password"
                              />
                              <ToggleCar
                                on={showNewPassword}
                                onClick={() => { if (passwordSaving) return; setShowNewPassword(v => !v); }}
                                ariaLabel={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                              />
                            </div>
                            <div className="password-checklist" aria-live="polite">
                              <ul className="password-checklist-list">
                                <li className={passwordChecklist.upper ? 'ok' : 'missing'}>Letra maiúscula</li>
                                <li className={passwordChecklist.lower ? 'ok' : 'missing'}>Letra minúscula</li>
                                <li className={passwordChecklist.number ? 'ok' : 'missing'}>Números</li>
                                <li className={passwordChecklist.minLength ? 'ok' : 'missing'}>Mínimo 8 dígitos</li>
                              </ul>
                            </div>
                          </label>

                          <label className="profile-field">
                            <span className="profile-label">Confirmar nova senha</span>
                            <div className="password-field">
                              <input
                                className="profile-input password-input"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => {
                                  setPasswordError('');
                                  setPasswordMessage('');
                                  setConfirmPassword(e.target.value);
                                }}
                                placeholder="Digite novamente"
                                disabled={passwordSaving}
                                minLength={8}
                                autoComplete="new-password"
                              />
                              <ToggleCar
                                on={showConfirmPassword}
                                onClick={() => { if (passwordSaving) return; setShowConfirmPassword(v => !v); }}
                                ariaLabel={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                              />
                            </div>
                          </label>
                        </div>

                        <div className="profile-actions">
                          <button
                            type="submit"
                            className="profile-btn primary"
                            disabled={
                              passwordSaving
                              || !String(currentPassword || '').trim()
                              || !isPasswordValid
                              || String(newPassword || '') !== String(confirmPassword || '')
                            }
                          >
                            {passwordSaving ? 'Atualizando...' : 'Atualizar senha'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </section>

              {/* Seção de Integrações */}
              <section className="config-section">
                <div className="config-section-header">
                  <div className="config-section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                      <circle cx="4" cy="4" r="2"/>
                    </svg>
                  </div>
                  <div className="config-section-info">
                    <h2 className="config-section-title">Integrações</h2>
                    <p className="config-section-description">Conecte sua conta com serviços externos</p>
                  </div>
                </div>

                {showSuccess && (
                  <div className="ml-success-banner">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Mercado Livre conectado com sucesso!</span>
                  </div>
                )}

                <div className="integration-card">
                  <div className="integration-info">
                    <div className="integration-logo">ML</div>
                    <div>
                      <h3 className="integration-title">Mercado Livre</h3>
                      <p className="integration-description">
                        {mlStatus?.connected 
                          ? mlStatus.expired 
                            ? 'Conexão expirada - Reconecte para continuar'
                            : 'Conta conectada e ativa'
                          : 'Conecte sua conta para acessar funcionalidades adicionais'}
                      </p>
                      {mlStatus?.connected && mlStatus?.connectedAt && (
                        <p className="integration-meta">
                          Conectado em: {new Date(mlStatus.connectedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {mlStatus?.connected ? (
                    <button 
                      className="integration-btn disconnect"
                      onClick={handleDisconnectML}
                    >
                      Desconectar
                    </button>
                  ) : (
                    <button 
                      className="integration-btn connect"
                      onClick={handleConnectML}
                      disabled={isConnecting}
                    >
                      {isConnecting ? 'Conectando...' : 'Conectar'}
                    </button>
                  )}
                </div>
              </section>

              {/* Placeholder para futuras configurações */}
              <section className="config-section config-section-disabled">
                <div className="config-section-header">
                  <div className="config-section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="config-section-info">
                    <h2 className="config-section-title">Mais Configurações</h2>
                    <p className="config-section-description">Em breve mais opções de personalização</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
