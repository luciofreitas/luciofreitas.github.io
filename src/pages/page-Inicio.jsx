import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuLogin } from '../components';
import '../styles/pages/page-Inicio.css';
import catalogo1 from '/images/catalogo-1.jpg';

export default function PageInicio() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage] = useState(null);

  return (
    <>
      <MenuLogin />
      <div className="page-wrapper page-inicio">
        <div className="page-content inicio-main">
          {/* Hero Section with Text Left + Carousel Right */}
          <div className="inicio-hero-section">
            <div className="inicio-hero-content">
              <div className="inicio-hero-text">
                <div className="hero-content-top">
                  <h1 className="hero-main-title">
                    Encontre a peça certa<br />
                    para o seu carro, <span className="hero-highlight">sem erro.</span>
                  </h1>
                  <p className="hero-subtitle">
                    Descubra peças compatíveis, de outros modelos,<br />
                    e evite gastar a mais sem necessidade.
                  </p>
                </div>
                <button className="hero-cta-button" onClick={() => navigate('/login')}>
                  Começar agora – é grátis →
                </button>
              </div>
              
              <div className="inicio-hero-carousel">
                <div className="carousel-container">
                  <div className="carousel-image-wrapper">
                    <img 
                      src={catalogo1} 
                      alt="Catálogo de Peças"
                      className="carousel-main-image"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Por que escolher o Garagem Smart */}
          <div className="inicio-benefits-section">
            <h2 className="benefits-title">Por que escolher o Garagem Smart?</h2>
            
            <div className="benefits-grid">
              <div className="benefit-card benefit-card-elevated">
                <div className="benefit-icon benefit-icon-blue">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </div>
                <h3 className="benefit-title">Busca Inteligente e Precisa</h3>
                <p className="benefit-description">
                  Encontre peças automotivas compatíveis de forma rápida e correta.
                </p>
              </div>

              <div className="benefit-card benefit-card-elevated">
                <div className="benefit-icon benefit-icon-orange">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>
                <h3 className="benefit-title">Economia de Tempo e Dinheiro</h3>
                <p className="benefit-description">
                  Compre com confiança, evite devoluções e economize.
                </p>
              </div>

              <div className="benefit-card benefit-card-elevated">
                <div className="benefit-icon benefit-icon-orange">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                  </svg>
                </div>
                <h3 className="benefit-title">Informações Confiáveis</h3>
                <p className="benefit-description">
                  Valores FIPE, recalls e dicas em um só lugar.
                </p>
              </div>

              <div className="benefit-card benefit-card-elevated">
                <div className="benefit-icon benefit-icon-blue">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <h3 className="benefit-title">Organização da Manutenção</h3>
                <p className="benefit-description">
                  Histórico e lembretes de manutenção sempre à mão.
                </p>
              </div>
            </div>

            <button
              className="benefits-cta-button"
              onClick={() => navigate('/nosso-projeto#funcionalidades')}
            >
              Conheça o projeto melhor
            </button>
          </div>

            {/* Seção: Impacto e Credibilidade */}
            <div className="inicio-stats-section">
              <div className="inicio-stats-container">
                <h2 className="inicio-stats-title">Impacto e Credibilidade em Números</h2>
                <p className="inicio-stats-subtitle">
                  Escolha entre o plano gratuito ou o plano Pro para obter ainda mais nuócios.
                </p>
                
                <div className="inicio-stats-grid">
                  <div className="inicio-stat-card">
                    <div className="stat-icon">🔧</div>
                    <div className="stat-number">50.000+</div>
                    <div className="stat-label">Peças Catalogadas</div>
                    <div className="stat-description">Base de dados completa e atualizada</div>
                  </div>

                  <div className="inicio-stat-card">
                    <div className="stat-icon">🚗</div>
                    <div className="stat-number">Mais de 750</div>
                    <div className="stat-label">Modelos de Veículos</div>
                    <div className="stat-description">Compatibilidade verificada e testada</div>
                  </div>

                  <div className="inicio-stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-number">10.000+</div>
                    <div className="stat-label">Usuários Ativos</div>
                    <div className="stat-description">Comunidade crescente de entusiastas</div>
                  </div>

                  <div className="inicio-stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-number">98%</div>
                    <div className="stat-label">Satisfação</div>
                    <div className="stat-description">Avaliação positiva dos usuários</div>
                  </div>
                </div>

                <button className="stats-cta-button" onClick={() => navigate('/buscar-pecas')}>
                  Explore nosso catálogo →
                </button>
              </div>
            </div>

            {/* Seção Seja Pro */}
            <div className="inicio-pro-section">
              <div className="inicio-pro-container">
                <h2 className="inicio-pro-title">Planos que se ajustam às suas necessidades</h2>
                <p className="inicio-pro-subtitle">
                  Escolha entre o plano gratuito ou o plano <strong>Pro</strong> para obter ainda mais mais benefícios.
                </p>
                
                <div className="inicio-pro-cards">
                  {/* Card Básico */}
                  <div className="inicio-pro-card">
                    <div className="pro-card-header">
                      <h3 className="pro-card-title">Básico</h3>
                      <p className="pro-card-price">Grátis</p>
                      <p className="pro-card-period">para sempre</p>
                    </div>
                    <div className="pro-card-body">
                      <ul className="pro-card-features">
                        <li className="feature-enabled">
                          <span className="feature-icon">✓</span>
                          <span>Acesso ao buscador de peças</span>
                        </li>
                        <li className="feature-disabled">
                          <span className="feature-icon">✗</span>
                          <span>Criação de guias automotivos</span>
                        </li>
                        <li className="feature-disabled">
                          <span className="feature-icon">✗</span>
                          <span>Valores da Tabela FIPE</span>
                        </li>
                        <li className="feature-enabled">
                          <span className="feature-icon">✓</span>
                          <span>Suporte via email</span>
                        </li>
                        <li className="feature-disabled">
                          <span className="feature-icon">✗</span>
                          <span>Suporte via WhatsApp</span>
                        </li>
                        <li className="feature-disabled">
                          <span className="feature-icon">✗</span>
                          <span>Comunidade no Discord</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Card Pro - Destacado */}
                  <div className="inicio-pro-card inicio-pro-card-featured">
                    <div className="pro-card-header">
                      <h3 className="pro-card-title">Pro</h3>
                      <p className="pro-card-price">R$ 10,00</p>
                      <p className="pro-card-period">por mês</p>
                    </div>
                    <div className="pro-card-body">
                      <ul className="pro-card-features">
                        <li className="feature-enabled">
                          <span className="feature-icon">✓</span>
                          <span>Acesso ao buscador de peças</span>
                        </li>
                        <li className="feature-enabled">
                          <span className="feature-icon">✓</span>
                          <span>Criação de guias automotivos</span>
                        </li>
                        <li className="feature-enabled">
                          <span className="feature-icon">✓</span>
                          <span>Valores da Tabela FIPE</span>
                        </li>
                        <li className="feature-enabled">
                          <span className="feature-icon">✓</span>
                          <span>Suporte via email</span>
                        </li>
                        <li className="feature-enabled">
                          <span className="feature-icon">✓</span>
                          <span>Suporte via WhatsApp</span>
                        </li>
                        <li className="feature-enabled">
                          <span className="feature-icon">✓</span>
                          <span>Comunidade no Discord</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

        </div>
      </div>
      {/* modal removed: replaced by direct band below carousel; detailed modal was unused after cards → carousel refactor */}
      {zoomImage && (
        <div className="pf-zoom-overlay" onClick={() => setZoomImage(null)}>
          <img className="pf-zoom-image" src={zoomImage} alt="Imagem ampliada" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

