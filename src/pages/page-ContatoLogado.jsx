import React, { useContext } from 'react';
import { Menu, ContatoForm } from '../components';
import { AuthContext } from '../App';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa';
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
      <div className="site-header-spacer"></div>
      <div className="page-wrapper menu-page">
  <div className="page-content" id="contato-logado">
            <h2 className="page-title">Contato</h2>
            
            <div className="contatologado-intro">
              <p>
                Entre em contato conosco pelo formulário abaixo ou pelos canais oficiais.
              </p>
            </div>

            <ContatoForm requireAuth={true} user={usuarioLogado} onSubmit={handleSubmit} />

            <div className="contato-logado-info">
              <p><FaWhatsapp className="contato-icon" /> (00) 0000-0000</p>
              <p><FaEnvelope className="contato-icon" /> suporte@garagemsmart.com.br</p>
            </div>
  </div>
      </div>
    </>
  );
}
