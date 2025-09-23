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
                  No PeçasFácil você conseguirá se virar sozinho, aprenderá a identificar e comprar as peças certas para o
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
                      </div>
                    );
                  });
                })()}
              </div>
              <button className="carousel-control next" aria-label="Próximo" onClick={nextSlide}>❯</button>
            </div>
            {/* Full-width blue band under the carousel to match menu color */}
            <div className="inicio-band" aria-hidden="true"></div>
        </div>
      </div>
      {/* modal removed: replaced by direct band below carousel; detailed modal was unused after cards → carousel refactor */}
      {zoomImage && (
        <div className="pf-zoom-overlay" onClick={() => setZoomImage(null)}>
          <img className="pf-zoom-image" src={zoomImage} alt="Zoom" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

