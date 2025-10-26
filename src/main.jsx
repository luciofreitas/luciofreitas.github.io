import './shims/process';
import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/reset.css' // Reset CSS primeiro para garantir que não haja margens/paddings
import './styles/index.css'
import './utils/add-region-roles';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

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
