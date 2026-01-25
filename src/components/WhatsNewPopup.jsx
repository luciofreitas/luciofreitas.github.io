import React, { useEffect, useRef, useState } from 'react';
import useFocusTrap from '../hooks/useFocusTrap';
import './WhatsNewPopup.css';

const WHATS_NEW_VERSION = '2026-01-25-cards';
const LS_KEY = 'gs_whatsnew_dismissed';

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function WhatsNewPopup({ disabled = false }) {
  const modalRef = useRef(null);
  const openedOnceRef = useRef(false);
  const [open, setOpen] = useState(false);

  useFocusTrap(open, modalRef);

  useEffect(() => {
    if (disabled) return;

    // Prevent double-open in React StrictMode (dev)
    if (openedOnceRef.current) return;
    openedOnceRef.current = true;

    const href = (typeof window !== 'undefined' && window.location && window.location.href) ? window.location.href : '';
    const forceShow = /[?&#]whatsnew=1\b/i.test(href);

    try {
      const raw = localStorage.getItem(LS_KEY);
      const data = safeJsonParse(raw);
      if (!forceShow && data && data.version === WHATS_NEW_VERSION) return;
    } catch {
      // ignore
    }

    setOpen(true);
  }, [disabled]);

  useEffect(() => {
    if (!open) return undefined;

    // Lock background scroll when modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const persistDismiss = () => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ version: WHATS_NEW_VERSION, dismissedAt: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    persistDismiss();
    setOpen(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      handleClose();
    }
  };

  if (!open || disabled) return null;

  return (
    <div className="modal-overlay whatsnew-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className="compat-modal whatsnew-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Aviso"
      >
        <div className="app-compat-header">
          <div className="app-compat-title-wrapper">
            <span className="app-compat-title whatsnew-title">Novidades</span>
          </div>
          <button className="app-compat-close" aria-label="Fechar" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="app-compat-body whatsnew-body">
          <p className="whatsnew-text">
            <span className="whatsnew-sub">Refinando e lançando atualizações.</span>
            <span className="whatsnew-highlight">Novidades em breve!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
