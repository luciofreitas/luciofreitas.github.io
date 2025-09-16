import React, { useContext } from 'react';
import Menu from './components/Menu';
import ContatoForm from './components/ContatoForm';
import { AuthContext } from './App';
import './page-ContatoLogado.css';

export default function ContatoLogado() {
  const { usuarioLogado } = useContext(AuthContext) || {};

  const handleSubmit = async (data) => {
    // aqui você pode enviar para a sua API
    console.log('[ContatoLogado] enviado:', data);
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

            <div className="contato-logado-info">
              <p>Telefone: (00) 0000-0000</p>
              <p>E-mail: suporte@pecafacil.com.br</p>
            </div>
  </div>
      </div>
    </>
  );
}
