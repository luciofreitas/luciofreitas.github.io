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

// Forçar a base da API em runtime quando estiver em produção (GitHub Pages)
try {
  const runtimeBase = import.meta.env.VITE_API_BASE;
  if (runtimeBase && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Expor para o código usar: window.__API_BASE
    window.__API_BASE = runtimeBase;
    console.log('[runtime] API base set to', runtimeBase);
  }
} catch (e) {
  // import.meta may not be available in some test environments
}

// NOTE: runtime CSS overrides were intentionally removed so that the project's
// global stylesheet contains fixed spacing values rather than runtime variables.
