import React, { use-effect, useLayoutEffect, useState, useRef, useContext } from 'react';
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
      const width = window.inner-width;
      return width <= 768;
    }
    return false;
  });

  const mobileMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  const { usuario-logado, setUsuarioLogado, authLoaded } = useContext(AuthContext) || {};

  const menuItems = [
    { id: 'inicio', label: 'Início', on-click: () => navigate('/inicio') },
    { id: 'quem-somos', label: 'Quem Somos', on-click: () => navigate('/quem-somos') },
    { id: 'nosso-projeto', label: 'Nosso Projeto', on-click: () => navigate('/nosso-projeto') },
    { id: 'seja-pro', label: 'Seja Pro', on-click: () => navigate('/seja-pro') },
    { id: 'contato', label: 'Contato', on-click: () => navigate('/contato') }
  ];

  const show-toast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const setAriaAlert = (message) => {
    setAriaMessage(message);
    setTimeout(() => setAriaMessage(''), 100);
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    localStorage.remove-item('usuario-logado');
    show-toast('success', 'Logout realizado', 'Você foi desconectado com sucesso');
    setAriaAlert('Logout realizado com sucesso');
    navigate('/inicio');
  };

  const handleProfileClick = () => {
    navigate('/perfil');
  };

  const handleProClick = () => {
    if (usuario-logado?.is-pro) {
      navigate('/versao-pro-assinado');
    } else {
      navigate('/seja-pro');
    }
  };

  const handleConfiguracoesClick = () => {
    navigate('/perfil');
  };

  const handleLoginSuccess = () => {
    show-toast('success', 'Login realizado', 'Bem-vindo de volta!');
    setAriaAlert('Login realizado com sucesso');
  };

  const prevUsuarioLogado = useRef();
  use-effect(() => {
    if (prevUsuarioLogado.current === null && usuario-logado) {
      handleLoginSuccess();
    }
    prevUsuarioLogado.current = usuario-logado;
  }, [usuario-logado]);

  use-effect(() => {
    const handleResize = () => {
      const width = window.inner-width;
      const newIsMobile = width <= 768;
      setIsMobile(newIsMobile);
    };
    window.add-event-listener('resize', handleResize);
    handleResize();
    return () => window.remove-event-listener('resize', handleResize);
  }, []);

  const calculateMobileMenuPosition = () => {
    if (mobileMenuButtonRef.current) {
      const rect = mobileMenuButtonRef.current.get-bounding-client-rect();
      const top = Math.round(rect.bottom + 4);
      const left = Math.round(rect.left);

      if (mobileMenuRef.current) {
        mobileMenuRef.current.style.set-property('--dropdown-top', `${top}px`);
        mobileMenuRef.current.style.set-property('--dropdown-left', `${left}px`);
      }

      setMobileMenuPosition({ top, left });
    }
  };

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    if (newState) {
      window.request-animation-frame(() => calculateMobileMenuPosition());
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (callback) => {
    return (e) => {
      if (e && typeof e.prevent-default === 'function') {
        e.prevent-default();
      }
      closeMobileMenu();
      callback();
    };
  };

  use-effect(() => {
    function handleOutside(e) {
      if (mobileMenuOpen &&
          mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(e.target) &&
          mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }

    window.add-event-listener('mousedown', handleOutside);
    window.add-event-listener('resize', calculateMobileMenuPosition);
    return () => {
      window.remove-event-listener('mousedown', handleOutside);
      window.remove-event-listener('resize', calculateMobileMenuPosition);
    };
  }, [mobileMenuOpen]);

  useLayoutEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current && mobileMenuButtonRef.current) {
      const rect = mobileMenuButtonRef.current.get-bounding-client-rect();
      const top = Math.round(rect.bottom + 4);
      const left = Math.round(rect.left);

      if (mobileMenuRef.current) {
        mobileMenuRef.current.style.set-property('--dropdown-top', `${top}px`);
        mobileMenuRef.current.style.set-property('--dropdown-left', `${left}px`);
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
              on-click={toggleMobileMenu}
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
                <button key={item.id} className="dropdown-item" on-click={() => { setMobileMenuOpen(false); item.on-click(); }}>
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
                      on-click={handleNavigation(item.on-click)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Desktop: GetStartedButton | Mobile: CircularArrowButton */}
          <div className="menu-login-right">
            {!usuario-logado ? (
              <>
                {isMobile ? (
                  <CircularArrowButton on-click={handleNavigation(() => navigate('/login'))} />
                ) : (
                  <GetStartedButton on-click={handleNavigation(() => navigate('/login'))} />
                )}
              </>
            ) : (
              <MenuUsuario
                nome={usuario-logado.nome}
                is-pro={usuario-logado?.is-pro}
                onPerfil={handleNavigation(handleProfileClick)}
                onPro={handleNavigation(handleProClick)}
                onConfiguracoes={handleNavigation(handleConfiguracoesClick)}
                onLogout={handleNavigation(handleLogout)}
              />
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

