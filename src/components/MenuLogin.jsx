import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuLogin.css';
import Logo from './Logo';
import GetStartedButton from './GetStartedButton';

const MenuLogin = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPosition, setMobileMenuPosition] = useState({ top: 0, left: 0 });
  const mobileMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  // menu items to render in desktop nav and mobile dropdown
  const menuItems = [
    { id: 'inicio', label: 'Início', onClick: () => navigate('/inicio') },
    { id: 'quem-somos', label: 'Quem Somos', onClick: () => navigate('/quem-somos') },
    { id: 'nosso-projeto', label: 'Nosso Projeto', onClick: () => navigate('/nosso-projeto') },
    { id: 'seja-pro', label: 'Seja Pro', onClick: () => navigate('/seja-pro') },
    { id: 'contato', label: 'Contato', onClick: () => navigate('/contato') }
  ];

  // Função para calcular a posição do menu mobile
  const calculateMobileMenuPosition = () => {
    if (mobileMenuButtonRef.current) {
      const rect = mobileMenuButtonRef.current.getBoundingClientRect();

      // Position below the button
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

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    // If opening, calculate position after next paint
    if (newState) {
      window.requestAnimationFrame(() => calculateMobileMenuPosition());
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (callback) => {
    return (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      closeMobileMenu();
      callback();
    };
  };

  // Fecha menu mobile ao clicar fora
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
      // Recalculate position
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
    <>
      <header className="site-header">
        <div className="menu-login-root menu-responsive">
          <Logo />

          {/* Mobile hamburger button - replicate Menu.jsx structure */}
          <div className="user-menu-root hamburger-menu-root">
            <button
              ref={mobileMenuButtonRef}
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-haspopup="true"
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            {/* Dropdown balloon replicated from Menu.jsx */}
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
                    <a 
                      href={`#${item.id}`} 
                      className={`menu-login-item ${item.id === 'nosso-projeto' ? 'nosso-projeto' : ''}`}
                      onClick={handleNavigation(item.onClick)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Botão "Comece agora" alinhado à direita */}
          <div className="menu-login-right">
            <GetStartedButton onClick={handleNavigation(() => navigate('/login'))} />
          </div>
        </div>
      </header>
    </>
  );
};

export default MenuLogin;
