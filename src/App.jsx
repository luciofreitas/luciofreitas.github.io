import React, { useState, createContext, useContext, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
// Import migration helper to run data migration on app load
import './utils/migrationHelper';
// Import subscription service
import { shouldShowExpiryWarning, getDaysUntilExpiry, markWarningAsShown } from './services/subscriptionService';
import ProExpiryWarning from './components/ProExpiryWarning';
// Critical routes: load immediately (Login, PageInicio)
import Login from './pages/page-Login';
import PageInicio from './pages/page-Inicio';
// Non-critical routes: lazy load to reduce initial bundle size
const QuemSomos = lazy(() => import('./pages/page-QuemSomos'));
const NossoProjeto = lazy(() => import('./pages/page-NossoProjeto'));
const VersaoPro = lazy(() => import('./pages/page-VersaoPro'));
const Checkin = lazy(() => import('./pages/page-Checkin'));
const VersaoPro_Assinado = lazy(() => import('./pages/page-VersaoPro_Assinado'));
const Contato = lazy(() => import('./pages/page-Contato'));
const PageCadastro = lazy(() => import('./pages/page-Cadastro'));
const Parceiros = lazy(() => import('./pages/page-Parceiros'));
const ContatoLogado = lazy(() => import('./pages/page-ContatoLogado'));
const BuscarPeca = lazy(() => import('./pages/page-BuscarPeca'));
const PagePerfil = lazy(() => import('./pages/page-Perfil'));
const PageMeusCarros = lazy(() => import('./pages/page-MeusCarros'));
const PageRecalls = lazy(() => import('./pages/page-Recalls'));
const PageGuias = lazy(() => import('./pages/page-Guias'));
const PageCriarGuia = lazy(() => import('./pages/page-CriarGuia'));
const PageVisualizarGuia = lazy(() => import('./pages/page-VisualizarGuia'));
const PageConfiguracoes = lazy(() => import('./pages/page-Configuracoes'));
const TabelaFIPE = lazy(() => import('./pages/page-TabelaFIPE'));
const ManutencaoPreventiva = lazy(() => import('./pages/page-ManutencaoPreventiva'));
const PecasOriginaisVsCompativeis = lazy(() => import('./pages/page-PecasOriginaisVsCompativeis'));
const LuzesDoPainel = lazy(() => import('./pages/page-LuzesDoPainel'));
const HistoricoManutencao = lazy(() => import('./pages/page-HistoricoManutencao'));
const EsqueciSenha = lazy(() => import('./pages/page-EsqueciSenha'));
const RedefinirSenha = lazy(() => import('./pages/page-RedefinirSenha'));
const MLCallback = lazy(() => import('./pages/page-MLCallback'));
import { ThemeToggle } from './components';
import './styles/App.css';
import './styles/CustomDropdown.css';

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '1.2rem',
      color: '#666'
    }}>
      Carregando...
    </div>
  );
}

export const AuthContext = createContext(null);

function ProtectedRoute({ children }) {
  const { usuarioLogado, authLoaded } = useContext(AuthContext) || {};
  if (!authLoaded) return null;
  if (!usuarioLogado) return <Navigate to="/login" replace />;
  return children;
}

