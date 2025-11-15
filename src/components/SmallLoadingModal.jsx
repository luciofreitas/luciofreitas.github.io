import React from 'react';
import './SmallLoadingModal.css';
import LoadingSpinner from './LoadingSpinner';

export default function SmallLoadingModal({ show = false, text = 'Buscando...' }) {
  if (!show) return null;

  return (
    <div className="small-loading-overlay" role="status" aria-live="polite">
      <div className="small-loading-box">
        <LoadingSpinner size="small" color="primary" />
        <div className="small-loading-text">{text}</div>
      </div>
    </div>
  );
}
