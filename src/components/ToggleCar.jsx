import React from 'react';

export default function ToggleCar({ on = false, onClick = () => {}, ariaLabel }) {
  return (
    <span
      className={`car-toggle ${on ? 'headlight-on' : 'headlight-off'}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-label={ariaLabel || (on ? 'Ocultar senha' : 'Mostrar senha')}
    >
      <svg width="32" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: on ? '#3B82F6' : '#4A5568' }}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="currentColor" />
        <circle cx="12" cy="12" r="3" fill={on ? '#FFFFFF' : '#CBD5E0'} />
      </svg>
    </span>
  );
}
