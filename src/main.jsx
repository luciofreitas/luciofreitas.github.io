import './shims/process';
import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/reset.css' // Reset CSS primeiro para garantir que não haja margens/paddings
import './styles/global-fonts.css' // Fontes globais
import './styles/index.css'
import './utils/add-region-roles';
import App from './App.jsx'
import { loadRuntimeConfig } from './runtimeConfig';
import { ensureGlossarioColors } from './utils/glossarioColors';

// Lightweight startup instrumentation to measure dev/perceived load times.
try { console.time('[app-timing] module-load'); } catch(e){}

// Bootstrap the app only after fetching runtime configuration. This allows
// the application to obtain dynamic values from `/api/runtime-config` and
// avoids embedding secrets at build time. A fallback to compile-time
// env values remains active inside `loadRuntimeConfig` for compatibility.
;(async function bootstrap() {
  try {
    const cfg = await loadRuntimeConfig();
    if (typeof window !== 'undefined') window.__RUNTIME_CONFIG__ = cfg;
    try { ensureGlossarioColors(); } catch (e) { /* ignore on non-browser env */ }

    // If the runtime config provides an API_URL and the index.html injector didn't
    // set window.__API_BASE, use it as the base for API calls.
    // This is especially important for static hosts (e.g. GitHub Pages) where
    // relative `/api/...` calls would otherwise hit the static origin and fail.
    try {
      if (typeof window !== 'undefined') {
        if (!window.__API_BASE && cfg && cfg.API_URL) {
          const host = window.location && window.location.hostname ? window.location.hostname : '';
          const isLocalHost = host === 'localhost' || host === '127.0.0.1';
          if (!isLocalHost) {
            window.__API_BASE = String(cfg.API_URL).trim();
            if (window.__API_BASE) console.log('[runtime] API base set from runtime config', window.__API_BASE);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // If runtime config fails, we still proceed — loadRuntimeConfig already
    // provides safe fallbacks to import.meta.env.
    console.warn('[runtime] failed to load runtime config, proceeding with fallbacks', e && e.message ? e.message : e);
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
})();

try { console.timeEnd('[app-timing] module-load'); } catch(e){}

// Mark when React render completed (approx). Some tooling may place work after
// render; this gives a quick marker for perceived readiness in both dev/prod.
try { console.time('[app-timing] react-render-start'); } catch(e){}

// Schedule immediate tick to mark after-render (approx)
setTimeout(() => {
  try { console.timeEnd('[app-timing] react-render-start'); } catch(e){}
  try { console.log('[app-timing] runtime marks set'); } catch(e){}
}, 0);

// Set a runtime-only API base if index.html didn't already inject one.
// IMPORTANT: avoid reading import.meta.env.VITE_API_BASE here so the build
// doesn't embed a compile-time fallback like "http://localhost:3001" into
// the production bundle. Production should rely on the index.html injector
// (window.__API_BASE) and local dev should construct localhost at runtime.
try {
  if (typeof window !== 'undefined') {
    if (window.__API_BASE) {
      console.log('[runtime] API base already set to', window.__API_BASE);
    } else {
      // If we're running locally, set the API base to the backend dev server (3001).
      // This avoids accidentally sending API requests to the Vite dev server (5174).
      try {
        if (window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          window.__API_BASE = `${window.location.protocol}//${window.location.hostname}:3001`;
          console.log('[runtime] API base set to local backend', window.__API_BASE);
        } else {
          // For non-local hosts, rely on index.html runtime injector (production)
          console.log('[runtime] API base not injected by index.html; leaving unset');
        }
      } catch (e) {
        console.warn('[runtime] failed to set local API base', e && e.message ? e.message : e);
      }
    }
  }
} catch (e) {
  // ignore
}

// Runtime shim: ensure a global `supabase` property exists to avoid ReferenceError
// in environments where an older bundle or third-party script references the
// bare identifier `supabase` without declaring it. We prefer `window.__SUPABASE_CLIENT`
// if present, otherwise expose null so checks like `typeof supabase` succeed.
try {
  if (typeof window !== 'undefined') {
    if (typeof window.supabase === 'undefined') {
      // prefer any runtime-injected client
      // eslint-disable-next-line no-undef
      window.supabase = (window.__SUPABASE_CLIENT !== undefined) ? window.__SUPABASE_CLIENT : null;
    }
  }
} catch (e) {
  // swallow shim errors, this is non-critical
}
// NOTE: runtime CSS overrides were intentionally removed so that the project's
// global stylesheet contains fixed spacing values rather than runtime variables.
