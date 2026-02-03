import React, { useContext, useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import './MenuLogin.css';
import Logo from './Logo';
import MenuUsuario from './MenuUsuario';
import CircularArrowButton from './CircularArrowButton';

function Menu() {
  // debug log removed
  const [hideMenu, setHideMenu] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPosition, setMobileMenuPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });
  const mobileMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();
  const { usuarioLogado, setUsuarioLogado } = useContext(AuthContext) || {};
  const role = String((usuarioLogado && usuarioLogado.role) || '').toLowerCase();
  const isCompaniesAdmin = role === 'companies_admin';
  const isAdmin = role === 'admin';
  const proActive = Boolean(usuarioLogado && (usuarioLogado.isPro || usuarioLogado.is_pro)) || localStorage.getItem('versaoProAtiva') === 'true';
  const headerRef = useRef(null);

  // shared menu items to render in desktop nav and mobile dropdown
  const menuItems = isCompaniesAdmin
    ? [
      {
        id: 'admin-companies',
        label: 'Admin Empresas',
        onClick: () => navigate('/admin/companies')
      }
    ]
    : [
    {
      id: 'buscar',
      label: 'Buscar Peças',
      onClick: () => navigate('/buscar-pecas')
    },
    { id: 'tabela-fipe', label: 'Tabela FIPE', onClick: () => navigate('/tabela-fipe') },
    { id: 'recalls', label: 'Recalls', onClick: () => navigate('/recalls') },
    { id: 'historico', label: 'Histórico de Manutenção', onClick: () => navigate('/historico-manutencao') },
    { id: 'guias', label: 'Guias', onClick: () => navigate('/guias') },
    { id: 'contato', label: 'Contato/Feedback', onClick: () => navigate('/contato-logado') },
    ...(isAdmin ? [{ id: 'admin-companies', label: 'Admin Empresas', onClick: () => navigate('/admin/companies'), destacado: true }] : [])
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

  // Monitor screen size changes for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função para calcular a posição do menu mobile EXATAMENTE como MenuUsuario
  const calculateMobileMenuPosition = () => {
    if (mobileMenuButtonRef.current) {
      const rect = mobileMenuButtonRef.current.getBoundingClientRect();

      // Position below the button like MenuUsuario.jsx does
      const top = Math.round(rect.bottom + 4); // Small gap below the button
      const left = Math.round(rect.left); // Align left edge with hamburger icon

      // Set CSS custom properties for positioning
      if (mobileMenuRef.current) {
        if (!isMobile) {
          mobileMenuRef.current.style.setProperty('--dropdown-top', `${top}px`);
          mobileMenuRef.current.style.setProperty('--dropdown-left', `${left}px`);
        } else {
          try {
            mobileMenuRef.current.style.removeProperty('--dropdown-top');
            mobileMenuRef.current.style.removeProperty('--dropdown-left');
          } catch (e) { /* ignore */ }

          // Mobile: align under hamburger button using its rect (same as avatar menu)
          try {
            const btnRect = mobileMenuButtonRef.current.getBoundingClientRect();
            const HAMBURGER_VERTICAL_ADJUST = 6; // pixels
            const topPx = Math.round(btnRect.bottom - HAMBURGER_VERTICAL_ADJUST);
            const leftPx = Math.round(btnRect.left);
            try {
              mobileMenuRef.current.style.setProperty('top', `${topPx}px`, 'important');
            } catch (e) {
              mobileMenuRef.current.style.top = `${topPx}px`;
            }
            try {
              mobileMenuRef.current.style.setProperty('left', `${leftPx}px`, 'important');
            } catch (e) {
              mobileMenuRef.current.style.left = `${leftPx}px`;
            }
            try {
              mobileMenuRef.current.style.setProperty('right', 'auto', 'important');
            } catch (e) {
              mobileMenuRef.current.style.right = 'auto';
            }
          } catch (err) { /* ignore */ }
        }
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
      // Recalculate position similar to MenuUsuario.jsx
      const rect = mobileMenuButtonRef.current.getBoundingClientRect();
      const top = Math.round(rect.bottom + 4); // Position below button
      const left = Math.round(rect.left); // Align left edge with hamburger icon

      // Set CSS custom properties for positioning
      try {
        if (!isMobile) {
          mobileMenuRef.current.style.setProperty('--dropdown-top', `${top}px`);
          mobileMenuRef.current.style.setProperty('--dropdown-left', `${left}px`);
        } else {
          try {
            mobileMenuRef.current.style.removeProperty('--dropdown-top');
            mobileMenuRef.current.style.removeProperty('--dropdown-left');
          } catch (e) { /* ignore */ }
          // Mobile explicit positioning: align under the button (same as avatar menu)
          try {
            const btnRect = mobileMenuButtonRef.current.getBoundingClientRect();
            const topPx = Math.round(btnRect.bottom);
            const leftPx = Math.round(btnRect.left);
            mobileMenuRef.current.style.top = `${topPx}px`;
            mobileMenuRef.current.style.left = `${leftPx}px`;
            mobileMenuRef.current.style.right = 'auto';
          } catch (err) { /* ignore */ }
        }
      } catch (err) {
        // ignore if style manipulation fails in some environments
      }

      setMobileMenuPosition({ top, left });
    }
  }, [mobileMenuOpen]);

  return (
    <header ref={headerRef} className="site-header menu-login">
      <div className="menu-login-root menu-responsive">
        {/* Use the shared Logo component (restored) */}
        <Logo usuarioLogado={usuarioLogado} />

  {/* Mobile hamburger button - only when there are nav items */}
  {menuItems.length > 0 && (
  <div className="user-menu-root">
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
            className={`user-dropdown mobile-nav-dropdown ${mobileMenuOpen ? 'open' : 'closed'}`}
            role="menu"
            aria-hidden={!mobileMenuOpen}
            // ensure element is truly non-interactive when closed
            hidden={!mobileMenuOpen}
            {...(!mobileMenuOpen ? { inert: 'true' } : {})}
          >
            {menuItems.map(item => (
              <button
                key={item.id}
                className="dropdown-item"
                onClick={() => { setMobileMenuOpen(false); if (typeof item.onClick === 'function') item.onClick(); }}
                // disable buttons when the dropdown is closed so they cannot be focused or clicked
                disabled={!mobileMenuOpen}
                tabIndex={mobileMenuOpen ? 0 : -1}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Navigation menu (desktop) */}
        {menuItems.length > 0 && (
          <div className="menu-login-center">
            <nav className="menu-nav">
              <ul className="menu-list">
                {menuItems.map(item => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className={`menu-login-item ${item.destacado ? 'destacado' : ''}`} onClick={handleNavigation(item.onClick)}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        {/* NOTE: mobile dropdown uses the replicated user-dropdown earlier; no separate mobile-menu-dropdown required */}

        <div className="menu-login-right">
          {!usuarioLogado ? (
            // SEMPRE CircularArrowButton - tanto mobile quanto desktop
            <CircularArrowButton onClick={handleNavigation(() => navigate('/login'))} />
          ) : (
            <MenuUsuario
              nome={usuarioLogado?.nome}
               photoURL={usuarioLogado?.photoURL || usuarioLogado?.photo_url || null}
              isPro={proActive}
              restricted={isCompaniesAdmin}
              onPerfil={handleNavigation(() => navigate('/perfil'))}
              onMeusCarros={handleNavigation(() => navigate('/meus-carros'))}
              onPro={handleNavigation(() => navigate(proActive ? '/versao-pro-assinado' : '/versao-pro'))}
              onConfiguracoes={handleNavigation(() => navigate('/configuracoes'))}
              onLogout={handleNavigation(async () => {
                // Sign out from third-party auth providers first so the auth listener
                // doesn't immediately re-populate the user session.
                try {
                  // Supabase client (frontend) may or may not be configured
                  const { default: supabase } = await import('../supabase');
                  if (supabase && supabase.auth && typeof supabase.auth.signOut === 'function') {
                    try { await supabase.auth.signOut(); } catch(e) { /* ignore */ }
                  }
                } catch(e) { /* ignore missing supabase module */ }

                try {
                  const firebase = await import('firebase/auth');
                  const { signOut } = firebase;
                  const { auth } = await import('../firebase');
                  if (typeof signOut === 'function' && auth) {
                    try { await signOut(auth); } catch(e) { /* ignore */ }
                  }
                } catch(e) { /* ignore if firebase not configured */ }

                // Clear local app state/storage and navigate to login
                setUsuarioLogado(null);
                try { localStorage.removeItem('usuario-logado'); } catch (err) {}
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
