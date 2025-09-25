import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './reset.css' // Reset CSS primeiro para garantir que não haja margens/paddings
import './index.css'
import './utils/add-region-roles';
import App from './App.jsx'

createRoot(document.get-element-by-id('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// NOTE: runtime CSS overrides were intentionally removed so that the project's
// global stylesheet contains fixed spacing values rather than runtime variables.
