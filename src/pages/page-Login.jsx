import React, { useState, useContext, useEffect } from 'react';
import { MenuLogin } from '../components';
import '../styles/pages/page-Login.css';
import '../styles/pages/page-Cadastro.css';
import usuariosData from '../data/usuarios.json';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { ToggleCar } from '../components';
// Using Supabase OAuth for Google login instead of Firebase
import { signInWithGooglePopup, startGoogleRedirect, handleRedirectResult } from '../firebaseAuth';

const usuariosDemoGlobais = [
  { id: 'demo1', nome: 'Usuário Demo', email: 'demo@pecafacil.com', senha: '123456', celular: '11999999999', isDemo: true },
  { id: 'admin1', nome: 'Admin Demo', email: 'admin@pecafacil.com', senha: 'admin123', celular: '11888888888', isDemo: true },
  { id: 'teste1', nome: 'Teste Público', email: 'teste@pecafacil.com', senha: 'teste123', celular: '11777777777', isDemo: true }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  // Detect mobile: prefer user agent check for mobile devices or small viewport
  const isMobile = (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)) || (typeof window !== 'undefined' && window.innerWidth <= 768);
  // prefill email when redirected from cadastro
  useEffect(() => {
    try {
      const st = window.history.state && window.history.state.usr && window.history.state.usr.state;
      // react-router HashRouter stores the state inside history.state.usr.state in some setups
      const forwarded = st || (window.history.state && window.history.state.state);
      const pref = forwarded && forwarded.email;
      if (pref) setEmail(String(pref).trim());
    } catch (e) { /* ignore */ }
  }, []);
  const { setUsuarioLogado } = useContext(AuthContext || {});

  useEffect(() => { try { localStorage.setItem('__test_localStorage__', 'test'); localStorage.removeItem('__test_localStorage__'); } catch (e) {} }, []);

  // Handle Firebase redirect result (for mobile flows using signInWithRedirect)
  useEffect(() => {
    (async () => {
      try {
        const result = await handleRedirectResult();
        if (result && result.user) {
          // We have a Firebase user from redirect; proceed with same logic as popup success
          const user = result.user;
          const idToken = await user.getIdToken();
          const apiBase = window.__API_BASE || '';
          let usuario = null;
          try {
            const resp = await fetch(`${apiBase}/api/auth/firebase-verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
              body: JSON.stringify({})
            });
            if (resp.ok) {
              const body = await resp.json().catch(() => ({}));
              usuario = (body && (body.user || body.usuario)) ? (body.user || body.usuario) : null;
            }
          } catch (e) { /* ignore and fallback to client user */ }

          const nomeFromToken = (user.displayName) || (user.email ? user.email.split('@')[0] : '');
          const normalizedUsuario = usuario ? {
            ...usuario,
            nome: usuario.nome || usuario.name || nomeFromToken,
            name: usuario.name || usuario.nome || nomeFromToken,
            access_token: idToken,
            photoURL: usuario.photoURL || usuario.photo_url || usuario.photo || user.photoURL || null
          } : {
            id: user.uid,
            email: user.email,
            nome: nomeFromToken,
            name: nomeFromToken,
            access_token: idToken,
            photoURL: user.photoURL || null
          };

          if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario);
          try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
          if (window.showToast) window.showToast(`Bem-vindo(a), ${normalizedUsuario.nome || 'Usuário'}!`, 'success', 3000);
          navigate('/buscar-pecas');
        }
      } catch (e) { /* ignore redirect errors */ }
    })();
  }, [setUsuarioLogado, navigate]);

  function getUsuarios() {
    let usuarios = [...usuariosDemoGlobais];
    try { const raw = localStorage.getItem('usuarios'); if (raw) usuarios = usuarios.concat(JSON.parse(raw)); } catch (e) {}
    try { const seedData = (usuariosData || []).map(u => ({ id: u.id, nome: u.nome || '', celular: String(u.celular || '').replace(/\D/g, ''), email: String(u.email || '').trim().toLowerCase(), senha: String(u.senha || '') })); usuarios = usuarios.concat(seedData); } catch (e) {}
    return usuarios;
  }

  function handleLogin(e) {
    e.preventDefault();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedSenha = String(senha || '');

    (async () => {
      try {
        // Try Supabase Auth sign-in (frontend) and then verify token with backend
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: normalizedSenha });
        if (error) {
          console.warn('Supabase auth signIn error:', error);
          setError('E-mail ou senha incorretos.');
          return;
        }

        const session = data && data.session ? data.session : null;
        const accessToken = session && session.access_token ? session.access_token : null;
        if (!accessToken) {
          console.warn('Supabase signIn returned no access token');
          setError('Erro ao efetuar login. Tente novamente.');
          return;
        }

        // Send token to backend for verification/upsert
        const apiBase = window.__API_BASE || '';
        const resp = await fetch(`${apiBase}/api/auth/supabase-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ access_token: accessToken }),
        });

        if (!resp.ok) {
          console.warn('Backend supabase-verify failed', resp.status);
          setError('Erro ao verificar conta. Tente novamente.');
          return;
        }

        const body = await resp.json().catch(() => ({}));
        const usuario = (body && body.user) ? body.user : null;
        if (!usuario) {
          setError('Erro ao obter dados do usuário.');
          return;
        }

        function displayNameFromEmail(email){
          if(!email || typeof email !== 'string') return '';
          const local = email.split('@')[0] || '';
          return local.replace(/[._-]+/g,' ').split(' ').map(s => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '').join(' ').trim();
        }

        const inferredName = (usuario.nome || usuario.name || '').trim() || displayNameFromEmail(usuario.email || usuario.email_address || usuario.mail);
        const normalizedUsuario = {
          ...usuario,
          nome: inferredName,
          name: inferredName,
          access_token: accessToken
        };

        setError('');
        if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario);
        try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
        if (window.showToast) window.showToast(`Bem-vindo(a), ${normalizedUsuario.nome || 'Usuário'}!`, 'success', 3000);
        navigate('/buscar-pecas');
        return;
      } catch (err) {
        console.warn('Login flow failed, falling back to local users', err && err.message);
      }

      // Fallback to existing local lookup
      const usuario = getUsuarios().find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail && String(u.senha || '') === normalizedSenha);
      if (!usuario) { setError('E-mail ou senha incorretos.'); return; }
      setError('');
      if (setUsuarioLogado) setUsuarioLogado(usuario);
      try { localStorage.setItem('usuario-logado', JSON.stringify(usuario)); } catch (e) {}
      if (window.showToast) window.showToast(`Bem-vindo(a), ${usuario.nome || 'Usuário'}!`, 'success', 3000);
      navigate('/buscar-pecas');
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
                <h1 className="cadastro-title">Entrar</h1>
                <p className="cadastro-sub">Acesse sua conta para gerenciar pedidos e recursos</p>

                <form className="cadastro-form" onSubmit={handleLogin} noValidate>
                  {error && <div className="form-error">{error}</div>}

                  <label className="field">
                    <span className="label">E-mail</span>
                    <input className={`input`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@exemplo.com" autoComplete="username" />
                  </label>

                  <label className="field">
                    <span className="label">Senha</span>
                    <div className="password-field">
                      <input className={`input password-input`} type={showPasswordLogin ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" autoComplete="current-password" />
                      <ToggleCar on={showPasswordLogin} onClick={() => setShowPasswordLogin(s => !s)} ariaLabel={showPasswordLogin ? 'Ocultar senha' : 'Mostrar senha'} />
                    </div>
                  </label>

                  <div className="cadastro-forgot-row"><a href="#" className="login-forgot-link" onClick={e => { e.preventDefault(); }}>Esqueci minha senha</a></div>

                  <button className="submit" type="submit">Entrar</button>

                  <div className="social-login-row">
                    <button 
                      type="button" 
                      className="google-btn google-btn-round" 
                      aria-label="Entrar com Google" 
                      title="Entrar com Google"
                      disabled={googleLoading}
                      onClick={async () => {
                          if (googleLoading) return; // prevent multiple clicks
                          setGoogleLoading(true);
                          setError('');
                          try {
                            if (isMobile) {
                              // On mobile, use redirect flow which is more reliable in mobile browsers
                              const started = await startGoogleRedirect();
                              if (started && started.error) {
                                console.error('Failed to start redirect', started.error);
                                setError('Erro no login com Google. Tente novamente.');
                              }
                              // Redirect has been initiated; the browser will navigate away. Do not proceed further here.
                              return;
                            }

                            // Desktop: use popup flow
                            const res = await signInWithGooglePopup();
                            if (res.error) {
                              console.error('Firebase popup error', res.error);
                              setError('Erro no login com Google. Tente novamente.');
                              setGoogleLoading(false);
                              return;
                            }
                            const user = res.user;
                            if (!user) {
                              setError('Falha ao obter usuário do provedor.');
                              setGoogleLoading(false);
                              return;
                            }

                            // Get ID token and send to backend for verification/upsert
                            const idToken = await user.getIdToken();
                            const apiBase = window.__API_BASE || '';
                            let usuario = null;
                            try {
                              const resp = await fetch(`${apiBase}/api/auth/firebase-verify`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                                body: JSON.stringify({})
                              });

                              if (resp.ok) {
                                const body = await resp.json().catch(() => ({}));
                                usuario = (body && (body.user || body.usuario)) ? (body.user || body.usuario) : null;
                              } else {
                                // Backend returned non-ok (could be down/unreachable). We'll fallback to using
                                // the Firebase client user so the login still proceeds on GitHub Pages.
                                console.warn('Backend firebase-verify returned non-ok', resp.status);
                                usuario = null;
                              }
                            } catch (fetchErr) {
                              // Network error (CORS, DNS, offline...). Fallback to client-side user.
                              console.warn('Failed to call backend firebase-verify:', fetchErr && fetchErr.message ? fetchErr.message : fetchErr);
                              usuario = null;
                            }

                            // Fallback to using Firebase user fields if backend didn't return user
                            const nomeFromToken = (user.displayName) || (user.email ? user.email.split('@')[0] : '');
                            const normalizedUsuario = usuario ? {
                              ...usuario,
                              nome: usuario.nome || usuario.name || nomeFromToken,
                              name: usuario.name || usuario.nome || nomeFromToken,
                              access_token: idToken,
                              photoURL: usuario.photoURL || usuario.photo_url || usuario.photo || user.photoURL || null
                            } : {
                              id: user.uid,
                              email: user.email,
                              nome: nomeFromToken,
                              name: nomeFromToken,
                              access_token: idToken,
                              photoURL: user.photoURL || null
                            };

                            if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario);
                            try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
                            if (window.showToast) window.showToast(`Bem-vindo(a), ${normalizedUsuario.nome || 'Usuário'}!`, 'success', 3000);
                            navigate('/buscar-pecas');
                          } catch (err) {
                            console.error('Google popup flow failed', err && err.message ? err.message : err);
                            setError('Erro inesperado durante login. Tente novamente.');
                          } finally {
                            setGoogleLoading(false);
                          }
                        }}>
                      {/* Colored Google G SVG */}
                      <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.9 0 7.1 1.4 9.2 3.2l6.8-6.6C35.6 3 30.1 1 24 1 14.7 1 6.9 6.6 3.1 14.7l7.9 6.1C12.4 15.1 17.7 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.5 24c0-1.6-.1-2.9-.4-4.3H24v8.2h12.9c-.6 3.2-2.9 5.9-6.1 7.4l9.4 7.3C43.9 37.4 46.5 31.1 46.5 24z"/>
                        <path fill="#4A90E2" d="M10 29.8A14.9 14.9 0 0 1 9.1 24c0-1.2.2-2.3.5-3.4L2 14.5A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l7.5-5z"/>
                        <path fill="#FBBC05" d="M24 46c6.1 0 11.6-2 15.7-5.4l-9.4-7.3c-2.5 1.7-5.7 2.8-9 2.8-6.3 0-11.6-4.6-13.6-10.8L2.5 34.8C6.9 41.4 14.7 46 24 46z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </svg>
                    </button>
                  </div>

                  <div className="cadastro-signup-row">
                    <Link to="/cadastro" className="signup-link">Crie sua conta agora!</Link>
                  </div>
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
