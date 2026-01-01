import React from 'react';

export default function SeparadorCentral({ color = '#eee', style = {} }) {
  // Centralização vertical absoluta, mas deslocado mais para baixo
  return (
    <div
      className="separador-central"
      style={{
        position: 'absolute',
        left: '50%',
        top: '60%', // move mais para baixo
        transform: 'translate(-50%, -50%)',
        width: 2,
        height: '70%',
        minHeight: 120,
        maxHeight: 400,
        background: color,
        zIndex: 2,
        borderRadius: 2,
        ...style,
      }}
    />
  );
}
