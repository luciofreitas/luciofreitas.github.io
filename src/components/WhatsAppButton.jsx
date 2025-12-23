import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import './WhatsAppButton.css';

function WhatsAppButton({ vehicle, isPro }) {
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Olá, tenho interesse na peça para: ' + (vehicle || ''))}`;

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
    </div>
  );
}

export default WhatsAppButton;
