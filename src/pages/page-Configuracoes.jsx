import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MenuLogin } from '../components';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../App';
import * as mlService from '../services/mlService';
import '../styles/pages/page-Configuracoes.css';

export default function PageConfiguracoes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const { usuarioLogado: user } = useContext(AuthContext) || {};
  const [mlStatus, setMlStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check ML connection status on mount
    const status = mlService.getConnectionStatus();
    setMlStatus(status);

    // Check for success parameter in URL
    const params = new URLSearchParams(location.search);
    if (params.get('ml_success') === 'true') {
      setShowSuccess(true);
      // Update connection status
      setMlStatus(mlService.getConnectionStatus());
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
      // Clean URL
      navigate('/configuracoes', { replace: true });
    }
  }, [location, navigate]);

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
        await mlService.disconnect();
        setMlStatus(mlService.getConnectionStatus());
        alert('Conta do Mercado Livre desconectada com sucesso!');
      }
    } catch (error) {
      console.error('Error disconnecting from ML:', error);
      alert('Erro ao desconectar. Tente novamente.');
    }
  };

  return (
    <>
      <MenuLogin />
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
              {/* Seção de Aparência */}
              <section className="config-section">
                <div className="config-section-header">
                  <div className="config-section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  </div>
                  <div className="config-section-info">
                    <h2 className="config-section-title">Aparência</h2>
                    <p className="config-section-description">Escolha o tema que melhor se adapta ao seu estilo</p>
                  </div>
                </div>

                <div className="config-option">
                  <div className="config-option-content">
                    <label htmlFor="theme-toggle" className="config-option-label">
                      <span className="config-option-title">Modo Escuro</span>
                      <span className="config-option-description">
                        {isDark ? 'Ativado - Interface com cores escuras' : 'Desativado - Interface com cores claras'}
                      </span>
                    </label>
                  </div>
                  
                  <div className="theme-toggle-wrapper">
                    <input
                      type="checkbox"
                      id="theme-toggle"
                      className="theme-toggle-input"
                      checked={isDark}
                      onChange={toggleTheme}
                      aria-label="Alternar modo escuro"
                    />
                    <label htmlFor="theme-toggle" className="theme-toggle-label">
                      <span className="theme-toggle-button">
                        <span className="theme-toggle-icon">
                          {isDark ? (
                            // Ícone de lua (modo escuro ativo)
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                            </svg>
                          ) : (
                            // Ícone de sol (modo claro ativo)
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
                            </svg>
                          )}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Preview dos temas */}
                <div className="theme-preview">
                  <div className={`theme-preview-card ${!isDark ? 'active' : ''}`}>
                    <div className="theme-preview-header light">
                      <div className="theme-preview-dot"></div>
                      <div className="theme-preview-dot"></div>
                      <div className="theme-preview-dot"></div>
                    </div>
                    <div className="theme-preview-body light">
                      <div className="theme-preview-line light"></div>
                      <div className="theme-preview-line light short"></div>
                    </div>
                    <span className="theme-preview-label">Claro</span>
                  </div>

                  <div className={`theme-preview-card ${isDark ? 'active' : ''}`}>
                    <div className="theme-preview-header dark">
                      <div className="theme-preview-dot"></div>
                      <div className="theme-preview-dot"></div>
                      <div className="theme-preview-dot"></div>
                    </div>
                    <div className="theme-preview-body dark">
                      <div className="theme-preview-line dark"></div>
                      <div className="theme-preview-line dark short"></div>
                    </div>
                    <span className="theme-preview-label">Escuro</span>
                  </div>
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
