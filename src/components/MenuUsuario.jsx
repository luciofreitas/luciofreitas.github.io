import React, { useState, useRef, useEffect } from 'react';
import './MenuUsuario.css';

function MenuUsuario({ nome, isPro = false, onPerfil, onMeusCarros, onPro, onLogout, photoURL }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Função para calcular a posição do dropdown
  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom, // Posiciona abaixo do botão
        right: window.innerWidth - rect.right // Alinha à direita do botão
      });
    }
  };

  // Atualiza posição quando abre
  useEffect(() => {
    if (open) {
      calculatePosition();
    }
  }, [open]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleOutside(e) {
      if (open && 
          buttonRef.current && !buttonRef.current.contains(e.target) && 
          dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('resize', calculatePosition);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [open]);

  return (
    <div className="user-menu-root">
      <button
        ref={buttonRef}
        className={`user-button icon-only ${isPro ? 'user-pro' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* If photoURL is available, show image avatar; otherwise fallback to icon */}
        {photoURL ? (
          <img
            src={photoURL}
            alt={nome ? `Avatar de ${nome}` : 'Avatar do usuário'}
            className="user-avatar"
          />
        ) : (
          <>
            {/* Initials fallback: show a circular badge with initials derived from nome */}
            <span className="user-initials-desktop" aria-hidden>{(function(){
              try{
                if(!nome) return '';
                const parts = String(nome).trim().split(/\s+/).filter(Boolean);
                if(parts.length === 0) return '';
                if(parts.length === 1) return parts[0].charAt(0).toUpperCase();
                return (parts[0].charAt(0) + parts[parts.length-1].charAt(0)).toUpperCase();
              }catch(e){ return '' }
            })()}</span>
            <span className="user-initials-mobile" aria-hidden>{(function(){
              try{
                if(!nome) return '';
                const parts = String(nome).trim().split(/\s+/).filter(Boolean);
                if(parts.length === 0) return '';
                return parts[0].charAt(0).toUpperCase();
              }catch(e){ return '' }
            })()}</span>
          </>
        )}
      </button>

      {open && (
        <div 
          ref={dropdownRef}
          className="user-dropdown"
          style={{ 
            top: `${dropdownPosition.top}px`, 
            right: `${dropdownPosition.right}px` 
          }}
        >
          {/* Nome do usuário como primeiro item do dropdown (apenas no mobile) - não clicável */}
          <div className="dropdown-item dropdown-user-name dropdown-user-name-header">
            <div className="dropdown-user-name-row">Olá, {nome}</div>
            {isPro && (
              <div className="dropdown-user-subtitle">Assinante Pro</div>
            )}
          </div>
          <button className="dropdown-item" onClick={() => { setOpen(false); onPerfil(); }}>Perfil</button>
          <button className="dropdown-item" onClick={() => { setOpen(false); onMeusCarros(); }}>Meus Carros</button>
          <button className="dropdown-item" onClick={() => { setOpen(false); onPro(); }}>Versão Pro</button>
          <button className="dropdown-item dropdown-item-logout" onClick={() => { setOpen(false); onLogout(); }}>Sair</button>
        </div>
      )}
    </div>
  );
}

export default MenuUsuario;
