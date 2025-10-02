import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './page-Login';
import PageInicio from './page-Inicio';
import QuemSomos from './page-QuemSomos';
import NossoProjeto from './page-NossoProjeto';
import SejaPro from './page-SejaPro';
import VersaoPro from './page-VersaoPro';
import Checkin from './page-Checkin';
import VersaoPro_Assinado from './page-VersaoPro_Assinado';
import Contato from './page-Contato';
import PageCadastro from './page-Cadastro';
import Parceiros from './page-Parceiros';
import ContatoLogado from './page-ContatoLogado';
import BuscarPeca from './page-BuscarPeca';
import PagePerfil from './page-Perfil';
import PageRecalls from './page-Recalls';
import PageGuias from './page-Guias';
import TabelaFIPE from './page-TabelaFIPE';
import ManutencaoPreventiva from './page-ManutencaoPreventiva';
import PecasOriginaisVsCompativeis from './page-PecasOriginaisVsCompativeis';
import LuzesDoPainel from './page-LuzesDoPainel';
import './App.css';
import './CustomDropdown.css';

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
    <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado, authLoaded, setAuthLoaded }}>
      <HashRouter>
        <div className="app">
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
            {/* Redirecionamento da rota antiga glossario para guias */}
            <Route path="/glossario" element={<Navigate to="/guias" replace />} />
            <Route path="/manutencao-preventiva" element={<ManutencaoPreventiva />} />
            <Route path="/pecas-originais-vs-compativeis" element={<PecasOriginaisVsCompativeis />} />
            <Route path="/luzes-do-painel" element={<LuzesDoPainel />} />
            <Route path="/nosso-projeto" element={<NossoProjeto />} />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <PagePerfil />
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
  );
}
