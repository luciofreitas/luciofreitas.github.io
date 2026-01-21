import React, { useState } from 'react';
import './CompatibilityGrid.css';
import { comparePtBr } from '../utils/sortUtils';

function CompatibilityRow({ veiculo, anosList }) {
  const uniqueYears = Array.from(new Set(anosList.map(String))).sort(comparePtBr);
  const [selectedYear, setSelectedYear] = useState(uniqueYears.length ? uniqueYears[0] : '');

  return (
    <div className="compatibility-grid-row">
      <div className="compatibility-grid-vehicle">
        <div className="compatibility-vehicle-text">{veiculo || '-'}</div>
      </div>
      <div className="compatibility-grid-years">
        {uniqueYears.length ? (
          <select
            className="compatibility-year-select"
            aria-label={`Selecionar ano do veículo de referência para ${veiculo}`}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {uniqueYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        ) : (
          <div className="compatibility-years-text">-</div>
        )}
      </div>
    </div>
  );
}

function CompatibilityGrid({ applications, usuarioLogado, activeCarLabel }) {
  return (
    <div className="compatibility-grid">
      <div className="compatibility-grid-context" role="note">
        {activeCarLabel
          ? <>Compatível com: <strong>{activeCarLabel}</strong>. A lista abaixo mostra veículos de referência que usam a mesma peça/código.</>
          : <>Lista de veículos de referência que usam a mesma peça/código.</>}
      </div>

      <div className="compatibility-grid-header">
        <div className="compatibility-header-vehicle"><strong>Veículo (referência)</strong></div>
        <div className="compatibility-header-years"><strong>Ano</strong></div>
      </div>

      {applications.map((app, idx) => {
        let anosList = [];
        let veiculo = '';

        if (typeof app === 'string') {
          const matches = app.match(/\d{4}(?:-\d{4})?/g) || [];
          matches.forEach(str => {
            if (str.includes('-')) {
              const [start, end] = str.split('-').map(Number);
              for (let y = start; y <= end; y++) anosList.push(String(y));
            } else anosList.push(str);
          });
          veiculo = app.replace(/\d{4}(-\d{4})?/g, '').replace(/--/g, '').replace(/\(|\)|,/g, '').replace(/-+/g, '').trim();
        } else if (typeof app === 'object') {
          veiculo = app.vehicle || '';
          anosList = app.years || [];
        }

        return (
          <CompatibilityRow key={idx} veiculo={veiculo} anosList={anosList} />
        );
      })}
    </div>
  );
}

export default CompatibilityGrid;
