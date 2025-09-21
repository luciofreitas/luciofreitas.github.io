import React, { useEffect, useLayoutEffect, useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import './MenuLogin.css';
import Logo from './Logo';
import GetStartedButton from './GetStartedButton';
import CircularArrowButton from './CircularArrowButton';
import MenuUsuario from './MenuUsuario';
import Toast from './Toast';
import './Toast.css';
import AriaLive from './AriaLive';
import './AriaLive.css';
import Skeleton from './Skeleton';
import './Skeleton.css';

const MenuLogin = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPosition, setMobileMenuPosition] = useState({ top: 0, left: 0 });
  const [toast, setToast] = useState(null);
  const [ariaMessage, setAriaMessage] = useState('');
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  // Force mobile detection on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    // Set initial value
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const mobileMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();
  
  // Authentication context
  const { usuarioLogado, setUsuarioLogado, authLoaded } = useContext(AuthContext) || {};

  // menu items to render in desktop nav and mobile dropdown
  const menuItems = [
    { id: 'inicio', label: 'Início', onClick: () => navigate('/inicio') },
    { id: 'quem-somos', label: 'Quem Somos', onClick: () => navigate('/quem-somos') },
    { id: 'nosso-projeto', label: 'Nosso Projeto', onClick: () => navigate('/nosso-projeto') },
    { id: 'seja-pro', label: 'Seja Pro', onClick: () => navigate('/seja-pro') },
    { id: 'contato', label: 'Contato', onClick: () => navigate('/contato') }
  ];

  // Toast helper functions
  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const setAriaAlert = (message) => {
    setAriaMessage(message);
    setTimeout(() => setAriaMessage(''), 100);
  };

  // User menu handlers
  const handleLogout = () => {
    setUsuarioLogado(null);
    localStorage.removeItem('usuarioLogado');
    showToast('success', 'Logout realizado', 'Você foi desconectado com sucesso');
    setAriaAlert('Logout realizado com sucesso');
    navigate('/inicio');
  };

  const handleProfileClick = () => {
    navigate('/perfil');
  };

  const handleProClick = () => {
    if (usuarioLogado?.isPro) {
      navigate('/versao-pro-assinado');
    } else {
      navigate('/seja-pro');
    }
  };

  const handleConfiguracoesClick = () => {
    navigate('/perfil'); // For now, redirect to profile as settings
  };

  const handleLoginSuccess = () => {
    showToast('success', 'Login realizado', 'Bem-vindo de volta!');
    setAriaAlert('Login realizado com sucesso');
  };

  // Effect to handle successful login (when usuarioLogado changes from null to user)
  const prevUsuarioLogado = useRef();
  useEffect(() => {
    if (prevUsuarioLogado.current === null && usuarioLogado) {
      handleLoginSuccess();
    }
    prevUsuarioLogado.current = usuarioLogado;
  }, [usuarioLogado]);

  // Monitor screen size changes for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

          {/* Botão "Comece agora" ou Menu de Usuário à direita */}
          <div className="menu-login-right" style={{ minWidth: '60px', minHeight: '60px', backgroundColor: 'red', position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
            {/* TESTE SEMPRE RENDERIZADO */}
            <div style={{ width: '50px', height: '50px', backgroundColor: 'green', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
              ✓
            </div>
          </div>
        </div>
      </header>
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
          autoClose={true}
          duration={4000}
        />
      )}
      
      {/* Accessibility announcements */}
      <AriaLive message={ariaMessage} />
    </>
  );
};

export default MenuLogin;
