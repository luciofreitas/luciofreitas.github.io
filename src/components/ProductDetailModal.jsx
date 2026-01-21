import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/apiService';
import './ProductDetailModal.css';
import useFocusTrap from '../hooks/useFocusTrap';
import { AuthContext } from '../App';
import { addMaintenance } from '../services/maintenanceService';
import { getCars } from '../services/carService';

function ProductDetailModal({ isOpen, onClose, productId, selectedCarId }) {
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [selectedImage, setSelectedImage] = useState(0);
  const [userCars, setUserCars] = useState([]);

  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const location = window.location;

  useEffect(() => {
    if (isOpen && productId) {
      loadProductDetails(productId);
    }
  }, [isOpen, productId]);

  // Load user's cars when modal opens so we can associate a saved search with a vehicle
  useEffect(() => {
    let mounted = true;
    async function loadCars() {
      try {
        if (!usuarioLogado) return setUserCars([]);
        const userId = usuarioLogado.id || usuarioLogado.email;
        const cars = await getCars(userId);
        if (mounted) setUserCars(Array.isArray(cars) ? cars : []);
      } catch (e) { console.warn('Failed to load user cars for ProductDetailModal', e); }
    }
    if (isOpen) loadCars();
    return () => { mounted = false; };
  }, [isOpen, usuarioLogado]);

  const modalRef = useRef(null);
  // dynamic import to avoid circular issues if any; local hook
  // eslintDisableNextLine import/noExtraneousDependencies
  // but this is a local hook
  // import at top would be fine; keeping inline for clarity
  // use hook to trap focus and restore previous focus on close
  // require path relative to this file
  // We import normally
  // eslintDisableNextLine noUnusedVars
  
  // Note: moved import to topLevel would be cleaner, but keep here to avoid altering other files
  // We'll import the hook at top by updating imports

  // trap focus while modal is open
  useFocusTrap(isOpen, modalRef);

  // Inline SVG placeholder (data URI) to avoid 404s when the static image is missing
  const PLACEHOLDER_SRC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23f3f4f6'/><text x='50%25' y='50%25' fill='%239ca3af' font-size='24' font-family='Arial' dominant-baseline='middle' text-anchor='middle'>Imagem%20indispon%C3%ADvel</text></svg>";

  const loadProductDetails = async (id) => {
    setLoading(true);
    try {
      const product = await apiService.getPecaById(id);
      if (product.error) {
        console.error('ProductDetailModal: Error from API:', product.error);
        throw new Error(product.error);
      }
      setProductDetails(product);
      setSelectedImage(0);
    } catch (error) {
      console.error('Erro ao carregar detalhes da peça:', error);
      setProductDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isRenderableImageUrl = (url) => {
    const s = String(url ?? '').trim();
    if (!s) return false;
    if (s.startsWith('data:image/')) return true;
    if (s.startsWith('http://') || s.startsWith('https://')) return true;
    if (s.startsWith('/')) return true;
    return false;
  };

  const images = Array.isArray(productDetails?.imagens)
    ? productDetails.imagens
      .filter((img) => typeof img === 'string')
      .map((img) => img.trim())
      .filter(isRenderableImageUrl)
    : [];

  const hasImages = images.length > 0;
  const safeSelectedImage = Math.min(Math.max(selectedImage, 0), Math.max(images.length - 1, 0));

  return (
    <div className="product-modal-overlay" onClick={handleOverlayClick}>
      <div ref={modalRef} className="product-modal" role="dialog" aria-modal="true" aria-label={productDetails?.nome || 'Detalhes da peça'}>
        <div className="product-modal-header">
          <h2>{productDetails?.nome || 'Carregando...'}</h2>
          <div className="product-modal-actions">
            {/* Save button moved to Compatibility modal */}
          </div>
          <button className="product-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="product-modal-loading">
            <div className="loading-spinner"></div>
            <p>Carregando detalhes da peça...</p>
          </div>
        ) : productDetails ? (
          <div className="product-modal-content">
            {/* Seção de Imagens e Info Básica */}
            <div className="product-header-section">
              {hasImages ? (
                <div className="product-images">
                  <div className="main-image">
                    <img 
                      src={images[safeSelectedImage] || PLACEHOLDER_SRC} 
                      alt={productDetails?.nome || ''}
                      onError={(e) => { e.target.src = PLACEHOLDER_SRC; }}
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="image-thumbnails">
                      {images.map((img, index) => (
                          <img 
                          key={index}
                          src={img}
                          alt={productDetails?.nome ? `${productDetails.nome} - ${index + 1}` : ''}
                          className={safeSelectedImage === index ? 'active' : ''}
                          onClick={() => setSelectedImage(index)}
                          onError={(e) => { e.target.src = PLACEHOLDER_SRC; }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              
              <div className="product-basic-info">
                {productDetails.recall_relacionado && (
                  <div className="recall-alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      {/* circle with exclamation mark icon (valid path) */}
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M11 7h2v6h-2zM11 15h2v2h-2z" fill="currentColor" />
                    </svg>
                    <div>
                      <strong>Recall Relacionado</strong>
                      <p>{productDetails.recall_detalhes?.descricao}</p>
                      <small>Ref: {productDetails.recall_detalhes?.numero}</small>
                    </div>
                  </div>
                )}

                <div className="product-codes">
                  {/* Categoria (some sources use `categoria` or `category`) */}
                  {(productDetails.categoria || productDetails.category) && (
                    <div><strong>Categoria:</strong> {productDetails.categoria || productDetails.category}</div>
                  )}

                  <div><strong>Fabricante:</strong> {productDetails.fabricante}</div>

                  {/* Primary code selection: prefer part_number / numero_peca / codigos.oem[0] / codigos.equivalentes[0] */}
                  {(() => {
                    const code = productDetails.part_number || productDetails.numero_peca ||
                      (productDetails.codigos && Array.isArray(productDetails.codigos.oem) && productDetails.codigos.oem[0]) ||
                      (productDetails.codigos && Array.isArray(productDetails.codigos.equivalentes) && productDetails.codigos.equivalentes[0]) ||
                      productDetails.code || productDetails.sku || productDetails.id || null;
                    return code ? <div><strong>Código:</strong> {code}</div> : null;
                  })()}
                </div>

                <div className="installation-info">
                  <div className="install-difficulty">
                    <span className="label">Dificuldade:</span>
                    <span className={`difficulty ${productDetails.instalacao?.dificuldade?.toLowerCase()}`}>
                      {productDetails.instalacao?.dificuldade}
                    </span>
                  </div>
                  <div className="install-time">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {productDetails.instalacao?.tempo_estimado_min} min
                  </div>
                </div>

                <div className="contact-workshop">
                  <p><strong>💡 Para preços e disponibilidade:</strong></p>
                  <p>Consulte nossas oficinas parceiras próximas ao seu local</p>
                </div>
              </div>
            </div>

            {/* Abas de Conteúdo */}
                <div className="product-tabs">
              <div className="tab-buttons">
                <button 
                  className={activeTab === 'geral' ? 'active' : ''} 
                  onClick={() => setActiveTab('geral')}
                >
                  Geral
                </button>
                <button 
                  className={activeTab === 'especificacoes' ? 'active' : ''} 
                  onClick={() => setActiveTab('especificacoes')}
                >
                  Especificações
                </button>
                <button 
                  className={activeTab === 'compatibilidade' ? 'active' : ''} 
                  onClick={() => setActiveTab('compatibilidade')}
                >
                  Compatibilidade
                </button>
                <button 
                  className={activeTab === 'instalacao' ? 'active' : ''} 
                  onClick={() => setActiveTab('instalacao')}
                >
                  Instalação
                </button>
                <button 
                  className={activeTab === 'avaliacoes' ? 'active' : ''} 
                  onClick={() => setActiveTab('avaliacoes')}
                >
                  Avaliações
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'geral' && (
                  <div className="tab-panel">
                    <h3>Como Adquirir</h3>
                    <div className="workshop-info">
                      <div>🏪 Consulte preços e disponibilidade com nossas oficinas parceiras</div>
                      <div>🛠️ Instalação profissional disponível</div>
                      <div>� Garantia conforme política de cada oficina</div>
                    </div>

                    {productDetails.pecas_relacionadas && (
                      <>
                        <h3>Peças Relacionadas</h3>
                        <div className="related-parts">
                          {productDetails.pecas_relacionadas.map((peca, index) => (
                            <div key={index} className="related-part">
                              <strong>{peca.nome}</strong>
                              <span>{peca.relacao}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'especificacoes' && (
                  <div className="tab-panel">
                    <h3>Especificações Técnicas</h3>
                        <div className="specs-grid">
                      {productDetails.especificacoes_tecnicas && Object.entries(productDetails.especificacoes_tecnicas).map(([key, value]) => (
                        <div key={key} className="spec-item">
                          <span className="spec-label">{key.replace(/_/g, ' ')}:</span>
                          <span className="spec-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'compatibilidade' && (
                  <div className="tab-panel">
                    <h3>Aplicações Detalhadas</h3>
                    <div className="compatibility-table">
                      {productDetails.aplicacoes_detalhadas?.filter(app => 
                        app.marca && app.modelo && app.marca !== 'N/A' && app.modelo !== 'N/A'
                      ).length > 0 ? (
                        productDetails.aplicacoes_detalhadas
                          .filter(app => app.marca && app.modelo && app.marca !== 'N/A' && app.modelo !== 'N/A')
                          .map((app, index) => (
                            <div key={index} className="compatibility-row">
                              <div className="app-main">
                                <strong>{app.marca} {app.modelo}</strong>
                                <span>{app.ano_inicio}-{app.ano_fim}</span>
                              </div>
                              <div className="app-details">
                                {app.motor && app.motor !== 'N/A' && <span>Motor: {app.motor}</span>}
                                {app.observacoes && <small>{app.observacoes}</small>}
                              </div>
                            </div>
                          ))
                      ) : (
                        <p style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>
                          Informações de compatibilidade detalhadas não disponíveis para esta peça.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'instalacao' && (
                  <div className="tab-panel">
                    <h3>Guia de Instalação</h3>
                    <div className="install-guide">
                      <div className="install-requirements">
                        <div><strong>Ferramentas necessárias:</strong></div>
                        <ul>
                          {productDetails.instalacao?.ferramentas_necessarias?.map((tool, index) => (
                            <li key={index}>{tool}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {productDetails.instalacao?.precaucoes && (
                        <div className="install-precautions">
                          <div><strong>⚠️ Precauções:</strong></div>
                          <ul>
                            {productDetails.instalacao.precaucoes.map((precaution, index) => (
                              <li key={index}>{precaution}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'avaliacoes' && (
                  <div className="tab-panel">
                    <h3>Avaliações de Clientes</h3>
                    <div className="reviews">
                      {productDetails.avaliacoes?.map((review, index) => (
                        <div key={index} className="review-item">
                          <div className="review-header">
                            <strong>{review.usuario}</strong>
                            <div className="review-rating">
                              {'★'.repeat(review.nota)}{'☆'.repeat(5-review.nota)}
                            </div>
                            <span className="review-date">{new Date(review.data).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p>{review.texto}</p>
                        </div>
                      ))}
                    </div>

                    {productDetails.perguntasFrequentes && (
                      <>
                        <h3>Perguntas Frequentes</h3>
                        <div className="faq">
                          {productDetails.perguntasFrequentes.map((faq, index) => (
                            <div key={index} className="faq-item">
                              <strong>Q: {faq.pergunta}</strong>
                              <p>R: {faq.resposta}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="product-modal-error">
            <p>Não foi possível carregar os detalhes da peça.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailModal;