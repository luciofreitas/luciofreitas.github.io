import React, { useRef, useState } from 'react';
import './WhatsAppButton.css';
import TooltipPortal from './TooltipPortal';

function WhatsAppButton({ vehicle, isPro }) {
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Olá, tenho interesse na peça para: ' + (vehicle || ''))}`;
  const padlockRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const showTooltip = () => setTooltipVisible(true);
  const hideTooltip = () => setTooltipVisible(false);

  return (
    <div className="whatsapp-button-container">
      <div className="whatsapp-button-wrapper">
        <a
          className="whatsapp-button"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Contato via WhatsApp: ${vehicle || ''}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {/* Simplified WhatsApp icon path (valid) */}
            <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.37 0 0 5.37 0 12c0 2.11.55 4.09 1.52 5.83L0 24l6.39-1.65A11.95 11.95 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.24-6.18-3.48-8.52zM12 21.5c-1.2 0-2.38-.26-3.44-.75l-.25-.11-3.79.98.97-3.06-.17-.27A9.5 9.5 0 0112 3.5c5.25 0 9.5 4.25 9.5 9.5S17.25 22.5 12 22.5z" />
            <path d="M17.06 14.34c-.31-.16-1.83-.9-2.11-1-.28-.11-.48-.16-.68.16s-.78 1-.95 1.19c-.17.19-.34.21-.66.07a6.77 6.77 0 01-2-1.23 7.02 7.02 0 01-1.28-1.58c-.13-.22 0-.34.09-.45.09-.09.2-.21.3-.32.1-.11.13-.19.2-.32.07-.13.04-.24-.02-.35-.07-.11-.68-1.64-.93-2.24-.24-.59-.48-.51-.66-.52l-.56-.01c-.18 0-.47.07-.72.35s-.94.92-.94 2.24.96 2.6 1.09 2.78c.13.19 1.87 2.86 4.53 3.9 2.66 1.04 2.66.69 3.14.65.48-.04 1.83-.74 2.09-1.45.26-.71.26-1.32.18-1.45-.08-.13-.28-.19-.59-.35z" fill="#fff" />
          </svg>
        </a>
        {!isPro && <div className="whatsapp-button-blur" />}
      </div>

      {!isPro && (
        <div
          className="whatsapp-tooltip"
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <div className="whatsapp-tooltip-icon" ref={padlockRef} onFocus={showTooltip} onBlur={hideTooltip} tabIndex={0}>
            <img src="./padlock.png" alt="Cadeado" className="whatsapp-padlock" />
          </div>

          {/* Render tooltip into document.body via portal to escape stacking contexts */}
          <TooltipPortal anchorRef={padlockRef} visible={tooltipVisible}>
            Seja Pro, para liberar o contato da oficina
          </TooltipPortal>
        </div>
      )}
    </div>
  );
}

export default WhatsAppButton;
