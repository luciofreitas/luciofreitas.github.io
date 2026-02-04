import React, { useState, useContext, useEffect, useRef } from 'react';
import { MenuLogin } from '../components';
import '../styles/pages/page-Login.css';
import '../styles/pages/page-Cadastro.css';
import SeparadorCentral from '../components/SeparadorCentral';
import usuariosData from '../data/usuarios.json';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { ToggleCar } from '../components';
// Lazy-load Supabase and Firebase auth modules only when needed to keep
// the main bundle small. Helpers below cache imports per-session.
let _supabaseCache = null;
async function getSupabaseClient() {
  if (_supabaseCache) return _supabaseCache;
  try {
    const mod = await import('../supabase');
    const sup = mod.default || mod.supabase;
    const isConfigured = !!(mod.isConfigured || mod.isConfigured === true);
    _supabaseCache = { supabase: sup, isConfigured };
    return _supabaseCache;
  } catch (e) {
    _supabaseCache = { supabase: null, isConfigured: false };
    return _supabaseCache;
  }
}

async function getFirebaseAuthHelpers() {
  const [fb = {}, authMod = {}] = await Promise.all([
    import('../firebase').catch(() => ({})),
    import('firebase/auth').catch(() => ({})),
  ]);
  return { auth: fb.auth, authMod };
}

async function getFirebaseAuthApi() {
  const mod = await import('../firebaseAuth').catch(() => ({}));
  return mod;
}

const usuariosDemoGlobais = [
  { id: 'demo1', nome: 'Usuário Demo', email: 'demo@garagemsmart.com', senha: '123456', celular: '11999999999', isDemo: true },
  { id: 'admin1', nome: 'Admin Demo', email: 'admin@garagemsmart.com', senha: 'admin123', celular: '11888888888', isDemo: true },
  { id: 'teste1', nome: 'Teste Público', email: 'teste@garagemsmart.com', senha: 'teste123', celular: '11777777777', isDemo: true }
];

