import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuLogin from './components/MenuLogin';
import './page-Inicio.css';
import catalogo1 from '../imagens pagina Inicial/catalogo-1.jpg';
import catalogo2 from '../imagens pagina Inicial/catalogo-2.jpg';
import recall1 from '../imagens pagina Inicial/recall-1.jpg';
import recall2 from '../imagens pagina Inicial/recall-2.jpg';
import guias1 from '../imagens pagina Inicial/guias-1.jpg';
import guias2 from '../imagens pagina Inicial/guias-2.jpg';

export default function PageInicio() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage] = useState(null);

  // --- Carousel using local imported images
  const images = [catalogo1, catalogo2, recall1, recall2, guias1, guias2];
  const [carouselIndex, setCarouselIndex] = useState(0);
  const trackRef = useRef(null);

  const prevSlide = () => setCarouselIndex(i => (i - 1 + images.length) % images.length);
  const nextSlide = () => setCarouselIndex(i => (i + 1) % images.length);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <MenuLogin />
      <div className="page-wrapper page-inicio">
        <div className="page-content inicio-main">
          <div className="inicio-hero">
            <div className="inicio-hero-inner">
              <h1 className="page-title">Seja um entendedor automotivo, agora mesmo!</h1>
              <div className="inicio-intro">
                <p className="inicio-subtitle">
                  No PeçaFácil você conseguirá se virar sozinho, aprenderá a identificar e comprar as peças certas para o
                  seu carro com confiança e economia, aprenderá sobre manutenção preventiva, instalação de peças e muito mais.
                </p>
              </div>
            </div>
          </div>

      <div className="inicio-carousel" aria-roledescription="carousel">
        <button className="carousel-control prev" aria-label="Anterior" onClick={prevSlide}>❮</button>
              <div className="carousel-track" ref={trackRef}>
                {(() => {
                  const n = images.length;
                  const prevIdx = (carouselIndex - 1 + n) % n;
                  const nextIdx = (carouselIndex + 1) % n;
                  const visible = [prevIdx, carouselIndex, nextIdx];
                  return visible.map((idx, pos) => {
                    const src = images[idx];
                    const isCenter = pos === 1;
                    const cls = isCenter ? 'carousel-item is-center' : 'carousel-item is-thumb';
                    return (
                      <div
                        key={idx}
                        className={cls}
                        onClick={() => { if (!isCenter) setCarouselIndex(idx); else setZoomImage(src); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') { if (!isCenter) setCarouselIndex(idx); else setZoomImage(src); } }}
                      >
                        <img src={src} alt={`Slide ${idx + 1}`} />
                        {isCenter && (
                          <span className="carousel-zoom-icon" aria-hidden="true" title="Ver imagem ampliada">🔍</span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              <button className="carousel-control next" aria-label="Próximo" onClick={nextSlide}>❯</button>
            </div>
            {/* FullWidth blue band under the carousel to match menu color */}
            <div className="inicio-band">
              <div className="inicio-band-inner">
                <div className="inicio-band-left">
                  <h1 className="inicio-band-title">10 motivos para que você escolha o Peça Fácil</h1>
                </div>
                <div className="inicio-band-right">
                  <div className="inicio-reasons">
                    <div className="reasons-grid">
                      <ol className="reasons-col">
                        <li><span className="reason-number">1</span>Conexão Simplificada com Oficinas.</li>
                        <li><span className="reason-number">2</span>Busca Inteligente de Peças.</li>
                        <li><span className="reason-number">3</span>Especificação Completa das Peças.</li>
                        <li><span className="reason-number">4</span>Informações Essenciais sobre Recalls.</li>
                        <li><span className="reason-number">5</span>Guias Automotivos Abrangentes.</li>
                      </ol>
                      <ol className="reasons-col">
                        <li><span className="reason-number">6</span>Economia de Tempo e Esforço.</li>
                        <li><span className="reason-number">7</span>Decisões de Manutenção Informadas.</li>
                        <li><span className="reason-number">8</span>Histórico de Manutenção Organizado.</li>
                        <li><span className="reason-number">9</span>Segurança e Confiabilidade.</li>
                        <li><span className="reason-number">10</span>Comunidade e Suporte.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nova seção: Impacto e Credibilidade */}
            <div className="inicio-stats-section">
              <div className="inicio-stats-container">
                <h2 className="inicio-stats-title">Impacto e Credibilidade: A Peça Fácil em Números</h2>
                
                <div className="inicio-stats-grid">
                  <div className="inicio-stat-card">
                    <div className="stat-icon">🔧</div>
                    <div className="stat-number">50.000+</div>
                    <div className="stat-label">Peças Catalogadas</div>
                    <div className="stat-description">Base de dados completa e atualizada</div>
                  </div>

                  <div className="inicio-stat-card">
                    <div className="stat-icon">🚗</div>
                    <div className="stat-number">500+</div>
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

                  <div className="inicio-stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-number">R$ 5.000</div>
                    <div className="stat-label">Economia Média/Ano</div>
                    <div className="stat-description">Por usuário em compras certeiras</div>
                  </div>

                  <div className="inicio-stat-card">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-number">70%</div>
                    <div className="stat-label">Redução de Tempo</div>
                    <div className="stat-description">Na busca e compra de peças</div>
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

