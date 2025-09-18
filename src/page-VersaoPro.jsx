import React from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from './components/Menu';
import './page-VersaoPro.css';

export default function VersaoPro() {
  const navigate = useNavigate();
  return (
    <>
  <Menu />
  <div className="page-wrapper menu-page">
  <div className="page-content" id="versao-pro">
            <h2 className="page-title">Versão Pro</h2>
          <p className="versaoPro-intro">
            Tenha acesso a todos os recursos avançados, suporte prioritário e integrações para otimizar sua busca por peças.
          </p>
          <div className="versaoPro-cards">
            <div className="versaoPro-features">
              <h3 className="versaoPro-features-title">Recursos incluídos</h3>
              <ul className="versaoPro-list">
                  <li> Acesso ao buscador de peças.</li>
                  <li> Acesso ao endereço das lojas que vendem as peças.</li>
                  <li> Suporte via email.</li>
                  <li> Suporte via whatsapp.</li>
                  <li> Comunidade no discord.</li>
              </ul>
            </div>

            <div className="versaoPro-pricecard">
              <div className="versaoPro-price">R$ 9,90/mês</div>
              <div className="versaoPro-price-note">Cancelamento a qualquer momento</div>
              <button className="versaoPro-cta" onClick={() => navigate('/checkin')}>Assinar Pro</button>
            </div>
          </div>
              </div>
        </div>
    </>
  );
}
