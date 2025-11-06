import React from 'react';
import { MenuLogin, ContatoForm } from '../components';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import '../styles/pages/page-Contato.css';

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
            <p><FaWhatsapp className="contato-icon" /> (00) 0000-0000</p>
            <p><FaEnvelope className="contato-icon" /> suporte@garagemsmart.com.br</p>
          </div>
    </div>
  </div>
    </>
  );
}
