import React from 'react';
import { MenuLogin, ContatoForm } from '../components';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
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

          <div className="contato-buttons">
            <button 
              className="contato-btn contato-btn-whatsapp"
              onClick={() => window.open('https://wa.me/5500000000000', '_blank')}
              title="WhatsApp"
            >
              <FaWhatsapp />
            </button>
            
            <button 
              className="contato-btn contato-btn-instagram"
              onClick={() => window.open('https://instagram.com/', '_blank')}
              title="Instagram"
            >
              <FaInstagram />
            </button>
          </div>
    </div>
  </div>
    </>
  );
}
