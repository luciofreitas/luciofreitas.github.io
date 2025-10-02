import React from 'react';
import Menu from '../components/Menu';
import '../styles/pages/page-Parceiros.css';

export default function Parceiros() {
  return (
    <>
  <Menu />
  <div className="page-wrapper menu-page">
  <div className="page-content" id="parceiros">
          <h2 className="page-title">Parceiros</h2>
          
          <div className="parceiros-intro">
            <p>
              Esta página apresenta informações sobre nossos parceiros e oportunidades de colaboração.
              Aqui você pode encontrar como se tornar um parceiro, benefícios e contatos.
            </p>
          </div>

          <div className="parceiros-cta">
            <button className="search-btn parceiros-cta-btn">Entre em contato</button>
          </div>
              </div>
        </div>
    </>
  );
}
