import React, { useEffect, useLayoutEffect, useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import './MenuLogin.css';
import Logo from './Logo';
import GetStartedButton from './GetStartedButton';
import CircularArrowButton from './CircularArrowButton';
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
      const width = window.innerWidth;
      return width <= 768;
    }
    return false;
  });

  const mobileMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  const { usuarioLogado, setUsuarioLogado, authLoaded } = useContext(AuthContext) || {};

  const menuItems = [
    { id: 'inicio', label: 'Início', onClick: () => navigate('/inicio') },
    { id: 'catalogo', label: 'Catálogo de Peças', onClick: () => navigate('/buscar-pecas') },
    { id: 'quem-somos', label: 'Quem Somos', onClick: () => navigate('/quem-somos') },
    { id: 'nosso-projeto', label: 'Nosso Projeto', onClick: () => navigate('/nosso-projeto') },
    { id: 'seja-pro', label: 'Seja Pro', onClick: () => navigate('/seja-pro') },
    { id: 'contato', label: 'Contato', onClick: () => navigate('/contato') }
  ];

  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const setAriaAlert = (message) => {
    setAriaMessage(message);
    setTimeout(() => setAriaMessage(''), 100);
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    localStorage.removeItem('usuario-logado');
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
    navigate('/perfil');
  };

  const handleLoginSuccess = () => {
    showToast('success', 'Login realizado', 'Bem-vindo de volta!');
    setAriaAlert('Login realizado com sucesso');
  };

  const prevUsuarioLogado = useRef();
  useEffect(() => {
    if (prevUsuarioLogado.current === null && usuarioLogado) {
      handleLoginSuccess();
    }
    prevUsuarioLogado.current = usuarioLogado;
  }, [usuarioLogado]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newIsMobile = width <= 768;
      setIsMobile(newIsMobile);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateMobileMenuPosition = () => {
    if (mobileMenuButtonRef.current) {
      const rect = mobileMenuButtonRef.current.getBoundingClientRect();
      const top = Math.round(rect.bottom + 4);
      const left = Math.round(rect.left);

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

  useLayoutEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current && mobileMenuButtonRef.current) {
      const rect = mobileMenuButtonRef.current.getBoundingClientRect();
      const top = Math.round(rect.bottom + 4);
      const left = Math.round(rect.left);

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

          {/* Mobile hamburger button */}
          <div className="user-menu-root">
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

            {/* Dropdown mobile menu */}
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
                    <button
                      className={`menu-login-item ${item.id === 'nosso-projeto' ? 'nosso-projeto' : ''}`}
                      onClick={handleNavigation(item.onClick)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Desktop: GetStartedButton | Mobile: CircularArrowButton */}
          <div className="menu-login-right">
            {isMobile ? (
              <CircularArrowButton onClick={() => navigate('/login')} />
            ) : (
              <GetStartedButton onClick={() => navigate('/login')} />
            )}
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

