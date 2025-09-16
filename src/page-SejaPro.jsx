import React from 'react';
import MenuLogin from './components/MenuLogin';
import './page-SejaPro.css';

export default function SejaPro() {
  return (
    <>
  <MenuLogin />
  <div className="page-wrapper">
  <div className="page-content" id="seja-pro">
          <h2 className="page-title">Seja Pro</h2>
          
          <div className="sejapro-intro">
            <p>
              Tenha acesso a benefícios exclusivos e suporte prioritário ao se tornar um membro Pro.
            </p>
          </div>
          
          <div className="seja-pro-cards">
            <div className="seja-pro-card">
              <h3 className="seja-pro-card-title">Básico</h3>
              <p className="seja-pro-card-lead">Todos os benefícios da versão Básica.</p>
              <div className="seja-pro-card-body">
                <ul className="seja-pro-features">
                  <li>Acesso ao buscador de peças.</li>
                  <li className="seja-pro-feature-unavailable">Acesso ao endereço das lojas que vendem as peças.</li>
                  <li>Suporte via email.</li>
                  <li className="seja-pro-feature-unavailable">Suporte via whatsapp.</li>
                  <li className="seja-pro-feature-unavailable">Comunidade no discord.</li>
                </ul>
              </div>
            </div>

            <div className="seja-pro-card">
              <h3 className="seja-pro-card-title">Pro</h3>
              <p className="seja-pro-card-lead">Todos os benefícios da versão Pro.</p>
              <div className="seja-pro-card-body">
                <ul className="seja-pro-features">
                  <li> Acesso ao buscador de peças.</li>
                  <li> Acesso ao endereço das lojas que vendem as peças.</li>
                  <li> Suporte via email.</li>
                  <li> Suporte via whatsapp.</li>
                  <li> Comunidade no discord.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
