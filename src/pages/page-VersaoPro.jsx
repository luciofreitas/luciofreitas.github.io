import React from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/Menu';
import '../styles/pages/page-VersaoPro.css';

export default function VersaoPro() {
  const navigate = useNavigate();
  return (
    <>
  <Menu />
  <div className="page-wrapper menu-page">
  <div className="page-content" id="versao-pro">
            <h2 className="page-title">Versão Pro</h2>
          <p className="versao-pro-intro">
            Tenha acesso a todos os recursos avançados, suporte prioritário e integrações para otimizar sua busca por peças.
          </p>
          <div className="versao-pro-cards">
            <div className="versao-pro-features">
              <h3 className="versao-pro-features-title">Recursos incluídos</h3>
              <ul className="versao-pro-list">
                  <li> Acesso ao endereço das lojas que vendem as peças.</li>
                  <li> Suporte via email.</li>
                  <li> Suporte via whatsapp.</li>
                  <li> Comunidade no discord.</li>
              </ul>
            </div>

            <div className="versao-pro-pricecard">
              <div className="versao-pro-price">R$ 9,90/mês</div>
              <div className="versao-pro-price-note">Cancelamento a qualquer momento</div>
              <button className="versao-pro-cta" onClick={() => navigate('/checkin')}>Assinar Pro</button>
            </div>
          </div>
              </div>
        </div>
    </>
  );
}
