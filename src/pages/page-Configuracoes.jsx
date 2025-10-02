import React from 'react';
import { useNavigate } from 'react-router-dom';
import MenuLogin from '../components/MenuLogin';
import { useTheme } from '../context/ThemeContext';
import '../styles/pages/page-Configuracoes.css';

export default function PageConfiguracoes() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

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
              <p className="config-subtitle">Personalize sua experiência no Peça Fácil</p>
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