function HomeRedirect() {
  // Always redirect root to the Inicio page so the first page users see is /inicio
  const { authLoaded } = useContext(AuthContext) || {};
  if (!authLoaded) return null;
  return <Navigate to="/inicio" replace />;
}

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  // Track auth initialization phases: storage init and redirect processing.
  const [initDone, setInitDone] = useState(false);
  const [redirectDone, setRedirectDone] = useState(false);
  // authLoaded is true only when both init and redirect handling finished
  // Provide a setter for authLoaded for compatibility with components that
  // previously expected `setAuthLoaded` from the context. Internally we derive
  // the value from initDone && redirectDone but keep a local state so callers
  // can also set it (no-op in practice since derived value wins).
  const [authLoadedState, setAuthLoadedState] = useState(false);
  const authLoaded = authLoadedState || (initDone && redirectDone);

  // Provide a stable setter name `setAuthLoaded` for backward compatibility
  // with any consumers expecting it from the context.
  const setAuthLoaded = setAuthLoadedState;

  // Pro subscription expiry warning
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(null);

  // Mirror derived value into the setter-state so consumers reading the
  // boolean from context see a stable true once both phases complete.
  useEffect(() => {
    if (authLoaded) setAuthLoadedState(true);
  }, [authLoaded]);

  React.useEffect(() => {
    async function initFromStorage(){
      try { console.time('[app-timing] initFromStorage start'); } catch(e){}
      try {
        const storedRaw = localStorage.getItem('usuario-logado') || 'null';
        const stored = JSON.parse(storedRaw);
        if (stored) {
          // Helper: clean dev-style names (devuser+, dev_, etc) and format display names
          function formatDisplayName(raw) {
            if (!raw || typeof raw !== 'string') return '';
            let s = raw.trim();
            s = s.replace(/^(devuser\+|dev_|dev-|testuser\+|teste_)/i, '');
            s = s.replace(/[._+\-]+/g, ' ');
            s = s.replace(/\s+/g, ' ').trim();
            s = s.split(' ').map(part => part ? (part.charAt(0).toUpperCase() + part.slice(1)) : '').join(' ').trim();
            return s || raw;
          }

          // If stored nome looks like a dev/mock name, try to replace it with a cleaned
          // displayName or email-derived name so the UI shows a human name.
          try {
            const rawNome = String(stored.nome || stored.name || '');
            const looksDev = /^(dev_|devuser\+|dev-)/i.test(rawNome) || /devuser\+/i.test(rawNome);
            if (looksDev) {
              const candidate = (stored.displayName || stored.name || stored.nome || stored.email || '').toString();
              const cleaned = formatDisplayName(candidate) || formatDisplayName(stored.email ? stored.email.split('@')[0] : '');
              if (cleaned) {
                stored.nome = cleaned;
                stored.name = cleaned;
              }
            }
          } catch (e) { /* ignore */ }
          // Normalize old key photo_url to photoURL
          if (!stored.photoURL && stored.photo_url) stored.photoURL = stored.photo_url;
          setUsuarioLogado(stored);

          // If we have a token but no photoURL, try to refresh profile from backend
          if (stored.access_token && !stored.photoURL) {
            try {
              const apiBase = window.__API_BASE || '';
              const resp = await fetch(`${apiBase}/api/auth/supabase-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stored.access_token}` },
                body: JSON.stringify({ access_token: stored.access_token })
              });
              if (resp.ok) {
                const body = await resp.json().catch(() => ({}));
                const usuario = (body && body.user) ? body.user : null;
                if (usuario) {
                  // normalize returned fields
                  if (!usuario.photoURL && usuario.photo_url) usuario.photoURL = usuario.photo_url;
                  const refreshed = { ...usuario, access_token: stored.access_token };
                  setUsuarioLogado(refreshed);
                  try { localStorage.setItem('usuario-logado', JSON.stringify(refreshed)); } catch (e) {}
                }
              }
            } catch (e) {
              // ignore refresh errors - keep existing stored user
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse usuario-logado from localStorage', e);
      }
      // mark storage init done; the redirect effect will set redirectDone
      try { console.timeEnd('[app-timing] initFromStorage start'); } catch(e){}
      setInitDone(true);
    }
    initFromStorage();
  }, []);

  

  // Handle Supabase OAuth redirect flow: when Supabase redirects back with
  // session info in the URL, capture the session and verify/upsert on backend.
  React.useEffect(() => {
    (async () => {
      // Check once for tokens in URL - reused in catch blocks
      const href = window.location.href || '';
      const hasTokensInUrl = href.includes('access_token') || href.includes('refresh_token');
      
      try {
        // Lazy import supabase client to avoid circular deps in modules
        const { default: supabase } = await import('./supabase');
        
        // Quick check: only start timing if there might be something to process
        if (hasTokensInUrl) {
          try { console.time('[app-timing] redirect-processing start'); } catch(e){}
          console.log('[auth-debug] starting redirect processing. href=', href);
        }
        
        // Supabase v2 provides getSessionFromUrl to read the session after redirect
  if (supabase && typeof supabase.auth.getSessionFromUrl === 'function') {
          // First try the standard helper which reads the session from the URL
          console.log('[auth-debug] calling supabase.auth.getSessionFromUrl()');
          const { data, error } = await supabase.auth.getSessionFromUrl();
          if (error) {
            console.warn('[auth-debug] supabase getSessionFromUrl error:', error);
          }
          let session = data && data.session ? data.session : null;

          // Fallback: sometimes GitHub Pages or the provider place tokens in the pathname
          // (e.g. https://.../access_token=...) which getSessionFromUrl may not detect.
          // Try to parse access_token and refresh_token anywhere in the URL as a fallback
          // and set the session programmatically.
          if (!session) {
            try {
              const href = window.location.href || '';
              console.log('[auth-debug] getSessionFromUrl returned no session, attempting token parse from href', href);
              const find = (name) => {
                const re = new RegExp(name + "=([^&#\\/]+)", 'i');
                const m = href.match(re);
                return m ? decodeURIComponent(m[1]) : null;
              };
              const at = find('access_token');
              const rt = find('refresh_token');
              if (at) {
                console.log('[auth-debug] found tokens in URL fallback, access_token length=', at ? at.length : 0, ' refresh_token=', rt ? rt.length : 0);
                try {
                  // Try to set the session so supabase client behaves as if it handled the redirect
                  if (supabase && supabase.auth && typeof supabase.auth.setSession === 'function') {
                    await supabase.auth.setSession({ access_token: at, refresh_token: rt || undefined });
                    // build a lightweight session-like object
                    session = { access_token: at, refresh_token: rt };
                    // Clean URL to remove tokens
                    try { window.history.replaceState({}, document.title, window.location.origin + '/#/'); } catch (e) {}
                  }
                } catch (e) {
                  console.warn('[auth-debug] Failed to set supabase session from URL fallback', e && e.message ? e.message : e);
                }
              }
            } catch (e) { /* ignore parsing errors */ }
          }

          if (session && session.access_token) {
            const accessToken = session.access_token;
            // Call backend verify endpoint to upsert user and get canonical profile
            const apiBase = window.__API_BASE || '';
            try {
              console.log('[auth-debug] calling backend supabase-verify', `${apiBase}/api/auth/supabase-verify`);
              const resp = await fetch(`${apiBase}/api/auth/supabase-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ access_token: accessToken })
              });
              console.log('[auth-debug] supabase-verify response status=', resp.status);
              let body = null;
              try { body = await resp.json().catch(() => ({})); } catch(e){ body = null; }
              console.log('[auth-debug] supabase-verify response body=', body);
              if (resp.ok) {
                const usuario = (body && body.user) ? body.user : null;
                if (usuario) {
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
                  console.log('[auth-debug] backend returned user, setting usuarioLogado', normalizedUsuario.email);
                  setUsuarioLogado(normalizedUsuario);
                  try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
                }
              } else {
                console.warn('[auth-debug] backend supabase-verify returned non-ok', resp.status, body);
                // Aggressive fallback: try to get user from supabase client or from session
                try {
                  if (supabase && supabase.auth) {
                    try {
                      console.log('[auth-debug] attempting supabase.auth.getUser() fallback');
                      const userRes = await supabase.auth.getUser();
                      const sbUser = userRes && userRes.data && userRes.data.user ? userRes.data.user : null;
                      if (sbUser) {
                        const inferredName = (sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : (sbUser.email || '').split('@')[0]) || '';
                        const normalizedUsuario = { ...sbUser, nome: inferredName, name: inferredName, access_token: accessToken };
                        console.log('[auth-debug] got user from supabase.getUser(), setting usuarioLogado', normalizedUsuario.email);
                        setUsuarioLogado(normalizedUsuario);
                        try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
                      } else {
                        console.log('[auth-debug] supabase.auth.getUser() returned no user, trying getSession()');
                        const sess = await supabase.auth.getSession();
                        const sessUser = sess && sess.data && sess.data.session && sess.data.session.user ? sess.data.session.user : null;
                        if (sessUser) {
                          const inferredName = (sessUser.user_metadata && (sessUser.user_metadata.nome || sessUser.user_metadata.name) ? (sessUser.user_metadata.nome || sessUser.user_metadata.name) : (sessUser.email || '').split('@')[0]) || '';
                          const normalizedUsuario = { ...sessUser, nome: inferredName, name: inferredName, access_token: accessToken };
                          console.log('[auth-debug] got user from supabase.getSession(), setting usuarioLogado', normalizedUsuario.email);
                          setUsuarioLogado(normalizedUsuario);
                          try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
                        } else {
                          console.warn('[auth-debug] supabase client did not return user/session on fallback');
                        }
                      }
                    } catch (e) {
                      console.warn('[auth-debug] supabase.getUser/getSession fallback failed', e && e.message ? e.message : e);
                    }
                  }
                } catch (e) {
                  console.warn('[auth-debug] Fallback supabase user fetch failed', e && e.message ? e.message : e);
                }
              }
            } catch (e) {
              console.warn('[auth-debug] Failed to call backend supabase-verify', e && e.message ? e.message : e);
              // If backend call throws, attempt same aggressive supabase fallback
              try {
                if (supabase && supabase.auth) {
                  console.log('[auth-debug] backend verify threw; attempting supabase.getUser/getSession fallback');
                  const userRes = await supabase.auth.getUser();
                  const sbUser = userRes && userRes.data && userRes.data.user ? userRes.data.user : null;
                  if (sbUser) {
                    const inferredName = (sbUser.user_metadata && (sbUser.user_metadata.nome || sbUser.user_metadata.name) ? (sbUser.user_metadata.nome || sbUser.user_metadata.name) : (sbUser.email || '').split('@')[0]) || '';
                    const normalizedUsuario = { ...sbUser, nome: inferredName, name: inferredName, access_token: accessToken };
                    console.log('[auth-debug] got user from supabase.getUser() after exception, setting usuarioLogado', normalizedUsuario.email);
                    setUsuarioLogado(normalizedUsuario);
                    try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
                  } else {
                    const sess = await supabase.auth.getSession();
                    const sessUser = sess && sess.data && sess.data.session && sess.data.session.user ? sess.data.session.user : null;
                    if (sessUser) {
                      const inferredName = (sessUser.user_metadata && (sessUser.user_metadata.nome || sessUser.user_metadata.name) ? (sessUser.user_metadata.nome || sessUser.user_metadata.name) : (sessUser.email || '').split('@')[0]) || '';
                      const normalizedUsuario = { ...sessUser, nome: inferredName, name: inferredName, access_token: accessToken };
                      console.log('[auth-debug] got user from supabase.getSession() after exception, setting usuarioLogado', normalizedUsuario.email);
                      setUsuarioLogado(normalizedUsuario);
                      try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
                    }
                  }
                }
              } catch (e2) {
                console.warn('[auth-debug] aggressive fallback after backend error also failed', e2 && e2.message ? e2.message : e2);
              }
            }
          }
        }
        // mark redirect processing done regardless of outcome so app can continue
        if (hasTokensInUrl) {
          console.log('[auth-debug] redirect processing finished, setting redirectDone');
          try { console.timeEnd('[app-timing] redirect-processing start'); } catch(e){}
        }
        setRedirectDone(true);
      } catch (e) {
        // ignore - allows app to work even if supabase client unavailable
        console.warn('[auth-debug] redirect processing outer catch', e && e.message ? e.message : e);
        if (hasTokensInUrl) {
          try { console.timeEnd('[app-timing] redirect-processing start'); } catch(e){}
        }
        setRedirectDone(true);
      }
    })();
  }, [setUsuarioLogado]);

  // Check Pro subscription expiry and show warning
  useEffect(() => {
    if (!usuarioLogado || !authLoaded) return;

    const userId = usuarioLogado.id || usuarioLogado.email;
    if (!userId) return;

    // Check if should show expiry warning (1 day before expiration)
    if (shouldShowExpiryWarning(userId)) {
      const days = getDaysUntilExpiry(userId);
      setDaysUntilExpiry(days);
      setShowExpiryWarning(true);
    }
  }, [usuarioLogado, authLoaded]);

  const handleCloseExpiryWarning = () => {
    setShowExpiryWarning(false);
    if (usuarioLogado) {
      const userId = usuarioLogado.id || usuarioLogado.email;
      markWarningAsShown(userId);
    }
  };

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado, authLoaded, setAuthLoaded }}>
        <HashRouter>
          <div className="app">
            <ThemeToggle />
            
            {/* Pro Expiry Warning Popup */}
            {showExpiryWarning && (
              <ProExpiryWarning 
                daysLeft={daysUntilExpiry}
                onClose={handleCloseExpiryWarning}
              />
            )}
            
            <Suspense fallback={<PageLoader />}>
              <Routes>
            {/* Rota raiz redireciona para catálogo se logado, ou página inicial se não logado */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Catálogo público - permite acesso sem login com funcionalidades limitadas */}
            <Route path="/buscar-pecas" element={<BuscarPeca />} />

            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<PageCadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/inicio" element={<PageInicio />} />
            <Route path="/quem-somos" element={<QuemSomos />} />
            <Route path="/versao-pro" element={<VersaoPro />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="/versao-pro-assinado" element={<VersaoPro_Assinado />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/contato-logado" element={<ContatoLogado />} />
            <Route path="/parceiros" element={<Parceiros />} />
            <Route path="/recalls" element={<PageRecalls />} />
            <Route path="/guias" element={<PageGuias />} />
            {/* Explicit routes for fixed guides so they render their dedicated pages */}
            <Route path="/guias/luzes-do-painel" element={<LuzesDoPainel />} />
            <Route path="/guias/manutencao-preventiva" element={<ManutencaoPreventiva />} />
            <Route path="/guias/pecas-originais-vs-compativeis" element={<PecasOriginaisVsCompativeis />} />
            {/* Route to view a specific guia using the `/guias/<slug>` path for compatibility */}
            <Route path="/guias/:guiaId" element={<PageVisualizarGuia />} />
            {/* Rota para visualizar guia específico */}
            <Route path="/guia/:guiaId" element={<PageVisualizarGuia />} />
            {/* Redirecionamento da rota antiga glossario para guias */}
            <Route path="/glossario" element={<Navigate to="/guias" replace />} />
            {/* Rotas para criar/editar guias (Pro apenas) */}
            <Route path="/criar-guia" element={
              <ProtectedRoute>
                <PageCriarGuia />
              </ProtectedRoute>
            } />
            <Route path="/criar-guia/:guiaId" element={
              <ProtectedRoute>
                <PageCriarGuia />
              </ProtectedRoute>
            } />
            <Route path="/manutencao-preventiva" element={<ManutencaoPreventiva />} />
            <Route path="/pecas-originais-vs-compativeis" element={<PecasOriginaisVsCompativeis />} />
            <Route path="/luzes-do-painel" element={<LuzesDoPainel />} />
            <Route path="/historico-manutencao" element={
              <ProtectedRoute>
                <HistoricoManutencao />
              </ProtectedRoute>
            } />
            <Route path="/nosso-projeto" element={<NossoProjeto />} />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <PagePerfil />
              </ProtectedRoute>
            } />
            <Route path="/meus-carros" element={
              <ProtectedRoute>
                <PageMeusCarros />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <PageConfiguracoes />
              </ProtectedRoute>
            } />
            <Route path="/ml/callback" element={<MLCallback />} />
            <Route path="/tabela-fipe" element={
              <ProtectedRoute>
                <TabelaFIPE />
              </ProtectedRoute>
            } />
            {/* Redirecionamento da rota antiga para a nova */}
            <Route path="/perfil-teste" element={<Navigate to="/perfil" replace />} />
              </Routes>
            </Suspense>
          </div>
        </HashRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
