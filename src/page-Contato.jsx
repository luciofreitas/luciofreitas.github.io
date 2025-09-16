import React from 'react';
import MenuLogin from './components/MenuLogin';
import ContatoForm from './components/ContatoForm';
import './page-Contato.css';

export default function Contato() {
  return (
    <>
  <MenuLogin />
  <div className="page-wrapper">
  <div className="page-content" id="contato">
          <h2 className="page-title">Contato</h2>
          
          <div className="contato-intro">
            <p>
              Entre em contato conosco pelo formulário abaixo ou pelos canais oficiais.
            </p>
          </div>

          <ContatoForm />

          <div className="contato-info">
            <p>Telefone: (00) 0000-0000</p>
            <p>E-mail: suporte@pecafacil.com.br</p>
          </div>
    </div>
  </div>
    </>
  );
}
