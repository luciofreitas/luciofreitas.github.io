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
import Parceiros from './page-Parceiros';
import ContatoLogado from './page-ContatoLogado';
import BuscarPeca from './page-BuscarPeca';
import PagePerfil from './page-Perfil';
import PageRecalls from './page-Recalls';
import PageGuias from './page-Guias';
import './App.css';
import './CustomDropdown.css';

export const AuthContext = createContext(null);

function ProtectedRoute({ children }) {
  const { usuarioLogado, authLoaded } = useContext(AuthContext) || {};
  if (!authLoaded) return null;
  if (!usuarioLogado) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('usuarioLogado');
      if (stored) {
        setUsuarioLogado(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse usuarioLogado from localStorage', e);
    }
    setAuthLoaded(true);
  }, []);

  return (
    <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado, authLoaded, setAuthLoaded }}>
      <HashRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <BuscarPeca />
              </ProtectedRoute>
            } />
            <Route path="/buscar-pecas" element={
              <ProtectedRoute>
                <BuscarPeca />
              </ProtectedRoute>
            } />

            <Route path="/login" element={<Login />} />
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
            <Route path="/nosso-projeto" element={<NossoProjeto />} />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <PagePerfil />
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
