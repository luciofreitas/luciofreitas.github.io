import React, { useState } from 'react';

const ComponenteEstrelas = ({ guiaId, mediaAtual, totalVotos, votosUsuario, onAvaliar, somenteLeitura = false }) => {
  const [hoverEstrela, setHoverEstrela] = useState(0);
  const jaVotou = votosUsuario[guiaId] !== undefined;

  const handleClick = (estrela) => {
    if (!somenteLeitura && !jaVotou) {
      onAvaliar(guiaId, estrela);
    }
  };

  const renderEstrela = (indice) => {
    const estrelaBrilhante = indice <= (hoverEstrela || mediaAtual);
    const corEstrela = jaVotou 
      ? (indice <= votosUsuario[guiaId] ? '#FFAB00' : '#d1d5db')
      : (estrelaBrilhante ? '#FFAB00' : '#d1d5db');

    return (
      <span
        key={indice}
        className={`estrela ${!somenteLeitura && !jaVotou ? 'estrela-interativa' : ''}`}
        style={{ 
          color: corEstrela,
          fontSize: '1.2rem',
          cursor: !somenteLeitura && !jaVotou ? 'pointer' : 'default'
        }}
        onClick={() => handleClick(indice)}
        onMouseEnter={() => !somenteLeitura && !jaVotou && setHoverEstrela(indice)}
        onMouseLeave={() => !somenteLeitura && !jaVotou && setHoverEstrela(0)}
      >
        ★
      </span>
    );
  };

  return (
    <div className="sistema-avaliacao">
      <div className="estrelas-container">
        {[1, 2, 3, 4, 5].map(renderEstrela)}
      </div>
      <div className="avaliacao-info">
        <span className="media-nota">{mediaAtual.toFixed(1)}</span>
        <span className="total-votos">({totalVotos} avaliação{totalVotos !== 1 ? 'ões' : ''})</span>
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