import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useFocusTrap from '../hooks/useFocusTrap';
import './WhatsNewPopup.css';

const WHATS_NEW_VERSION = '2026-01-26-whatsnew-json';
const LS_KEY = 'gs_whatsnew_dismissed';
const DEFAULT_ITEM_TTL_DAYS = 30;

const FALLBACK_CONTENT = {
  title: 'Novidades em breve',
  text: 'Estamos trabalhando sempre para te atender da melhor maneira possivel'
};

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function loadWhatsNewConfig() {
  try {
    const res = await fetch(`/data/whats_new.json?v=${encodeURIComponent(WHATS_NEW_VERSION)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

function normalizeConfig(data) {
  const id = (data && typeof data.id === 'string') ? data.id.trim() : '';
  const active = Boolean(data && data.active);
  const title = (data && typeof data.title === 'string' && data.title.trim()) ? data.title.trim() : 'Novidades';
  const items = Array.isArray(data && data.items) ? data.items : [];

  const normalizedItems = items
    .filter((it) => it && typeof it === 'object')
    .map((it) => ({
      tag: (typeof it.tag === 'string' && it.tag.trim()) ? it.tag.trim() : '',
      title: (typeof it.title === 'string' && it.title.trim()) ? it.title.trim() : '',
      text: (typeof it.text === 'string' && it.text.trim()) ? it.text.trim() : '',
      date: (typeof it.date === 'string' && it.date.trim()) ? it.date.trim() : '',
      ttlDays: (Number.isFinite(it.ttlDays) && it.ttlDays > 0) ? Math.floor(it.ttlDays) : null
    }))
    .filter((it) => it.title || it.text);

  return { id, active, title, items: normalizedItems };
}

function parseMaybeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  // Invalid Date check
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function isItemStillNew(item, now = new Date()) {
  const ttlDays = Number.isFinite(item?.ttlDays) ? item.ttlDays : DEFAULT_ITEM_TTL_DAYS;
  const date = parseMaybeDate(item?.date);
  // Backward-compatible: if no date is provided, keep showing the item.
  if (!date) return true;
  const ageMs = now.getTime() - date.getTime();
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  return ageMs <= ttlMs;
}

function renderTextNoBreakParentheses(text) {
  const value = String(text || '');
  if (!value) return null;

  // Wrap each parenthesized group in a no-wrap span so it won't split across lines.
  // Example: (ex: "filtro de ar") stays together.
  const re = /\([^)]*\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = re.exec(value)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      parts.push(value.slice(lastIndex, start));
    }
    parts.push(
      <span className="whatsnew-nobr" key={`p-${key++}`}>{match[0]}</span>
    );
    lastIndex = end;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
}

export default function WhatsNewPopup({ disabled = false }) {
  const modalRef = useRef(null);
  const openedOnceRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [dismissVersion, setDismissVersion] = useState(WHATS_NEW_VERSION);
  const location = useLocation();

  useFocusTrap(open, modalRef);

  useEffect(() => {
    if (disabled) return;

    // Prevent double-open in React StrictMode (dev)
    if (openedOnceRef.current) return;
    openedOnceRef.current = true;

    const maybeOpen = async () => {
      const href = (typeof window !== 'undefined' && window.location && window.location.href) ? window.location.href : '';
      const isInicio = (location && location.pathname === '/inicio');

      let isReload = false;
      try {
        const navEntry = performance && typeof performance.getEntriesByType === 'function'
          ? performance.getEntriesByType('navigation')[0]
          : null;
        if (navEntry && navEntry.type) isReload = navEntry.type === 'reload';
        // Fallback (deprecated, but still works in some browsers)
        // 1 = TYPE_RELOAD
        if (!isReload && performance && performance.navigation && performance.navigation.type === 1) isReload = true;
      } catch {
        // ignore
      }

      const forceShow = /[?&#]whatsnew=1\b/i.test(href) || (isInicio && isReload);

      const loaded = normalizeConfig(await loadWhatsNewConfig());
      const versionKey = (loaded && loaded.id) ? loaded.id : WHATS_NEW_VERSION;
      setConfig(loaded);
      setDismissVersion(versionKey);

      try {
        const raw = localStorage.getItem(LS_KEY);
        const stored = safeJsonParse(raw);
        if (!forceShow && stored && stored.version === versionKey) return;
      } catch {
        // ignore
      }

      setOpen(true);
    };

    maybeOpen();
  }, [disabled, location]);

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
        JSON.stringify({ version: dismissVersion, dismissedAt: new Date().toISOString() })
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

  const allItems = (config && config.active && Array.isArray(config.items)) ? config.items : [];
  const now = new Date();
  const items = allItems
    .filter((it) => String(it?.tag || '').trim().toLowerCase() === 'novo')
    .filter((it) => isItemStillNew(it, now));
  const hasItems = Boolean(items.length);
  const headerTitle = hasItems ? (config?.title || 'Novidades') : FALLBACK_CONTENT.title;

  return (
    <div className="modal-overlay whatsnew-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className="compat-modal whatsnew-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Novidades"
      >
        <div className="app-compat-header">
          <div className="app-compat-title-wrapper">
            <span className="app-compat-title whatsnew-title">{headerTitle}</span>
          </div>
          <button className="app-compat-close" aria-label="Fechar" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="app-compat-body whatsnew-body">
          {hasItems ? (
            <div className="whatsnew-list" aria-label="Lista de novidades">
              {items.map((item, idx) => (
                <div className="whatsnew-item" key={`${idx}-${item.title || item.text}`}>
                  <div className="whatsnew-item-header">
                    <div className="whatsnew-item-title">{item.title}</div>
                    {item.tag ? <div className="whatsnew-badge">{item.tag}</div> : null}
                  </div>
                  {item.text ? <div className="whatsnew-item-sep" aria-hidden="true" /> : null}
                  {item.text ? (
                    <p className="whatsnew-text whatsnew-item-text" lang="pt-BR">
                      {renderTextNoBreakParentheses(item.text)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="whatsnew-text" lang="pt-BR">{FALLBACK_CONTENT.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
