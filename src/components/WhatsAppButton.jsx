import React, { useRef, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import './WhatsAppButton.css';
import TooltipPortal from './TooltipPortal';
import padlockIcon from '/images/padlock.png';

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
          <FaWhatsapp />
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
            <img src={padlockIcon} alt="Cadeado" className="whatsapp-padlock" />
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
