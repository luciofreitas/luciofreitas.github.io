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
    try {
      const stored = localStorage.getItem('usuario-logado');
      if (stored) {
        setUsuarioLogado(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse usuario-logado from localStorage', e);
    }
    setAuthLoaded(true);
  }, []);

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
