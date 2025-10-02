import React from 'react';
import PecaCard from './PecaCard';
import './PecasGrid.css';

function PecasGrid({ pecas, onViewCompatibility, onViewDetails }) {
  console.log('🎯 PecasGrid recebeu:', { pecas, quantidade: pecas?.length });
  
  if (!pecas || pecas.length === 0) {
    console.warn('⚠️ PecasGrid: sem peças para renderizar');
    return (
      <div className="pecas-grid-empty">
        <p>Nenhuma peça encontrada para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="pecas-grid">
      {pecas.map(peca => (
        <PecaCard 
          key={peca.id} 
          peca={peca} 
          onViewCompatibility={onViewCompatibility}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

export default PecasGrid;
