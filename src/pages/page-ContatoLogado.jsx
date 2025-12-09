import React, { useContext } from 'react';
import { Menu, ContatoForm } from '../components';
import { AuthContext } from '../App';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import '../styles/pages/page-ContatoLogado.css';

export default function ContatoLogado() {
  const { usuarioLogado } = useContext(AuthContext) || {};

  const handleSubmit = async (data) => {
    // aqui você pode enviar para a sua API
    alert('Mensagem enviada com sucesso (usuário logado)!');
  };

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page">
  <div className="page-content" id="contato-logado">
            <h2 className="page-title">Contato</h2>
            
            <div className="contatologado-intro">
              <p>
                Entre em contato conosco pelo formulário abaixo ou pelos canais oficiais.
              </p>
            </div>

            <ContatoForm requireAuth={true} user={usuarioLogado} onSubmit={handleSubmit} />

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
                onClick={() => window.open('https://instagram.com/garagemsmart', '_blank')}
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
