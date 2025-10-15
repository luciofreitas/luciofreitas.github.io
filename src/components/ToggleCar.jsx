import React from 'react';

export default function ToggleCar({ on = false, onClick = () => {}, ariaLabel }) {
  return (
    <button
      type="button"
      className={`car-toggle ${on ? 'headlight-on' : 'headlight-off'}`}
      onClick={onClick}
      aria-label={ariaLabel || (on ? 'Ocultar senha' : 'Mostrar senha')}
    >
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Car main body */}
        <path d="M28 8c0-1.1-.9-2-2-2h-2l-1-2c-.5-.9-1.4-1.5-2.4-1.5H11.4c-1 0-1.9.6-2.4 1.5l-1 2H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h1v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h12v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h1c1.1 0 2-.9 2-2V8z" fill={on ? '#3B82F6' : '#4A5568'} className="car-body"/>
        {/* Car roof/windows */}
        <path d="M24 6H8l1.5-1.5c.3-.3.7-.5 1.1-.5h9.8c.4 0 .8.2 1.1.5L24 6z" fill={on ? '#1E40AF' : '#2D3748'} className="car-roof"/>
        {/* Front windshield */}
        <path d="M10.5 4.5L9 6h3l1-1.5h-2.5z" fill="#63B3ED" opacity="0.3"/>

        {/* Wheels with rims */}
        <circle cx="9" cy="16" r="2.5" fill="#2D3748"/>
        <circle cx="9" cy="16" r="1.5" fill={on ? '#60A5FA' : '#718096'} className="wheel-rim"/>
        <circle cx="23" cy="16" r="2.5" fill="#2D3748"/>
        <circle cx="23" cy="16" r="1.5" fill={on ? '#60A5FA' : '#718096'} className="wheel-rim"/>

        {/* Front grille */}
        <rect x="4" y="9" width="2" height="4" fill={on ? '#1E40AF' : '#2D3748'} className="car-grille"/>

        {/* Headlights */}
        <circle cx="5" cy="10" r="2" fill={on ? '#FED7AA' : '#E2E8F0'} className="headlight-main"/>

        {/* Headlight beam effect when on */}
        {on && (
          <>
            <ellipse cx="2" cy="10" rx="4" ry="6" fill="#FED7AA" opacity="0.15" className="headlight-beam"/>
            <circle cx="5" cy="10" r="2.8" fill="#FBBF24" opacity="0.25" className="headlight-glow-1"/>
            <circle cx="5" cy="10" r="2.2" fill="#F59E0B" opacity="0.4" className="headlight-glow-2"/>
            <circle cx="5" cy="10" r="1.3" fill="#FCD34D" className="headlight-bright"/>

            {/* Short radial strokes (rays) coming out of the headlight to emphasize light */}
            <g className="headlight-rays" stroke="#FDE68A" strokeWidth="0.8" strokeLinecap="round" opacity="0.95">
              <line x1="7" y1="9" x2="11" y2="7" className="ray ray-1" />
              <line x1="7" y1="10" x2="12" y2="10" className="ray ray-2" />
              <line x1="7" y1="11" x2="11" y2="13" className="ray ray-3" />
              <line x1="6" y1="8.2" x2="9" y2="6" className="ray ray-4" />
              <line x1="6" y1="11.8" x2="9" y2="14" className="ray ray-5" />
            </g>
          </>
        )}

        {/* Secondary headlight/indicator */}
        <circle cx="5" cy="13.5" r="0.8" fill={on ? '#FEF3C7' : '#CBD5E0'}/>

        {/* Car details - door handle */}
        <rect x="15" y="11" width="1" height="0.5" fill={on ? '#1E40AF' : '#2D3748'} className="door-handle"/>

        {/* Side mirror */}
        <ellipse cx="7.5" cy="8.5" rx="0.8" ry="0.5" fill={on ? '#3B82F6' : '#4A5568'} className="side-mirror"/>
      </svg>
    </button>
  );
}

