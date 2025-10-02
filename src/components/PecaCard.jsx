import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import { AuthContext } from '../App';
import './PecaCard.css';

function PecaCard({ peca, onViewCompatibility, onViewDetails }) {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  return (
    <div className="peca-card">
      <h3 className="peca-card-title">{peca.name}</h3>
      <p className="peca-card-info"><strong>Categoria:</strong> {peca.category}</p>
      <p className="peca-card-info"><strong>Fabricante:</strong> {peca.manufacturer}</p>
      <p className="peca-card-info"><strong>Código:</strong> {peca.partNumber}</p>
      <p className="peca-card-info"><strong>Descrição:</strong> {peca.description}</p>
      
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
        {/* Botão Ver Compatibilidade */}
        <div className="button-with-lock">
          <button 
            className={`peca-card-compat-btn ${!usuarioLogado ? 'btn-blocked' : ''}`}
            onClick={() => usuarioLogado && onViewCompatibility(peca)}
            disabled={!usuarioLogado}
          >
            Ver compatibilidade
          </button>
          {!usuarioLogado && (
            <div className="lock-icon-wrapper">
              <span className="lock-icon">🔒</span>
              <span className="lock-tooltip">
                Faça login para ver a compatibilidade completa desta peça
              </span>
            </div>
          )}
        </div>
        
        {/* Botão Ver Ficha Completa */}
        <div className="button-with-lock">
          <button 
            className={`peca-card-details-btn ${!usuarioLogado ? 'btn-blocked' : ''}`}
            onClick={() => usuarioLogado && onViewDetails && onViewDetails(peca.id)}
            disabled={!usuarioLogado}
          >
            Ver ficha completa
          </button>
          {!usuarioLogado && (
            <div className="lock-icon-wrapper">
              <span className="lock-icon">🔒</span>
              <span className="lock-tooltip">
                Faça login para acessar a ficha técnica completa desta peça
              </span>
            </div>
          )}
        </div>
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
