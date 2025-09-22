import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuLogin from './components/MenuLogin';
import './page-Inicio.css';
import catalogo1 from '../imagens pagina Inicial/catalogo-1.jpg';
import catalogo2 from '../imagens pagina Inicial/catalogo-2.jpg';

export default function PageInicio() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [zoomImage, setZoomImage] = useState(null);

  const openCardModal = (title) => {
    setModalContent(title);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent('');
  };

  return (
    <>
      <MenuLogin />
      <div className="page-wrapper page-inicio">
        <div className="page-content inicio-main">
          <div className="inicio-hero">
            <div className="inicio-hero-inner">
              <h1 className="page-title">Seja um entendedor automotivo, agora mesmo</h1>
              <p className="inicio-subtitle">Encontre peças compatíveis com economia e confiança.</p>
            </div>
          </div>

          <div className="inicio-cards">
            <button className="card" id="catalogo-peca" onClick={() => openCardModal('Catálogo de Peças')}>Catálogo de Peças</button>
            <button className="card" id="recalls" onClick={() => openCardModal('Recalls')}>Recalls</button>
            <button className="card" id="guias" onClick={() => openCardModal('Guias')}>Guias</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="pf-modal-overlay" onClick={closeModal}>
          <div className="pf-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="pf-modal-close" onClick={closeModal} aria-label="Fechar">×</button>
            {modalContent === 'Catálogo de Peças' ? (
              <>
                <h3>{modalContent}</h3>
                <div className="catalog-images">
                  <img src={catalogo1} alt="Catálogo 1" onClick={() => setZoomImage(catalogo1)} style={{cursor: 'zoom-in'}} />
                  <img src={catalogo2} alt="Catálogo 2" onClick={() => setZoomImage(catalogo2)} style={{cursor: 'zoom-in'}} />
                </div>
              </>
            ) : (
              <>
                <p>Conteúdo do modal para a seção "{modalContent}". Aqui você pode adicionar links, descrições ou ações.</p>
                <div style={{textAlign: 'right'}}>
                  <button className="btn-primary" onClick={() => { closeModal(); navigate('/buscar-pecas'); }}>Ir para catálogo</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {zoomImage && (
        <div className="pf-zoom-overlay" onClick={() => setZoomImage(null)}>
          <img className="pf-zoom-image" src={zoomImage} alt="Zoom" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