export default function Login() {
    async function firebaseGoogleLogin() {
      const authApi = await getFirebaseAuthApi();
      if (authApi && typeof authApi.signInWithGooglePopup === 'function') {
        const res = await authApi.signInWithGooglePopup();
        if (res && res.user) {
          await processFirebaseUser(res.user, res.credential || null);
        } else if (res && res.error) {
          setError('Erro ao autenticar com Google: ' + (res.error.message || 'Erro desconhecido'));
        } else {
          setError('Não foi possível autenticar com Google.');
        }
      } else {
        setError('Login com Google não está disponível.');
      }
    }

    // Handler para login com Google (Firebase direto)
    // NOTE: Supabase Google OAuth is currently misconfigured in this project
    // (Google returns deleted_client). We keep Firebase as the default to avoid
    // redirecting users to an error page.
    async function handleGoogleLogin(e) {
      try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); } catch (_) {}
      setError('');
      setGoogleLoading(true);
      try {
        await firebaseGoogleLogin();
      } catch (e) {
        setError('Erro inesperado no login Google: ' + (e && e.message ? e.message : e));
      } finally {
        setGoogleLoading(false);
      }
    }

    // Handler para login com Google (compatibilidade - Firebase direto)
    async function handleGoogleLoginCompat(e) {
      try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); } catch (_) {}
      setError('');
      setGoogleLoading(true);
      try {
        await firebaseGoogleLogin();
      } catch (e) {
        setError('Erro inesperado no login Google: ' + (e && e.message ? e.message : e));
      } finally {
        setGoogleLoading(false);
      }
    }
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [redirectPending, setRedirectPending] = useState(false);
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
  const isDev = !!(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
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
    
    // LOG RAW USER DATA FROM FIREBASE/GOOGLE
    if (isDev) {
      console.log('🔍 [RAW] Firebase User Object:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        providerData: user.providerData
      });
    } else {
      // In production, log only non-sensitive info to avoid exposing PII in console
      try { console.info('[auth] Firebase user signed in', { uid: user.uid, displayName: user.displayName ? user.displayName : undefined }); } catch (e) {}
    }
    
    processedRef.current = true; // Mark immediately to prevent double processing
    
    try { console.time('[auth-timing] processFirebaseUser total'); } catch (e) {}

    try {
      // Optimize idToken retrieval: get immediately without retries for faster experience
      let idToken = null;
      try { console.time('[auth-timing] wait-for-idToken'); } catch (e) {}
      try {
        idToken = await user.getIdToken();
      } catch (e) {
        console.warn('processFirebaseUser: could not obtain idToken', e);
      }
      try { console.timeEnd('[auth-timing] wait-for-idToken'); } catch (e) {}
      if (!idToken) {
        console.warn('processFirebaseUser: no idToken available');
      }
      const rawNomeFromToken = (user && user.displayName) || (user && user.email ? user.email.split('@')[0] : '');
      const nomeFromToken = formatDisplayName(rawNomeFromToken) || '';

      // Backend verification: fetch canonical user from DB (blocking with timeout)
      // This avoids a partially-synced state where the UI starts using user.uid
      // before we resolve the canonical DB id + professional profile.
      try { console.time('[auth-timing] backend-verify'); } catch (e) {}
      const apiBase = window.__API_BASE || '';
      let backendUser = null;
      let backendLegacyToken = null;
      if (idToken) {
        try {
          const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
          const timeout = setTimeout(() => { try { controller && controller.abort(); } catch (_) {} }, 6000);
          const resp = await fetch(`${apiBase}/api/auth/firebase-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ email: user.email || null, uid: user.uid || null, photoURL: user.photoURL || null }),
            signal: controller ? controller.signal : undefined,
          });
          clearTimeout(timeout);
          const body = await resp.json().catch(() => null);
          if (isDev) console.log('[DEBUG] Backend response status:', resp.status);
          if (isDev) console.log('[DEBUG] Backend response body:', body);
          if (body && body.legacy_token) backendLegacyToken = String(body.legacy_token);
          if (body && (body.user || body.usuario)) backendUser = body.user || body.usuario;
          else if (body && body.error) {
            const errMsg = String(body.error);
            if (/firebase admin not configured/i.test(errMsg)) {
              try {
                if (window.showToast) window.showToast('Login Google limitado: servidor sem verificação Firebase. Algumas funções (ex.: conta profissional) podem não sincronizar.', 'warning', 6000);
              } catch (e) {}
            }
          }
        } catch (e) {
          console.warn('Backend verification failed (will fallback to Firebase user):', e && e.message ? e.message : e);
        }
      }
      try { console.timeEnd('[auth-timing] backend-verify'); } catch (e) {}

      if (backendUser) {
        // Prefer the canonical DB user id returned by the server.
        const canonicalId = backendUser && backendUser.id ? backendUser.id : (backendUser && backendUser.user_id ? backendUser.user_id : null);
        const effectiveId = canonicalId || user.uid;

        const roleLowerFromBackend = String((backendUser && backendUser.role) || '').toLowerCase().trim();
        const acctLowerFromBackend = String((backendUser && (backendUser.account_type || backendUser.accountType)) || '').toLowerCase().trim();

        // Source of truth: role, when present.
        const hasRoleFromBackend = !!roleLowerFromBackend;
        const roleSaysProfessional = roleLowerFromBackend === 'professional' || roleLowerFromBackend === 'profissional';
        const acctSaysProfessional = acctLowerFromBackend === 'professional' || acctLowerFromBackend === 'profissional';
        const isProfessionalFromBackend = hasRoleFromBackend ? roleSaysProfessional : acctSaysProfessional;
        const canonicalAccountType = isProfessionalFromBackend ? 'professional' : 'user';
        const updatedUser = {
          ...backendUser,
          id: effectiveId,
          auth_id: user.uid,
          // Prefer backend email if present, otherwise Firebase
          email: backendUser.email || user.email,
          // Prefer DB name over Google displayName
          nome: (backendUser.nome || backendUser.name || nomeFromToken || ''),
          name: (backendUser.name || backendUser.nome || nomeFromToken || ''),
          access_token: idToken,
          legacy_token: backendLegacyToken || null,
          // Prefer DB photo if present; otherwise use provider
          photoURL: backendUser.photoURL || backendUser.photo_url || user.photoURL || null,
          phone: backendUser.phone || backendUser.telefone || backendUser.celular || null,
          telefone: backendUser.telefone || backendUser.phone || backendUser.celular || null,
          celular: backendUser.celular || backendUser.phone || backendUser.telefone || null,
          isPro: Boolean(backendUser.is_pro || backendUser.isPro),
          role: backendUser.role || null,
          // Normalize accountType so it cannot contradict role.
          accountType: canonicalAccountType,
          // Only keep professional profile when backend confirms professional role/account type.
          professional: isProfessionalFromBackend ? (backendUser.professional || null) : null,
        };

        if (setUsuarioLogado) setUsuarioLogado(updatedUser);
        try { localStorage.setItem('usuario-logado', JSON.stringify(updatedUser)); } catch (e) {}

        // Redirect professionals to the proper flow
        try {
          const roleLower = String(updatedUser.role || '').toLowerCase();
          const acctLower = String((updatedUser.accountType || updatedUser.account_type || '') || '').toLowerCase();
          const isProfessional = roleLower === 'professional' || acctLower === 'professional' || acctLower === 'profissional';
          if (isProfessional) {
            navigate('/historico-manutencao', { replace: true });
            return;
          }
        } catch (e) { /* ignore */ }

        navigate('/buscar-pecas', { replace: true });
        setTimeout(() => {
          if (window.showToast) window.showToast(`Bem-vindo(a), ${updatedUser.nome || updatedUser.name || 'Usuário'}!`, 'success', 3000);
        }, 100);
        return;
      }
      
      // Create initial user object with Firebase data
      // Backend will update this asynchronously with additional fields (phone, etc)
      const normalizedUsuario = {
        id: user.uid,
        auth_id: user.uid,
        email: user.email,
        nome: nomeFromToken,
        name: nomeFromToken,
        access_token: idToken,
        photoURL: user.photoURL || null,
        // These will be populated by backend response
        phone: null,
        telefone: null,
        celular: null,
        isPro: false, // Will be updated from backend if user is Pro
        role: null,
        accountType: null,
        professional: null
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

      // Update context and localStorage SYNCHRONOUSLY before navigate
      if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario);
      try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
      
      try { console.timeEnd('[auth-timing] processFirebaseUser total'); } catch (e) {}
      
      // Navigate immediately - toast will show after navigation
      navigate('/buscar-pecas', { replace: true });
      
      // Show toast after navigation (non-blocking)
      setTimeout(() => {
        if (window.showToast) window.showToast(`Bem-vindo(a), ${normalizedUsuario.nome || 'Usuário'}!`, 'success', 3000);
      }, 100);
    } catch (e) {
      // swallow errors but keep processed flag
      console.warn('processFirebaseUser failed', e && e.message ? e.message : e);
    }
  }

  // Ensure we can obtain a fresh ID token from a Firebase user with retries
  async function ensureIdToken(userObj, maxRetries = 6, delayMs = 500) {
    if (!userObj || typeof userObj.getIdToken !== 'function') return null;
    try {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const t = await userObj.getIdToken();
          if (t) return t;
        } catch (e) {
          // ignore and retry
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, delayMs));
      }
      // final attempt forcing refresh
      try {
        const t = await userObj.getIdToken(true);
        if (t) return t;
      } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }
    return null;
  }

  // Expose a helper to simulate a Google/Firebase signin for local testing
  try {
    if (typeof window !== 'undefined' && isDev) {
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
    // If we came back from a Google redirect, show a persistent loading indicator
    let hasRedirectFlag = false;
    try {
      const flag = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('__google_redirect_pending');
      hasRedirectFlag = !!flag;
      if (hasRedirectFlag) {
        setRedirectPending(true);
        setGoogleLoading(true);
      }
    } catch (e) { /* ignore localStorage access errors */ }

    // Try to handle redirect result first
    (async () => {
      try {
        console.log('[page-Login] Starting handleRedirectResult check...');
        const firebaseAuthApi = await getFirebaseAuthApi();
        const result = firebaseAuthApi && typeof firebaseAuthApi.handleRedirectResult === 'function'
          ? await firebaseAuthApi.handleRedirectResult()
          : null;
        console.log('[page-Login] handleRedirectResult result:', result);
  // Clear the persisted redirect flag when we get a redirect result (success or error)
  try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('__google_redirect_pending'); } catch (e) {}
  setRedirectPending(false);
  // Ensure the loading indicator is cleared if redirect handling didn't fully finalize login
  try { setGoogleLoading(false); } catch (e) {}
        if (result && result.user) {
          console.log('[page-Login] Processing firebase user from redirect...');
          await processFirebaseUser(result.user, result.credential || null);
        } else if (result && result.error) {
          console.warn('[page-Login] handleRedirectResult returned error', result.error);
        } else {
          console.log('[page-Login] No redirect result (expected on normal page load)');
        }
      } catch (e) {
        // Clear flag on unexpected error to avoid a stuck loading screen
        try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('__google_redirect_pending'); } catch (ee) {}
        setRedirectPending(false);
        try { setGoogleLoading(false); } catch (ee) {}
        console.error('[page-Login] handleRedirectResult threw error:', e && e.message ? e.message : e);
      }
    })();

    // Fallback: listen for auth state changes (some environments signal sign-in via onAuthStateChanged instead)
    // Attach listener asynchronously so we don't force-load Firebase on initial page load.
    let unsubscribe = () => {};
    // IMPORTANT: do not auto-log-in users on a normal /login page visit.
    // We only attach this fallback listener when we *expect* a redirect flow.
    if (hasRedirectFlag) {
      (async () => {
        try {
          const { auth, authMod } = await getFirebaseAuthHelpers();
          if (auth && authMod && typeof authMod.onAuthStateChanged === 'function') {
            unsubscribe = authMod.onAuthStateChanged(auth, async (user) => {
              if (user) {
                try { await processFirebaseUser(user); }
                finally {
                  try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('__google_redirect_pending'); } catch (e) {}
                  setRedirectPending(false);
                  try { setGoogleLoading(false); } catch (e) {}
                }
              }
            });
          } else {
            console.warn('[page-Login] Firebase auth not configured; skipping onAuthStateChanged listener');
          }
        } catch (e) {
          console.warn('[page-Login] failed to attach onAuthStateChanged listener', e && e.message ? e.message : e);
          unsubscribe = () => {};
        }
      })();
    }

    return () => { try { unsubscribe && unsubscribe(); } catch (_) {} };
  }, [setUsuarioLogado, navigate]);

  // Handler to confirm server-side merge (called from confirmation modal)
  async function confirmMerge(overrideIdToken = null) {
    // Normalize and validate the token before sending to server. Avoid sending
    // literal 'undefined' or empty values which cause server-side decode errors.
    let tokenToUse = overrideIdToken || pendingMergeIdToken;
    if (typeof tokenToUse !== 'string') tokenToUse = tokenToUse ? String(tokenToUse) : '';
    tokenToUse = tokenToUse.trim();
    console.debug('confirmMerge invoked', { tokenProvided: !!overrideIdToken, pendingMergeEmail, tokenPresent: !!tokenToUse });
    if (!tokenToUse || tokenToUse === 'undefined') { setMergeError('Token indisponível para fusão.'); return; }
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
      let supabaseNotConfigured = false;
      try {
        const apiBase = window.__API_BASE || '';
        let sawInvalidCredentials = false;

        // 1) Prefer Supabase password login (avoids noisy 401/400 console logs when it succeeds).
        try {
          const { supabase: _supabase, isConfigured: _isSupabaseConfigured } = await getSupabaseClient();
          if (!_supabase || !_isSupabaseConfigured) {
            supabaseNotConfigured = true;
          }
          if (_supabase && _isSupabaseConfigured && _supabase.auth && typeof _supabase.auth.signInWithPassword === 'function') {
            const { data, error } = await _supabase.auth.signInWithPassword({ email: normalizedEmail, password: normalizedSenha });
            if (!error) {
              const session = data && data.session ? data.session : null;
              const accessToken = session && session.access_token ? session.access_token : null;
              if (!accessToken) {
                console.warn('Supabase signIn returned no access token');
                setError('Erro ao efetuar login. Tente novamente.');
                return;
              }

              // Send token to backend for verification/upsert
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
              const roleLower = String(usuario.role || '').toLowerCase().trim();
              const isProfessionalFromRole = (roleLower === 'professional' || roleLower === 'profissional');
              const normalizedUsuario = {
                ...usuario,
                nome: inferredName,
                name: inferredName,
                access_token: accessToken,
                role: usuario.role ? usuario.role : 'user',
                accountType: isProfessionalFromRole ? 'professional' : 'user',
                professional: isProfessionalFromRole ? (usuario.professional || null) : null,
              };

              // Preserve auth_id/providers hints returned by the server
              if (usuario.auth_id && !normalizedUsuario.providers) normalizedUsuario.providers = ['google'];

              setError('');
              if (setUsuarioLogado) setUsuarioLogado(normalizedUsuario);
              try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
              if (window.showToast) window.showToast(`Bem-vindo(a), ${normalizedUsuario.nome || 'Usuário'}!`, 'success', 3000);
              const normalizedRoleLower = String(normalizedUsuario.role || '').toLowerCase().trim();
              if (normalizedRoleLower === 'professional' || normalizedRoleLower === 'profissional') {
                navigate('/historico-manutencao');
              } else {
                navigate('/buscar-pecas');
              }
              return;
            }

            // Invalid credentials or non-Supabase user. Continue to legacy providers.
            sawInvalidCredentials = true;
            console.debug('Supabase auth signIn error (will try legacy providers):', error);
          }
        } catch (e) {
          console.debug('Supabase password login attempt failed (continuing):', e && e.message ? e.message : e);
        }

        // 2) Legacy server-side login (checks Postgres password hash)
        try {
          const respServer = await fetch(`${apiBase}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, senha: normalizedSenha })
          });
          if (respServer.ok) {
            const body = await respServer.json().catch(() => ({}));
            const usuario = (body && body.user) ? body.user : null;
            if (usuario) {
              // preserve any provider hints/auth_id from server
              const uWithProviders = { ...usuario };
              // Accept legacy server session token for subsequent authenticated API calls
              // (used when Supabase password sign-in is blocked by an Auth Hook).
              if (body && body.legacy_token && !uWithProviders.access_token) {
                uWithProviders.access_token = String(body.legacy_token);
              }
              if (!uWithProviders.photoURL && uWithProviders.photo_url) uWithProviders.photoURL = uWithProviders.photo_url;
              if (!uWithProviders.photo_url && uWithProviders.photoURL) uWithProviders.photo_url = uWithProviders.photoURL;
              if (usuario.auth_id && !uWithProviders.providers) uWithProviders.providers = ['google'];

              // Normalize role/accountType
              const roleLower = String(uWithProviders.role || '').toLowerCase();
              if (roleLower === 'companies_admin') {
                uWithProviders.accountType = 'companies_admin';
                uWithProviders.account_type = 'companies_admin';
              }

              setError('');
              if (setUsuarioLogado) setUsuarioLogado(uWithProviders);
              try { localStorage.setItem('usuario-logado', JSON.stringify(uWithProviders)); } catch (e) {}
              if (window.showToast) window.showToast(`Bem-vindo(a), ${usuario.nome || usuario.name || 'Usuário'}!`, 'success', 3000);
              navigate('/buscar-pecas');
              return;
            }
          }
          if (respServer && respServer.status === 401) sawInvalidCredentials = true;
        } catch (e) {
          // server login failed/unreachable — fallthrough
          console.debug('Server-side /api/auth/login failed (continuing):', e && e.message ? e.message : e);
        }

        // 3) Firebase email/password (only after Supabase+legacy server)
        try {
          const { auth, authMod } = await getFirebaseAuthHelpers();
          if (auth && authMod && typeof authMod.signInWithEmailAndPassword === 'function') {
            try {
              const fbRes = await authMod.signInWithEmailAndPassword(auth, normalizedEmail, normalizedSenha);
              const fbUser = fbRes && fbRes.user ? fbRes.user : null;
              if (fbUser) {
                await processFirebaseUser(fbUser);
                return;
              }
            } catch (fbErr) {
              sawInvalidCredentials = true;
              console.debug('Firebase email/password signIn failed (continuing):', fbErr && fbErr.code ? fbErr.code : fbErr && fbErr.message ? fbErr.message : fbErr);
            }
          }
        } catch (e) {
          console.debug('Firebase email/password fallback failed', e && e.message ? e.message : e);
        }

      } catch (err) {
        const msg = err && err.message ? String(err.message) : '';
        console.warn('Login flow failed, falling back to local users', msg);
      }

      // Fallback to existing local lookup
      const usuario = getUsuarios().find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail && String(u.senha || '') === normalizedSenha);
      if (!usuario) {
        if (supabaseNotConfigured) {
          setError('Login não configurado neste domínio. Configure SUPABASE_URL e SUPABASE_ANON_KEY no Render (Runtime Config).');
          return;
        }
        setError('E-mail ou senha incorretos.');
        return;
      }
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
        const { auth, authMod } = await getFirebaseAuthHelpers();
        if (!auth || !authMod) {
          setLinkError('Firebase não configurado neste ambiente. Use a opção de Unir contas no sistema ou contate o suporte.');
          return;
        }
        const methods = (typeof authMod.fetchSignInMethodsForEmail === 'function') ? await authMod.fetchSignInMethodsForEmail(auth, currentEmail) : [];
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
        const { auth, authMod } = await getFirebaseAuthHelpers();
        const signInRes = (authMod && typeof authMod.signInWithEmailAndPassword === 'function') ? await authMod.signInWithEmailAndPassword(auth, currentEmail, linkPassword) : null;
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
        const { authMod } = await getFirebaseAuthHelpers();
        if (authMod && typeof authMod.linkWithCredential === 'function') {
          await authMod.linkWithCredential(existingUser, linkingCredential);
        } else {
          throw new Error('Firebase auth.linkWithCredential not available');
        }
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
      try {
        // After successful link in the Firebase client, also inform the backend so it can set users.auth_id
        // Obtain a fresh ID token for the now-linked Firebase user
        let idTokenForBackend = null;
        try {
          if (auth && auth.currentUser && typeof auth.currentUser.getIdToken === 'function') {
            idTokenForBackend = await auth.currentUser.getIdToken();
          }
        } catch (e) {
          console.warn('Could not obtain idToken to call backend link-account', e);
        }
        if (idTokenForBackend) {
          try {
            // DEBUG: small, safe log to verify this code path runs and whether an idToken is present.
            // We intentionally don't log the full token; just a short preview.
            try { console.info('DEBUG: calling backend /api/auth/link-account', { email: currentEmail, haveIdToken: !!idTokenForBackend, idTokenPreview: (typeof idTokenForBackend === 'string' ? idTokenForBackend.slice(0,8) + '...' : null), apiBase: (window.__API_BASE || '') }); } catch(e) {}
            const apiBase = window.__API_BASE || '';
            const resp = await fetch(`${apiBase}/api/auth/link-account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idTokenForBackend}` },
              body: JSON.stringify({ email: currentEmail, senha: linkPassword })
            });
            if (resp.ok) {
              try { const j = await resp.json().catch(() => ({})); if (j && j.success) console.debug('Backend link-account succeeded', j); }
              catch(e){}
            } else {
              // show a user-facing error if linking on server failed (but continue with client flow)
              try { const body = await resp.json().catch(() => ({})); setLinkError(body && body.error ? String(body.error) : `Falha ao ligar contas: ${resp.status}`); } catch(e){}
            }
          } catch (e) {
            console.warn('Calling backend /api/auth/link-account failed', e);
          }
        }

        // finalize client sign-in flow
        await processFirebaseUser(existingUser);
      } catch (e) {
        console.warn('Finalizing link flow failed', e);
        await processFirebaseUser(existingUser);
      }
      setShowLinkPrompt(false);
      setLinkPassword('');
      setLinkingCredential(null);
    } catch (e) {
      console.error('confirmLinkAccounts failed', e);
      setLinkError('Erro ao unir contas. Verifique os dados e tente novamente.');
    }
  }

  // Suppress the global error banner while auth/merge/link flows are in progress
  const suppressGlobalError = !!(showLinkPrompt || showMergeConfirm || mergeLoading || googleLoading || pendingMergeIdToken);

  // Simple overlay shown while a Google redirect login is pending or popup flow is active
  const showLoginOverlay = !!(googleLoading || redirectPending);

