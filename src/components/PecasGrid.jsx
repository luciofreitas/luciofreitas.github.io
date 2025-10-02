import React from 'react';
import PecaCard from './PecaCard';
import './PecasGrid.css';

function PecasGrid({ pecas, onViewCompatibility, onViewDetails }) {
  if (!pecas || pecas.length === 0) {
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
