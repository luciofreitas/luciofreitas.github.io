import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProExpiryWarning.css';

export default function ProExpiryWarning({ daysLeft, onClose, onRenew }) {
  const navigate = useNavigate();

  const handleRenew = () => {
    if (onRenew) {
      onRenew();
    } else {
      navigate('/versao-pro');
    }
    onClose();
  };

  return (
    <div className="pro-expiry-overlay" onClick={onClose}>
      <div className="pro-expiry-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pro-expiry-close" onClick={onClose}>×</button>
        
        <div className="pro-expiry-icon">⚠️</div>
        
        <h2 className="pro-expiry-title">
          Sua Versão Pro está acabando!
        </h2>
        
        <div className="pro-expiry-content">
          {daysLeft === 1 ? (
            <p className="pro-expiry-message">
              Sua assinatura Pro expira <strong>amanhã</strong>!
            </p>
          ) : daysLeft === 0 ? (
            <p className="pro-expiry-message">
              Sua assinatura Pro expira <strong>hoje</strong>!
            </p>
          ) : (
            <p className="pro-expiry-message">
              Sua assinatura Pro expira em <strong>{daysLeft} dias</strong>!
            </p>
          )}
          
          <p className="pro-expiry-description">
            Renove agora para continuar aproveitando todos os benefícios:
          </p>
          
          <ul className="pro-expiry-benefits">
            <li>✓ Acesso completo aos Guias Premium</li>
            <li>✓ Tabela FIPE sem restrições</li>
            <li>✓ Suporte prioritário</li>
            <li>✓ Novos recursos exclusivos</li>
          </ul>
        </div>
        
        <div className="pro-expiry-actions">
          <button 
            className="pro-expiry-btn-renew"
            onClick={handleRenew}
          >
            Renovar Agora
          </button>
          <button 
            className="pro-expiry-btn-later"
            onClick={onClose}
          >
            Lembrar Depois
          </button>
        </div>
      </div>
    </div>
  );
}