return (
    <>
      <MenuLogin />
      <div className="login-main relative">
        {/* Lado esquerdo: logo, nome, texto */}
        <div className="login-logo-wrapper login-logo-wrapper-loginpage">
          <img src="/images/logo-azul.png" alt="Garagem Smart Logo" className="login-logo" />
          <h1>Garagem Smart</h1>
          <p>Seja um especialista automotivo</p>
        </div>
        <SeparadorCentral />
        {/* Lado direito: formulário de login */}
        <div className="login-content-center login-content-center-loginpage">
          <h2 className="login-section-title login-section-title-loginpage">Entrar</h2>
          <p className="login-section-subtitle login-section-subtitle-loginpage">Acesse sua conta para gerenciar pedidos e recursos</p>
          <form className="login-form" autoComplete="on" onSubmit={handleLogin}>
            {error && (
              <div className="login-error-msg">{error}</div>
            )}
            <label className="field">
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@exemplo.com" autoComplete="username" />
            </label>
            <label className="field">
              <div className="password-field">
                <input className="input password-input" type={showPasswordLogin ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" autoComplete="current-password" />
                <ToggleCar on={showPasswordLogin} onClick={() => setShowPasswordLogin(s => !s)} ariaLabel={showPasswordLogin ? 'Ocultar senha' : 'Mostrar senha'} />
              </div>
            </label>
            <div className="login-forgot-row">
              <Link to="/esqueci-senha" className="forgot-password-link">Esqueci minha senha</Link>
            </div>
            <button className="submit" type="submit" disabled={googleLoading || redirectPending}>Entrar</button>
            <div className="login-social-row">
              <button type="button" className="google-btn google-btn-round flex" aria-label="Entrar com Google" title="Entrar com Google" onClick={handleGoogleLogin} disabled={googleLoading || redirectPending}>
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.9 0 7.1 1.4 9.2 3.2l6.8-6.6C35.6 3 30.1 1 24 1 14.7 1 6.9 6.6 3.1 14.7l7.9 6.1C12.4 15.1 17.7 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.5 24c0-1.6-.1-2.9-.4-4.3H24v8.2h12.9c-.6 3.2-2.9 5.9-6.1 7.4l9.4 7.3C43.9 37.4 46.5 31.1 46.5 24z"/>
                  <path fill="#4A90E2" d="M10 29.8A14.9 14.9 0 0 1 9.1 24c0-1.2.2-2.3.5-3.4L2 14.5A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l7.5-5z"/>
                  <path fill="#FBBC05" d="M24 46c6.1 0 11.6-2 15.7-5.4l-9.4-7.3c-2.5 1.7-5.7 2.8-9 2.8-6.3 0-11.6-4.6-13.6-10.8L2.5 34.8C6.9 41.4 14.7 46 24 46z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                <span className="google-btn-text">{googleLoading || redirectPending ? 'Conectando...' : 'Entrar pelo Gmail'}</span>
              </button>
            </div>
            <div className="login-teste-signup-row">
              <Link to="/cadastro" className="signup-link">Crie sua conta agora!</Link>
            </div>
          </form>
        </div>
      </div>
      {/* Overlay de loading Google/redirect */}
      {showLoginOverlay && (
        <div className="modal-overlay fixed">
          <div className="modal flex-col" role="status" aria-live="polite">
            <div className="modal-spinner" aria-hidden></div>
            <div className="modal-title">Entrando com Google…</div>
            <div className="modal-desc">Aguarde enquanto finalizamos sua autenticação.</div>
          </div>
        </div>
      )}
    </>
  );
}

