import React, { useMemo, useState, useRef, useEffect } from 'react';
import './MenuUsuario.css';

function MenuUsuario({ nome, isPro = false, onPerfil, onMeusCarros, onPro, onConfiguracoes, onLogout, photoURL, restricted = false }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [imgError, setImgError] = useState(false);
  const [triedProxy, setTriedProxy] = useState(false);
  const apiBase = (typeof window !== 'undefined') ? (window.__API_BASE || '') : '';

  const formatDisplayName = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const s = raw.replace(/\s+/g, ' ');
    const lowerWords = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
    return s
      .split(' ')
      .map((part, idx) => {
        if (!part) return '';
        const lower = part.toLocaleLowerCase('pt-BR');
        if (idx > 0 && lowerWords.has(lower)) return lower;
        // If the user typed the whole word in UPPERCASE, convert to Title Case.
        const isAllUpper = part === part.toLocaleUpperCase('pt-BR');
        const rest = isAllUpper ? part.slice(1).toLocaleLowerCase('pt-BR') : part.slice(1);
        return part.charAt(0).toLocaleUpperCase('pt-BR') + rest;
      })
      .join(' ')
      .trim();
  };

  const displayName = formatDisplayName(nome);

  const isRestricted = useMemo(() => {
    try { return Boolean(restricted); } catch (e) { return false; }
  }, [restricted]);

  const normalizedPhotoURL = (() => {
    const raw = (photoURL == null) ? '' : String(photoURL).trim();
    if (!raw) return null;
    const lowered = raw.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined') return null;
    return raw;
  })();

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

  const { initials: _initialsComputed, bg: _bgComputed } = computeInitialsAndBg(nome || '');
  const fallbackInitial = String(_initialsComputed || '').trim().toUpperCase().charAt(0);

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
          className={`user-button icon-only ${isPro ? 'user-pro' : ''} ${(!normalizedPhotoURL || imgError) ? 'no-overlay' : ''}`}
          style={{ '--avatar-bg': _bgComputed }}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* If photoURL is available, show image avatar; otherwise fallback to icon */}
        {normalizedPhotoURL && !imgError ? (
          <img
            src={normalizedPhotoURL}
            alt={displayName ? `Avatar de ${displayName}` : 'Avatar do usuário'}
            className="user-avatar"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={(e) => {
              try {
                // If the image fails and it looks like a googleusercontent URL,
                // try once via our server proxy to avoid client-side rate limits.
                const src = e && e.currentTarget && e.currentTarget.src ? String(e.currentTarget.src) : normalizedPhotoURL || '';
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
          <span className="user-avatar-fallback" aria-hidden="true">{fallbackInitial}</span>
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
            <div className="dropdown-user-name-row">Olá, {displayName || nome}</div>
            {isPro && (
              <div className="dropdown-user-subtitle">Assinante Pro</div>
            )}
          </div>

          {!isRestricted && (
            <>
              {/* <button className="dropdown-item" onClick={() => { setOpen(false); onPerfil(); }}>Perfil</button> */}
              <button className="dropdown-item" onClick={() => { setOpen(false); onMeusCarros(); }}>Meus Carros</button>
              <button className="dropdown-item" onClick={() => { setOpen(false); onPro(); }}>Versão Pro</button>
              {typeof onConfiguracoes === 'function' && (
                <button className="dropdown-item" onClick={() => { setOpen(false); onConfiguracoes(); }}>Configurações</button>
              )}
            </>
          )}

          <button className="dropdown-item dropdown-item-logout" onClick={() => { setOpen(false); onLogout(); }}>Sair</button>
        </div>
      )}
    </div>
  );
}

export default MenuUsuario;
