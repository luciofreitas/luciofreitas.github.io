import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import { AuthContext } from '../App';
import './PecaCard.css';

function PecaCard({ peca, onViewCompatibility, onViewDetails }) {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  
  // Check if it's a Mercado Livre product
  const isMLProduct = peca.ml_product || peca.permalink;
  
  // Format price for display
  const formatPrice = (price, currency = 'BRL') => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };
  
  return (
    <div className={`peca-card ${isMLProduct ? 'ml-product' : ''}`}>
      {/* Product Image (ML only) */}
      {isMLProduct && peca.thumbnail && (
        <div className="peca-card-image">
          <img src={peca.thumbnail} alt={peca.name} loading="lazy" />
          {peca.shipping?.free_shipping && (
            <span className="free-shipping-badge">Frete Grátis</span>
          )}
        </div>
      )}
      
      <h3 className="peca-card-title">{peca.name}</h3>
      {/* Show primary product code if available */}
      {(() => {
        const code = peca.part_number || peca.numero_peca || (peca.codigos && Array.isArray(peca.codigos.oem) && peca.codigos.oem[0]) || (peca.codigos && Array.isArray(peca.codigos.equivalentes) && peca.codigos.equivalentes[0]) || peca.sku || peca.code || peca.id || null;
        return code ? <p className="peca-card-code"><strong>Código:</strong> {code}</p> : null;
      })()}
      
      {/* Price (ML only) */}
      {isMLProduct && peca.price && (
        <div className="peca-card-price">
          <span className="price-current">{formatPrice(peca.price, peca.currency)}</span>
          {peca.original_price && peca.original_price > peca.price && (
            <span className="price-original">{formatPrice(peca.original_price, peca.currency)}</span>
          )}
        </div>
      )}
      
      <p className="peca-card-info"><strong>Categoria:</strong> {peca.category}</p>
      <p className="peca-card-info"><strong>Fabricante:</strong> {peca.manufacturer}</p>
      
      {/* Condition (ML only) */}
      {isMLProduct && peca.condition && (
        <p className="peca-card-info">
          <strong>Condição:</strong> {peca.condition === 'new' ? 'Novo' : 'Usado'}
        </p>
      )}
      
      {/* Stock info (ML only) */}
      {isMLProduct && peca.available_quantity !== undefined && (
        <p className="peca-card-info">
          <strong>Disponível:</strong> {peca.available_quantity} unidade(s)
          {peca.sold_quantity > 0 && ` • ${peca.sold_quantity} vendido(s)`}
        </p>
      )}
      
      {peca.specifications && (
        <div className="peca-card-specs">
          <strong>Especificações:</strong>
          {Object.entries(peca.specifications).map(([key, value]) => (
            <div key={key} className="peca-card-spec-item">
              {key}: {value}
            </div>
          ))}
        </div>
      )}
      
      <div className="peca-card-actions">
        {/* ML Buy Button */}
        {isMLProduct && peca.permalink && (
          <a 
            href={peca.permalink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="peca-card-buy-btn ml-btn"
          >
            🛒 Comprar no Mercado Livre
          </a>
        )}
        
        {/* Botão Ver Compatibilidade */}
        <button 
          className={`peca-card-compat-btn ${!usuarioLogado ? 'btn-blocked' : ''}`}
          onClick={() => usuarioLogado && onViewCompatibility(peca)}
          disabled={!usuarioLogado}
        >
          Ver compatibilidade
        </button>
        
        {/* Botão Ver Ficha Completa - only for non-ML products or if logged in */}
        {(!isMLProduct || usuarioLogado) && (
          <button 
            className={`peca-card-details-btn ${!usuarioLogado ? 'btn-blocked' : ''}`}
            onClick={() => usuarioLogado && onViewDetails && onViewDetails(peca.id)}
            disabled={!usuarioLogado}
          >
            Ver ficha completa
          </button>
        )}
      </div>

      {/* CTA para login se não logado */}
      {!usuarioLogado && (
        <div className="cta-login-box">
          <p>💡 <strong>Quer acessar todos os detalhes?</strong></p>
          <button onClick={() => navigate('/login')} className="cta-login-button">
            Fazer Login / Cadastrar Grátis
          </button>
        </div>
      )}
    </div>
  );
}

export default PecaCard;
