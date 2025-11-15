import React, { useState, useRef, useEffect } from 'react';
import './MenuUsuario.css';

function MenuUsuario({ nome, isPro = false, onPerfil, onMeusCarros, onPro, onLogout, photoURL }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [imgError, setImgError] = useState(false);
  const [triedProxy, setTriedProxy] = useState(false);
  const apiBase = (typeof window !== 'undefined') ? (window.__API_BASE || '') : '';

  // Precompute initials and deterministic background color so we can apply
  // the color to the button element itself (ensures visible background ring).
  const computeInitialsAndBg = (fullName) => {
    try {
      const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
      let initials = '';
      if (parts.length === 0) initials = '';
      else if (parts.length === 1) initials = parts[0].charAt(0).toUpperCase();
      else initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();

      const palette = ['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFEB3B','#FFC107','#FF9800','#FF5722'];
      let h = 0;
      const s = String(fullName || 'user');
      for(let i=0;i<s.length;i++){ h = (h<<5) - h + s.charCodeAt(i); h |= 0; }
      const bg = palette[Math.abs(h) % palette.length];
  const idx = Math.abs(h) % palette.length;
  return { initials, bg, idx };
    } catch (e) {
      return { initials: '', bg: '#2196F3' };
    }
  };

  const { initials: _initialsComputed, bg: _bgComputed, idx: _bgIndex } = computeInitialsAndBg(nome || '');
  // Ensure the button element receives the CSS variable and data attribute so
  // styles are visible in the DOM (some environments may omit style prop on spans).
  useEffect(() => {
    try {
      const btn = buttonRef.current;
      if (!btn) return;
      if (!photoURL || imgError) {
        btn.style.setProperty('--avatar-bg', _bgComputed);
        btn.style.backgroundColor = _bgComputed; // ensure visible fallback
        btn.setAttribute('data-bg', _bgComputed);
      } else {
        btn.style.removeProperty('--avatar-bg');
        btn.style.backgroundColor = '';
        try { btn.removeAttribute('data-bg'); } catch(e){}
      }
    } catch (e) {
      // ignore
    }
    // Also insert a dynamic style rule at the end of head to force the background
    // color using !important so other global rules don't override it.
    let styleEl = null;
    try {
      if (!photoURL || imgError) {
        styleEl = document.createElement('style');
        styleEl.setAttribute('data-generated', 'avatar-bg');
        styleEl.textContent = `
          .user-menu-root .user-button.icon-only .user-initials-desktop,
          .user-menu-root .user-button.icon-only .user-initials-mobile,
          .menu-login-root .user-menu-root .user-button.icon-only .user-initials-desktop,
          .menu-login-root .user-menu-root .user-button.icon-only .user-initials-mobile {
            background-color: ${_bgComputed} !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
    } catch (e) { styleEl = null; }

    return () => {
      try { if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl); } catch(e){}
    };
  }, [buttonRef, photoURL, imgError, _bgComputed]);

  // Ensure the spans themselves have inline styles and data attributes so they
  // show up in the DOM (outerHTML) and are detectable by tests/tools.
  useEffect(() => {
    try {
      const btn = buttonRef.current;
      if (!btn) return;
      const desktopSpan = btn.querySelector && btn.querySelector('.user-initials-desktop');
      const mobileSpan = btn.querySelector && btn.querySelector('.user-initials-mobile');
      const styleStr = `background-color: ${_bgComputed}; color: #fff; display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%;`;
      if (desktopSpan) {
        desktopSpan.setAttribute('style', styleStr);
        desktopSpan.setAttribute('data-bg', _bgComputed);
      }
      if (mobileSpan) {
        mobileSpan.setAttribute('style', styleStr);
        mobileSpan.setAttribute('data-bg', _bgComputed);
      }

      return () => {
        try { if (desktopSpan) { desktopSpan.removeAttribute('style'); desktopSpan.removeAttribute('data-bg'); } } catch(e){}
        try { if (mobileSpan) { mobileSpan.removeAttribute('style'); mobileSpan.removeAttribute('data-bg'); } } catch(e){}
      };
    } catch (e) { /* ignore */ }
  }, [buttonRef, _bgComputed, photoURL, imgError]);

  // Keep a simple onError fallback (handled on the <img>) — no preload logic

  // Runtime diagnostics: log computed styles and ancestor transforms to help debug clipping
  

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
          className={`user-button icon-only ${isPro ? 'user-pro' : ''} ${(!photoURL || imgError) ? `avatar-color-${_bgIndex} no-overlay` : ''}`}
          style={(!photoURL || imgError) ? { backgroundColor: _bgComputed } : undefined}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* If photoURL is available, show image avatar; otherwise fallback to icon */}
        {photoURL && !imgError ? (
          <img
            src={photoURL}
            alt={nome ? `Avatar de ${nome}` : 'Avatar do usuário'}
            className="user-avatar"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={(e) => {
              try {
                // If the image fails and it looks like a googleusercontent URL,
                // try once via our server proxy to avoid client-side rate limits.
                const src = e && e.currentTarget && e.currentTarget.src ? String(e.currentTarget.src) : photoURL || '';
                if (!triedProxy && src && /googleusercontent\.com/i.test(src)) {
                  setTriedProxy(true);
                  const prox = `${apiBase}/api/avatar/proxy?url=${encodeURIComponent(src)}`;
                  e.currentTarget.src = prox;
                  return;
                }
              } catch (err) { /* ignore */ }
              setImgError(true);
            }}
          />
        ) : (
          <>
            {/* Inline SVG fallback: circle filled with computed bg and centered initials text.
                Using SVG ensures the fill color is embedded in the DOM and cannot be
                visually interrupted by button pseudo-elements or background overlays. */}
            <svg className="user-initials-desktop" width="44" height="44" viewBox="0 0 44 44" role="img" aria-label={nome ? `Avatar de ${nome}` : 'Avatar'} xmlns="http://www.w3.org/2000/svg">
              <circle cx="22" cy="22" r="20" fill={_bgComputed} />
              <text x="50%" y="50%" textAnchor="middle" dy="0.36em" fontFamily="Montserrat, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" fontWeight="700" fontSize="16" fill="#FFFFFF">{_initialsComputed}</text>
            </svg>

            <svg className="user-initials-mobile" width="36" height="36" viewBox="0 0 36 36" role="img" aria-label={nome ? `Avatar de ${nome}` : 'Avatar'} xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="16" fill={_bgComputed} />
              <text x="50%" y="50%" textAnchor="middle" dy="0.34em" fontFamily="Montserrat, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" fontWeight="700" fontSize="14" fill="#FFFFFF">{(_initialsComputed && _initialsComputed.length > 0) ? _initialsComputed.charAt(0) : ''}</text>
            </svg>
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
