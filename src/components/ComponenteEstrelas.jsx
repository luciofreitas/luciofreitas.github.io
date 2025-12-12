import React, { useState } from 'react';

const ComponenteEstrelas = ({ guiaId, mediaAtual, totalVotos, votosUsuario, onAvaliar, somenteLeitura = false }) => {
  const [hoverEstrela, setHoverEstrela] = useState(0);
  const jaVotou = votosUsuario[guiaId] !== undefined;

  const handleClick = (estrela) => {
    console.debug('[ComponenteEstrelas] click', { guiaId, estrela, somenteLeitura, jaVotou });
    // Delegate final authorization/duplicate-vote checks to the parent handler.
    if (!somenteLeitura) {
      try {
        onAvaliar(guiaId, estrela);
      } catch (e) {
        console.warn('[ComponenteEstrelas] onAvaliar threw', e);
      }
    }
  };

  const renderEstrela = (indice) => {
    const estrelaBrilhante = indice <= (hoverEstrela || mediaAtual);
    const corEstrela = jaVotou 
      ? (indice <= votosUsuario[guiaId] ? '#FFAB00' : '#d1d5db')
      : (estrelaBrilhante ? '#FFAB00' : '#d1d5db');

    return (
      <button
        key={indice}
        type="button"
        aria-label={`${indice} ${indice === 1 ? 'estrela' : 'estrelas'}`}
        className={`estrela ${!somenteLeitura && !jaVotou ? 'estrela-interativa' : ''}`}
        style={{
          color: corEstrela,
          fontSize: '1.2rem'
        }}
        onClick={() => handleClick(indice)}
        onMouseEnter={() => !somenteLeitura && !jaVotou && setHoverEstrela(indice)}
        onMouseLeave={() => !somenteLeitura && !jaVotou && setHoverEstrela(0)}
      >
        ★
      </button>
    );
  };

  return (
    <div className="sistema-avaliacao">
      <div className="estrelas-container">
        {[1, 2, 3, 4, 5].map(renderEstrela)}
      </div>
      <div className="avaliacao-info">
        <span className="media-nota">{mediaAtual.toFixed(1)}</span>
        <span className="total-votos">({totalVotos} avaliaç{totalVotos !== 1 ? 'ões' : 'ão'})</span>
      </div>
      {jaVotou && (
        <div className="voto-confirmado">
          Sua avaliação: {votosUsuario[guiaId]} ★
        </div>
      )}
    </div>
  );
};

export default ComponenteEstrelas;