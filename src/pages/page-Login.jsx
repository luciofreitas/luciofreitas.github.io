import React, { useState, useContext, useEffect, useRef } from 'react';
import { MenuLogin } from '../components';
import '../styles/pages/page-Login.css';
import '../styles/pages/page-Cadastro.css';
import usuariosData from '../data/usuarios.json';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { ToggleCar } from '../components';
// Using Supabase OAuth for Google login instead of Firebase
import { signInWithGooglePopup, startGoogleRedirect, handleRedirectResult } from '../firebaseAuth';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, fetchSignInMethodsForEmail, linkWithCredential, EmailAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';

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
  const [linkingCredential, setLinkingCredential] = useState(null);
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [linkEmail, setLinkEmail] = useState(null);
  const [linkError, setLinkError] = useState('');
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [pendingMergeIdToken, setPendingMergeIdToken] = useState(null);
  const [pendingMergeEmail, setPendingMergeEmail] = useState(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState('');

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

  // Helper to clean/format a display name (capitalize words, remove dev markers)
  function formatDisplayName(raw) {
    if (!raw || typeof raw !== 'string') return '';
    // remove common dev prefixes/markers
    let s = raw.trim();
    s = s.replace(/^(devuser\+|dev_|dev-|testuser\+|teste_)/i, '');
    // replace punctuation often used in emails/usernames with spaces
    s = s.replace(/[._+\-]+/g, ' ');
    // collapse multiple spaces
    s = s.replace(/\s+/g, ' ').trim();
    // capitalize words
    s = s.split(' ').map(part => part ? (part.charAt(0).toUpperCase() + part.slice(1)) : '').join(' ').trim();
    return s || raw;
  }

  // Handle Firebase redirect result (for mobile flows using signInWithRedirect)
  const processedRef = useRef(false);

  async function processFirebaseUser(user, googleCredential = null) {
    if (!user || processedRef.current) return;

    // Prevent duplicate accounts: if a manual/local account exists with the
    // same email, block the Google signin here and ask the user to signin
    // with their email/password (or contact support to unify accounts).
    try {
      const normalizedEmail = user && user.email ? String(user.email).trim().toLowerCase() : null;
      if (normalizedEmail) {
        // 1) Check local/manual users (localStorage/seed/demo)
        const existing = getUsuarios().find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail);
          if (existing && !existing.isDemo) {
          // If we have a google credential (redirect/popup provided), prompt to link
            if (googleCredential) {
                console.debug('Setting linkingCredential (processFirebaseUser):', googleCredential);
                setLinkingCredential(googleCredential);
                setLinkEmail(normalizedEmail);
                // clear global error and modal-specific error before showing modal
                setError('');
                setLinkError('');
                setShowLinkPrompt(true);
                return;
              }
          setError('Já existe uma conta criada com este e-mail. Faça login com e-mail/senha ou entre em contato para unificar as contas.');
          try { await signOut(auth); } catch (e) { /* ignore */ }
          return;
        }

        // 2) Also check Firebase sign-in methods: if a password-based provider exists,
        // prompt to link if google credential exists, otherwise block.
        try {
          const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
          if (Array.isArray(methods)) {
            const hasPassword = methods.includes('password');
            const hasGoogle = methods.includes('google.com') || methods.includes('google');
            if (hasPassword && !hasGoogle) {
              if (googleCredential) {
                setLinkingCredential(googleCredential);
                setLinkEmail(normalizedEmail);
                // clear global error and modal-specific error before showing modal
                setError('');
                setLinkError('');
                setShowLinkPrompt(true);
                return;
              }
              setError('Já existe uma conta criada com este e-mail (senha). Faça login com e-mail/senha ou entre em contato para unificar as contas.');
              try { await signOut(auth); } catch (e) { /* ignore */ }
              return;
            }
          }
        } catch (e) {
          // ignore errors from Firebase check (network etc.) and proceed with fallback
        }
      }
    } catch (e) { /* ignore any check errors and continue */ }

    // mark processed only when proceeding to finalize the signin flow
    processedRef.current = true;

    try {
      // Some mobile/redirect flows trigger onAuthStateChanged before the
      // ID token is immediately available. Retry getIdToken a few times
      // (short backoff) to increase chance of success in flaky environments.
      let idToken = null;
      const maxRetries = 6; // ~3s total backoff
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          idToken = await user.getIdToken();
          if (idToken) break;
        } catch (e) {
          // ignore and retry
        }
        // small delay before retrying
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 500));
      }
      if (!idToken) {
        // final attempt forcing refresh (if available)
        try { idToken = await user.getIdToken(true); } catch (e) { /* ignore */ }
      }
      if (!idToken) {
        console.warn('processFirebaseUser: could not obtain idToken after retries');
      }
      const apiBase = window.__API_BASE || '';
      let usuario = null;
      // Determine whether we should prompt the user to confirm a server-side merge
      let shouldPromptMerge = false;
      try {
        const normalizedEmail = user && user.email ? String(user.email).trim().toLowerCase() : null;
        if (normalizedEmail) {
          const existingLocal = getUsuarios().find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail);
          if (existingLocal && !existingLocal.isDemo) {
            shouldPromptMerge = true;
          } else {
            try {
              const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
              // If Firebase has no providers for this email, it's likely a Supabase-only user — prompt merge
              if (!Array.isArray(methods) || methods.length === 0) {
                shouldPromptMerge = true;
              }
            } catch (e) {
              // ignore fetch failures
            }
          }
        }
      } catch (e) { /* ignore */ }

      if (shouldPromptMerge) {
        // perform automatic server-side merge (one-click / automatic flow)
        // store pending token/email for debugging/rollback and then invoke merge immediately
        const mergeEmail = user && user.email ? String(user.email).trim().toLowerCase() : null;
        try {
          setPendingMergeIdToken(idToken);
          setPendingMergeEmail(mergeEmail);
          setMergeError('');
          // call confirmMerge with explicit idToken to avoid relying on state sync
          await confirmMerge(idToken);
        } catch (e) {
          // If automatic merge failed, fall back to showing confirmation modal so user can retry
          console.warn('automatic merge failed, falling back to manual confirm', e && e.message ? e.message : e);
          setShowMergeConfirm(true);
        }
        return;
      }
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

      const rawNomeFromToken = (user && user.displayName) || (user && user.email ? user.email.split('@')[0] : '');
      const nomeFromToken = formatDisplayName(rawNomeFromToken) || '';
      // Prefer the Firebase client displayName when available (shows the real Google name
      // even if backend returns a dev/test user). Fall back to backend fields otherwise.
      const normalizedUsuario = usuario ? {
        ...usuario,
        // prefer client displayName (nomeFromToken) when available
        nome: nomeFromToken || usuario.nome || usuario.name,
        name: nomeFromToken || usuario.name || usuario.nome,
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

      // If the backend returned a development/mock user (id like 'dev_...') or a
      // dev-style generated username (e.g. 'devuser+'), prefer the Firebase
      // client's displayName when available to avoid showing mock names in the UI.
      try {
        const isDevBackendUser = (normalizedUsuario && String(normalizedUsuario.id || '').startsWith('dev_'))
          || (normalizedUsuario && /devuser\+|dev_/.test(String(normalizedUsuario.nome || '').toLowerCase()));
        if (isDevBackendUser && nomeFromToken) {
          normalizedUsuario.nome = nomeFromToken;
          normalizedUsuario.name = nomeFromToken;
        }
      } catch (e) { /* ignore */ }

      if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario);
      try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
      if (window.showToast) window.showToast(`Bem-vindo(a), ${normalizedUsuario.nome || 'Usuário'}!`, 'success', 3000);
      navigate('/buscar-pecas');
    } catch (e) {
      // swallow errors but keep processed flag
      console.warn('processFirebaseUser failed', e && e.message ? e.message : e);
    }
  }

  // Expose a helper to simulate a Google/Firebase signin for local testing
  try {
    if (typeof window !== 'undefined') {
      // Example usage in console: window.__simulateGoogleSignin({ uid: 'x', email: 'demo@...', displayName: 'Demo User', getIdToken: async () => 'fake' })
      window.__simulateGoogleSignin = async (fakeUser) => {
        try {
          await processFirebaseUser(fakeUser);
          return { ok: true };
        } catch (e) {
          return { error: e && e.message ? e.message : e };
        }
      };
    }
  } catch (e) { /* ignore exposure errors */ }

  useEffect(() => {
    // Try to handle redirect result first
    (async () => {
      try {
        const result = await handleRedirectResult();
        if (result && result.user) {
          await processFirebaseUser(result.user, result.credential || null);
        } else if (result && result.error) {
          console.warn('handleRedirectResult returned error', result.error);
        }
      } catch (e) {
        console.warn('handleRedirectResult threw', e && e.message ? e.message : e);
      }
    })();

    // Fallback: listen for auth state changes (some environments signal sign-in via onAuthStateChanged instead)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await processFirebaseUser(user);
      }
    });

    return () => { try { unsubscribe && unsubscribe(); } catch (_) {} };
  }, [setUsuarioLogado, navigate]);

  // Handler to confirm server-side merge (called from confirmation modal)
  async function confirmMerge(overrideIdToken = null) {
    const tokenToUse = overrideIdToken || pendingMergeIdToken;
    console.debug('confirmMerge invoked', { tokenProvided: !!overrideIdToken, pendingMergeEmail, tokenToUse: !!tokenToUse });
    if (!tokenToUse) { setMergeError('Token indisponível para fusão.'); return; }
    setMergeLoading(true);
    setMergeError('');
    try {
      const apiBase = window.__API_BASE || '';
      const resp = await fetch(`${apiBase}/api/auth/merge-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenToUse}` },
        body: JSON.stringify({})
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setMergeError(body && body.error ? String(body.error) : `Merge falhou: ${resp.status}`);
        setMergeLoading(false);
        return;
      }
      const body = await resp.json().catch(() => ({}));
      if (body && body.success && body.user) {
        // finalize sign-in with merged user
        const merged = body.user;
        if (setUsuarioLogado) setUsuarioLogado(merged);
        try { localStorage.setItem('usuario-logado', JSON.stringify(merged)); } catch (e) {}
        if (window.showToast) window.showToast(`Bem-vindo(a), ${merged.nome || merged.name || 'Usuário'}!`, 'success', 3000);
        setShowMergeConfirm(false);
        setPendingMergeIdToken(null);
        setPendingMergeEmail(null);
        navigate('/buscar-pecas');
        return;
      }
      setMergeError('Não foi possível unir as contas. Tente novamente ou contate o suporte.');
    } catch (e) {
      console.error('confirmMerge failed', e);
      setMergeError('Erro ao comunicar com o servidor. Tente novamente.');
    } finally {
      setMergeLoading(false);
    }
  }

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

  // Handler to confirm linking Google credential to existing email/password account
  async function confirmLinkAccounts() {
    // modal-specific error state
    setLinkError('');
    console.debug('confirmLinkAccounts called', { linkingCredential, linkEmail });
    // keep global errors separate
    if (!linkingCredential) { setLinkError('Credencial do Google não disponível. Tente novamente.'); return; }
    try {
  const currentEmail = (linkingCredential && linkingCredential.email) ? linkingCredential.email : (linkEmail || null);
      // We expect the existing user to enter their password (linkPassword)
      if (!currentEmail) {
        setLinkError('Email não disponível para link.');
        return;
      }
      // Ensure this email actually has a password-based sign-in method in Firebase
      try {
        const methods = await fetchSignInMethodsForEmail(auth, currentEmail);
        if (!Array.isArray(methods) || !methods.includes('password')) {
          setLinkError('Não existe uma conta com autenticação por senha neste e-mail no Firebase. Use Recuperar senha ou contate o suporte para unir as contas.');
          return;
        }
      } catch (e) {
        // if the check fails (network etc.), continue but log
        console.warn('fetchSignInMethodsForEmail failed', e);
      }
      if (!linkPassword) {
        setLinkError('Digite a senha da conta existente para confirmar a união.');
        return;
      }

      // Reauthenticate by signing in with email/password; this will return the existing user
      let existingUser = null;
      try {
        const signInRes = await signInWithEmailAndPassword(auth, currentEmail, linkPassword);
        existingUser = signInRes && signInRes.user ? signInRes.user : null;
        if (!existingUser) {
          setLinkError('Falha ao autenticar a conta existente. Verifique a senha.');
          return;
        }
      } catch (signErr) {
        console.error('signInWithEmailAndPassword failed', signErr);
        // Provide clearer feedback for common firebase auth errors
        if (signErr && signErr.code) {
          if (signErr.code === 'auth/wrong-password' || signErr.code === 'AUTH_WRONG_PASSWORD') {
            setLinkError('Senha incorreta. Verifique e tente novamente.');
            return;
          }
          if (signErr.code === 'auth/user-not-found' || signErr.code === 'AUTH_USER_NOT_FOUND') {
            setLinkError('Usuário não encontrado no provedor de autenticação. Tente recuperar sua senha ou contate o suporte.');
            return;
          }
        }
        setLinkError('Falha ao autenticar a conta existente. Verifique a senha ou tente recuperar sua senha.');
        return;
      }

      // Now link the Google credential to the existing user
      try {
        await linkWithCredential(existingUser, linkingCredential);
      } catch (linkErr) {
        console.error('Erro ao linkar credencial:', linkErr);
        // Provide the firebase error code/message when possible
        if (linkErr && linkErr.code) {
          setLinkError(`Erro ao unir contas: ${linkErr.code} - ${linkErr.message || ''}`);
        } else if (linkErr && linkErr.message) {
          setLinkError(`Erro ao unir contas: ${linkErr.message}`);
        } else {
          setLinkError('Erro ao unir contas. Tente novamente.');
        }
        return;
      }

      // If linking succeeded, finalize sign-in using the existingUser (which now has google linked)
      await processFirebaseUser(existingUser);
      setShowLinkPrompt(false);
      setLinkPassword('');
      setLinkingCredential(null);
    } catch (e) {
      console.error('confirmLinkAccounts failed', e);
      setLinkError('Erro ao unir contas. Verifique os dados e tente novamente.');
    }
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
                  {/* show global errors only when not showing the link modal */}
                  {!showLinkPrompt && error && <div className="form-error">{error}</div>}

                  {/* Link accounts modal (shown when showLinkPrompt is true) */}
                  {showLinkPrompt && (
                    <div className="modal-overlay" style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',zIndex:9999}}>
                      <div className="modal" role="dialog" aria-modal="true" style={{background:'#fff',padding:'20px',maxWidth:'420px',width:'100%',borderRadius:8}}>
                        <h3>Unir contas</h3>
                        <p>Foi encontrada uma conta existente com este e-mail. Para unir a conta do Google com sua conta existente, confirme sua senha:</p>
                        <label className="field">
                          <span className="label">E-mail</span>
                          <input className={`input`} type="email" value={linkEmail || ''} readOnly />
                        </label>
                        {linkError && <div className="form-error" style={{marginTop:8}}>{linkError}</div>}
                        <label className="field">
                          <span className="label">Senha da conta existente</span>
                          <input
                            className={`input`}
                            type="password"
                            value={linkPassword}
                            onChange={(e) => setLinkPassword(e.target.value)}
                            placeholder="Senha"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                try { confirmLinkAccounts(); } catch (err) { /* ignore */ }
                              }
                            }}
                          />
                        </label>
                        <div style={{display: 'flex', gap: '8px', marginTop: 12}}>
                          <button type="button" className="submit" onClick={confirmLinkAccounts}>Confirmar e unir contas</button>
                          <button type="button" className="submit" onClick={async () => { try { await signOut(auth); } catch (e) {} setShowLinkPrompt(false); setLinkingCredential(null); setLinkPassword(''); }}>Cancelar</button>
                          <button type="button" className="submit" onClick={() => { try { window.location.href = '/recuperar-senha'; } catch (e) {} }}>Recuperar senha</button>
                        </div>
                        {/* If link via Firebase is not possible, allow server-side merge directly from this modal */}
                        {linkError && /autentica[cç][ãa]o por senha|senha/i.test(linkError) && (
                          <div style={{marginTop:12}}>
                            <button type="button" className="submit" onClick={async () => {
                              setLinkError('');
                              try {
                                let idToken = pendingMergeIdToken;
                                if (!idToken) {
                                  if (!auth || !auth.currentUser) {
                                    setLinkError('Usuário do provedor não disponível. Tente entrar novamente com Google.');
                                    return;
                                  }
                                  idToken = await auth.currentUser.getIdToken();
                                }
                                if (!idToken) { setLinkError('Não foi possível obter token do provedor.'); return; }
                                // Use pending merge flow: set token and call confirmMerge
                                setPendingMergeIdToken(idToken);
                                setPendingMergeEmail(linkEmail || (auth.currentUser && auth.currentUser.email));
                                // close link modal and show merge confirmation UI while performing merge
                                setShowLinkPrompt(false);
                                setShowMergeConfirm(true);
                                // Auto-run the merge so the POST is sent immediately
                                try {
                                  await confirmMerge();
                                } catch (e) {
                                  console.error('Auto confirmMerge failed', e);
                                }
                              } catch (e) {
                                console.error('mergeFromLinkModal failed', e);
                                setLinkError('Erro ao obter token/realizar fusão: ' + (e && e.message ? e.message : String(e)));
                              }
                            }}>Unir contas no sistema (merge)</button>
                          </div>
                        )}
                        <div style={{marginTop:8,fontSize:12}}><a href="/contato">Precisa de ajuda? Contate o suporte.</a></div>
                      </div>
                    </div>
                  )}

                    {/* Merge confirmation modal (server-side merge) */}
                    {showMergeConfirm && (
                      <div className="modal-overlay" style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',zIndex:10000}}>
                        <div className="modal" role="dialog" aria-modal="true" style={{background:'#fff',padding:'20px',maxWidth:'480px',width:'100%',borderRadius:8}}>
                          <h3>Unir contas (confirmação)</h3>
                          <p>Detectamos uma conta existente com o mesmo e-mail (<strong>{pendingMergeEmail}</strong>).</p>
                          <p>Se confirmar, iremos unir sua conta do Google com a conta existente no nosso sistema. Isso pode atualizar ou mesclar seus dados de perfil.</p>
                          {mergeError && <div className="form-error" style={{marginTop:8}}>{mergeError}</div>}
                          <div style={{display:'flex',gap:8,marginTop:12}}>
                            <button type="button" className="submit" onClick={confirmMerge} disabled={mergeLoading}>{mergeLoading ? 'Unindo...' : 'Confirmar e unir contas'}</button>
                            <button type="button" className="submit" onClick={() => { setShowMergeConfirm(false); setPendingMergeIdToken(null); setPendingMergeEmail(null); setMergeError(''); }}>Cancelar</button>
                          </div>
                          <div style={{marginTop:8,fontSize:12}}><a href="/contato">Precisa de ajuda? Contate o suporte.</a></div>
                        </div>
                      </div>
                    )}

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
                            // Try popup first (better UX on desktop). If popup fails (blocked/error), fall back to redirect.
                            let user = null;
                            let res = null;
                            try {
                              res = await signInWithGooglePopup();
                              if (res && res.user) {
                                user = res.user;
                              } else if (res && res.error) {
                                // Popup returned an error (could be blocked). We'll fallback to redirect below.
                                console.warn('signInWithGooglePopup returned error, falling back to redirect', res.error);
                              }
                            } catch (popupErr) {
                              // signInWithPopup threw (popup blocked or other). Fallback to redirect.
                              console.warn('signInWithGooglePopup threw, falling back to redirect', popupErr && popupErr.message ? popupErr.message : popupErr);
                            }

                            if (!user) {
                              const started = await startGoogleRedirect();
                              if (started && started.error) {
                                console.error('Failed to start redirect', started.error);
                                setError('Erro no login com Google. Tente novamente.');
                                setGoogleLoading(false);
                              }
                              // Redirect initiated (or error handled) — browser will navigate away on success.
                              return;
                            }

                            // At this point we have a Firebase user from popup flow
                            // Before proceeding, check for duplicate manual/local accounts
                            if (!user) {
                              setError('Falha ao obter usuário do provedor.');
                              setGoogleLoading(false);
                              return;
                            }
                            try {
                              const normalizedEmailPopup = user && user.email ? String(user.email).trim().toLowerCase() : null;
                              if (normalizedEmailPopup) {
                                const existingPopup = getUsuarios().find(u => String(u.email || '').trim().toLowerCase() === normalizedEmailPopup);
                                if (existingPopup && !existingPopup.isDemo) {
                                  // Found an existing manual account. Ask the user if they want to link accounts.
                                  // Save the google credential and email for later linking.
                                  const googleCred = res && res.credential ? res.credential : null;
                                    console.debug('Setting linkingCredential (popup flow):', googleCred);
                                    setLinkingCredential(googleCred);
                                    setLinkEmail(normalizedEmailPopup);
                                    // try to cache idToken so merge can run even if auth.currentUser is cleared
                                    try {
                                      if (user && typeof user.getIdToken === 'function') {
                                        const idt = await user.getIdToken();
                                        if (idt) setPendingMergeIdToken(idt);
                                      }
                                    } catch (e) { /* ignore */ }
                                    // clear global error and modal-specific error before showing modal
                                    setError('');
                                    setLinkError('');
                                    setShowLinkPrompt(true);
                                  // Do not finalize login yet. Keep the firebase user signed in until linking completes or user cancels.
                                  setGoogleLoading(false);
                                  return;
                                }

                                // Also check Firebase for password-based sign-in methods
                                try {
                                  const methodsPopup = await fetchSignInMethodsForEmail(auth, normalizedEmailPopup);
                                  if (Array.isArray(methodsPopup) && methodsPopup.includes('password')) {
                                    // If there is a password method, prompt to link by asking for password to reauthenticate
                                    const googleCred = res && res.credential ? res.credential : null;
                                    setLinkingCredential(googleCred);
                                    setLinkEmail(normalizedEmailPopup);
                                    try {
                                      if (user && typeof user.getIdToken === 'function') {
                                        const idt = await user.getIdToken();
                                        if (idt) setPendingMergeIdToken(idt);
                                      }
                                    } catch (e) { /* ignore */ }
                                    // clear global error and modal-specific error before showing modal
                                    setError('');
                                    setLinkError('');
                                    setShowLinkPrompt(true);
                                    setGoogleLoading(false);
                                    return;
                                  }
                                } catch (e) {
                                  // ignore firebase check errors
                                }
                              }
                            } catch (e) { /* ignore and continue */ }

                            // Finalize via shared logic (this will also call backend verify and navigate)
                            await processFirebaseUser(user, res && res.credential ? res.credential : null);
                            return;
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
