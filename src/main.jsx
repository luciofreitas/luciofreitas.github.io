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
      // If the page is running on GH Pages or another static host, index.html
      // should inject window.__API_BASE. Do not set a build-time value here.
      console.log('[runtime] API base not injected by index.html; leaving unset');
    }
  }
} catch (e) {
  // ignore
}

// NOTE: runtime CSS overrides were intentionally removed so that the project's
// global stylesheet contains fixed spacing values rather than runtime variables.
