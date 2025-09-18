import React, { useContext, useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import './MenuLogin.css';
import Logo from './Logo';
import MenuUsuario from './MenuUsuario';

function Menu() {
  const [hideMenu, setHideMenu] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPosition, setMobileMenuPosition] = useState({ top: 0, left: 0 });
  const mobileMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();
  const { usuarioLogado, setUsuarioLogado } = useContext(AuthContext);
  const proActive = Boolean(usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true';
  const headerRef = useRef(null);

  // shared menu items to render in desktop nav and mobile dropdown
  const menuItems = [
    {
      id: 'buscar',
      label: 'Buscar Peças',
      onClick: () => navigate('/buscar-pecas')
    },
    { id: 'recalls', label: 'Recalls', onClick: () => navigate('/recalls') },
    { id: 'guias', label: 'Guias', onClick: () => navigate('/guias') },
    { id: 'parceiros', label: 'Parceiros', onClick: () => navigate('/parceiros') },
    { id: 'contato', label: 'Contato', onClick: () => navigate('/contato-logado') }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 60) {
        setHideMenu(true);
      } else {
        setHideMenu(false);
      }
      setLastScroll(currentScroll);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScroll]);

  // Função para calcular a posição do menu mobile EXATAMENTE como MenuUsuario
  const calculateMobileMenuPosition = () => {
    if (mobileMenuButtonRef.current) {
      const rect = mobileMenuButtonRef.current.getBoundingClientRect();

      // Position below the button like MenuUsuario.jsx does
      const top = Math.round(rect.bottom + 4); // Small gap below the button
      const left = Math.round(rect.left); // Align left edge with hamburger icon

      // Set CSS custom properties for positioning
      if (mobileMenuRef.current) {
        mobileMenuRef.current.style.setProperty('--dropdown-top', `${top}px`);
        mobileMenuRef.current.style.setProperty('--dropdown-left', `${left}px`);
      }

      setMobileMenuPosition({ top, left });
    }
  };

  // Previously this effect synchronized the header height to a CSS variable.
  // That runtime synchronization was removed per request; header sizing is now
  // controlled by static CSS rules to avoid runtime style manipulation.

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    // If opening, calculate position after next paint (we measure in useLayoutEffect too)
    if (newState) {
      // slight delay to allow DOM updates; calculateMobileMenuPosition will also run in useLayoutEffect
      window.requestAnimationFrame(() => calculateMobileMenuPosition());
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (callback) => {
    return (e) => {
      // Suporta ser chamado com ou sem evento (ex.: MenuUsuario chama sem evento)
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      closeMobileMenu();
      callback();
    };
  };

  // Fecha menu mobile ao clicar fora (similar ao MenuUsuario)
  useEffect(() => {
    function handleOutside(e) {
      if (mobileMenuOpen && 
          mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(e.target) && 
          mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('resize', calculateMobileMenuPosition);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('resize', calculateMobileMenuPosition);
    };
  }, [mobileMenuOpen]);

  // Measure dropdown size and recalculate position precisely after it's mounted/updated
  useLayoutEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current && mobileMenuButtonRef.current) {
      // Recalculate position like MenuUsuario.jsx does
      const rect = mobileMenuButtonRef.current.getBoundingClientRect();
      const top = Math.round(rect.bottom + 4); // Position below button
      const left = Math.round(rect.left); // Align left edge with hamburger icon

      // Set CSS custom properties for positioning
      if (mobileMenuRef.current) {
        mobileMenuRef.current.style.setProperty('--dropdown-top', `${top}px`);
        mobileMenuRef.current.style.setProperty('--dropdown-left', `${left}px`);
      }

      setMobileMenuPosition({ top, left });
    }
  }, [mobileMenuOpen]);

  return (
    <header ref={headerRef} className="site-header menu-login">
      <div className="menu-login-root menu-responsive">
        <Logo />

        {/* Mobile hamburger button - replicate MenuUsuario structure */}
        <div className="user-menu-root hamburger-menu-root">
          <button
            ref={mobileMenuButtonRef}
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => { setMobileMenuOpen(v => !v); if (!mobileMenuOpen) calculateMobileMenuPosition(); }}
            aria-label="Toggle mobile menu"
            aria-haspopup="true"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          {/* Dropdown balloon replicated from MenuUsuario */}
          <div
            ref={mobileMenuRef}
            className={`user-dropdown ${mobileMenuOpen ? 'open' : 'closed'}`}
            role="menu"
            aria-hidden={!mobileMenuOpen}
          >
            {menuItems.map(item => (
              <button key={item.id} className="dropdown-item" onClick={() => { setMobileMenuOpen(false); item.onClick(); }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation menu (desktop) */}
        <div className="menu-login-center">
          <nav className="menu-nav">
            <ul className="menu-list">
              {menuItems.map(item => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="menu-login-item" onClick={handleNavigation(item.onClick)}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* NOTE: mobile dropdown uses the replicated user-dropdown earlier; no separate mobile-menu-dropdown required */}

        <div className="menu-login-right">
        {!usuarioLogado ? (
            <a href="#entrar/registrar" className="menu-login-item text-lg md:text-xl" onClick={handleNavigation(() => navigate('/login'))}>Entrar/Registrar</a>
          ) : (
            <MenuUsuario
              nome={usuarioLogado.nome}
              isPro={proActive}
              onPerfil={handleNavigation(() => navigate('/perfil'))}
              onPro={handleNavigation(() => navigate(proActive ? '/versao-pro-assinado' : '/versao-pro'))}
              onConfiguracoes={handleNavigation(() => navigate('/configuracoes'))}
              onLogout={handleNavigation(() => {
                // limpa estado/localStorage e redireciona para a tela de login
                setUsuarioLogado(null);
                localStorage.removeItem('usuarioLogado');
                navigate('/login');
              })}
            />
          )}
        </div>
      </div>
    </header>
  );
}

export default Menu;
