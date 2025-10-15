import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/page-Login';
import PageInicio from './pages/page-Inicio';
import QuemSomos from './pages/page-QuemSomos';
import NossoProjeto from './pages/page-NossoProjeto';
import SejaPro from './pages/page-SejaPro';
import VersaoPro from './pages/page-VersaoPro';
import Checkin from './pages/page-Checkin';
import VersaoPro_Assinado from './pages/page-VersaoPro_Assinado';
import Contato from './pages/page-Contato';
import PageCadastro from './pages/page-Cadastro';
import Parceiros from './pages/page-Parceiros';
import ContatoLogado from './pages/page-ContatoLogado';
import BuscarPeca from './pages/page-BuscarPeca';
import PagePerfil from './pages/page-Perfil';
import PageMeusCarros from './pages/page-MeusCarros';
import PageRecalls from './pages/page-Recalls';
import PageGuias from './pages/page-Guias';
import PageCriarGuia from './pages/page-CriarGuia';
import PageVisualizarGuia from './pages/page-VisualizarGuia';
import PageConfiguracoes from './pages/page-Configuracoes';
import TabelaFIPE from './pages/page-TabelaFIPE';
import ManutencaoPreventiva from './pages/page-ManutencaoPreventiva';
import PecasOriginaisVsCompativeis from './pages/page-PecasOriginaisVsCompativeis';
import LuzesDoPainel from './pages/page-LuzesDoPainel';
import ThemeToggle from './components/ThemeToggle';
import './styles/App.css';
import './styles/CustomDropdown.css';

export const AuthContext = createContext(null);

function ProtectedRoute({ children }) {
  const { usuarioLogado, authLoaded } = useContext(AuthContext) || {};
  if (!authLoaded) return null;
  if (!usuarioLogado) return <Navigate to="/login" replace />;
  return children;
}

function HomeRedirect() {
  const { usuarioLogado, authLoaded } = useContext(AuthContext) || {};
  if (!authLoaded) return null;
  return <Navigate to={usuarioLogado ? "/buscar-pecas" : "/inicio"} replace />;
}

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  React.useEffect(() => {
    async function initFromStorage(){
      try {
        const storedRaw = localStorage.getItem('usuario-logado') || 'null';
        const stored = JSON.parse(storedRaw);
        if (stored) {
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
      setAuthLoaded(true);
    }
    initFromStorage();
  }, []);

  // Handle Supabase OAuth redirect flow: when Supabase redirects back with
  // session info in the URL, capture the session and verify/upsert on backend.
  React.useEffect(() => {
    (async () => {
      try {
        // Lazy import supabase client to avoid circular deps in modules
        const { default: supabase } = await import('./supabase');
        // Supabase v2 provides getSessionFromUrl to read the session after redirect
        if (supabase && typeof supabase.auth.getSessionFromUrl === 'function') {
          const { data, error } = await supabase.auth.getSessionFromUrl();
          if (error) {
            console.warn('supabase getSessionFromUrl error:', error);
            return;
          }
          const session = data && data.session ? data.session : null;
          if (session && session.access_token) {
            const accessToken = session.access_token;
            // Call backend verify endpoint to upsert user and get canonical profile
            const apiBase = window.__API_BASE || '';
            try {
              const resp = await fetch(`${apiBase}/api/auth/supabase-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ access_token: accessToken })
              });
              if (resp.ok) {
                const body = await resp.json().catch(() => ({}));
                const usuario = (body && body.user) ? body.user : null;
                if (usuario) {
                  function displayNameFromEmail(email){
                    if(!email || typeof email !== 'string') return '';
                    const local = email.split('@')[0] || '';
                    // replace dots/underscores/dashes with spaces and capitalize words
                    return local.replace(/[._-]+/g,' ').split(' ').map(s => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '').join(' ').trim();
                  }

                  const inferredName = (usuario.nome || usuario.name || '').trim() || displayNameFromEmail(usuario.email || usuario.email_address || usuario.mail);
                  const normalizedUsuario = {
                      ...usuario,
                      nome: inferredName,
                      name: inferredName,
                      access_token: accessToken
                    };
                  setUsuarioLogado(normalizedUsuario);
                  try { localStorage.setItem('usuario-logado', JSON.stringify(normalizedUsuario)); } catch (e) {}
                }
              } else {
                console.warn('Backend supabase-verify returned', resp.status);
              }
            } catch (e) {
              console.warn('Failed to call backend supabase-verify', e);
            }
          }
        }
      } catch (e) {
        // ignore - allows app to work even if supabase client unavailable
      }
    })();
  }, [setUsuarioLogado]);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado, authLoaded, setAuthLoaded }}>
        <HashRouter>
          <div className="app">
            <ThemeToggle />
            <Routes>
            {/* Rota raiz redireciona para catálogo se logado, ou página inicial se não logado */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Catálogo público - permite acesso sem login com funcionalidades limitadas */}
            <Route path="/buscar-pecas" element={<BuscarPeca />} />

            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<PageCadastro />} />
            <Route path="/inicio" element={<PageInicio />} />
            <Route path="/quem-somos" element={<QuemSomos />} />
            <Route path="/seja-pro" element={<SejaPro />} />
            <Route path="/versao-pro" element={<VersaoPro />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="/versao-pro-assinado" element={<VersaoPro_Assinado />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/contato-logado" element={<ContatoLogado />} />
            <Route path="/parceiros" element={<Parceiros />} />
            <Route path="/recalls" element={<PageRecalls />} />
            <Route path="/guias" element={<PageGuias />} />
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
            <Route path="/tabela-fipe" element={
              <ProtectedRoute>
                <TabelaFIPE />
              </ProtectedRoute>
            } />
            {/* Redirecionamento da rota antiga para a nova */}
            <Route path="/perfil-teste" element={<Navigate to="/perfil" replace />} />
          </Routes>
          </div>
        </HashRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
