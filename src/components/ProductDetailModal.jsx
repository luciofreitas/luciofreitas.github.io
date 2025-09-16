import React, { useState, useEffect } from 'react';
import './ProductDetailModal.css';

function ProductDetailModal({ isOpen, onClose, productId }) {
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (isOpen && productId) {
      loadProductDetails(productId);
    }
  }, [isOpen, productId]);

  const loadProductDetails = async (id) => {
    setLoading(true);
    try {
      // Usar endpoint do backend
      const response = await fetch(`/api/pecas/${id}`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const product = await response.json();
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

  return (
    <div className="product-modal-overlay" onClick={handleOverlayClick}>
      <div className="product-modal">
        <div className="product-modal-header">
          <h2>{productDetails?.nome || 'Carregando...'}</h2>
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
              <div className="product-images">
                <div className="main-image">
                  <img 
                    src={productDetails.imagens?.[selectedImage] || '/assets/placeholder-part.jpg'} 
                    alt={productDetails.nome}
                    onError={(e) => { e.target.src = '/assets/placeholder-part.jpg'; }}
                  />
                </div>
                {productDetails.imagens && productDetails.imagens.length > 1 && (
                  <div className="image-thumbnails">
                    {productDetails.imagens.map((img, index) => (
                      <img 
                        key={index}
                        src={img}
                        alt={`${productDetails.nome} - ${index + 1}`}
                        className={selectedImage === index ? 'active' : ''}
                        onClick={() => setSelectedImage(index)}
                        onError={(e) => { e.target.src = '/assets/placeholder-part.jpg'; }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="product-basic-info">
                <div className="product-price-stock">
                  <span className="price">R$ {productDetails.preco?.toFixed(2).replace('.', ',')}</span>
                  <span className={`stock ${productDetails.estoque > 5 ? 'in-stock' : 'low-stock'}`}>
                    {productDetails.estoque > 0 ? `${productDetails.estoque} em estoque` : 'Fora de estoque'}
                  </span>
                </div>
                
                {productDetails.recall_relacionado && (
                  <div className="recall-alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <div>
                      <strong>Recall Relacionado</strong>
                      <p>{productDetails.recall_detalhes?.descricao}</p>
                      <small>Ref: {productDetails.recall_detalhes?.numero}</small>
                    </div>
                  </div>
                )}

                <div className="product-codes">
                  <div><strong>Fabricante:</strong> {productDetails.fabricante}</div>
                  <div><strong>Código:</strong> {productDetails.numero_peca}</div>
                  {productDetails.codigos?.oem && (
                    <div><strong>Códigos OEM:</strong> {productDetails.codigos.oem.join(', ')}</div>
                  )}
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
                    <h3>Descrição</h3>
                    <p>{productDetails.descricao}</p>
                    
                    <h3>Garantia e Entrega</h3>
                    <div className="delivery-warranty">
                      <div>📦 Entrega em {productDetails.prazo_entrega_dias} dias úteis</div>
                      <div>🛡️ Garantia de {productDetails.garantia_meses} meses</div>
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
                      {productDetails.aplicacoes_detalhadas?.map((app, index) => (
                        <div key={index} className="compatibility-row">
                          <div className="app-main">
                            <strong>{app.marca} {app.modelo}</strong>
                            <span>{app.ano_inicio}-{app.ano_fim}</span>
                          </div>
                          <div className="app-details">
                            <span>Motor: {app.motor}</span>
                            {app.observacoes && <small>{app.observacoes}</small>}
                          </div>
                        </div>
                      ))}
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

                    {productDetails.perguntas_frequentes && (
                      <>
                        <h3>Perguntas Frequentes</h3>
                        <div className="faq">
                          {productDetails.perguntas_frequentes.map((faq, index) => (
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