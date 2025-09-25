import React, { useContext } from 'react';
import Menu from './components/Menu';
import PerfilForm from './components/PerfilForm';
import { AuthContext } from './App';
import './page-Perfil.css';

export default function PagePerfil() {
  const { usuario-logado } = useContext(AuthContext);

  if (!usuario-logado) {
    return (
      <>
        <Menu />
        <div className="menu-page">
          <div className="perfil-error">
            <h2 className="page-heading">Acesso Negado</h2>
            <p>Você precisa estar logado para acessar esta página.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page">
  <div className="page-content" id="perfil">
            <h2 className="page-title">Meu Perfil</h2>
            <PerfilForm form-data={usuario-logado} />
  </div>
      </div>
    </>
  );
}
