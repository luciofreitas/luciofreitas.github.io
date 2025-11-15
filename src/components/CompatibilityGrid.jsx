import React, { useState } from 'react';
import './CompatibilityGrid.css';

function CompatibilityRow({ veiculo, anosList }) {
  const uniqueYears = Array.from(new Set(anosList.map(String))).sort();
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
            aria-label={`Selecionar ano para ${veiculo}`}
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

function CompatibilityGrid({ applications, usuarioLogado }) {
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  return (
    <div className="compatibility-grid">
      <div className="compatibility-grid-header">
        <div className="compatibility-header-vehicle"><strong>Carro</strong></div>
        <div className="compatibility-header-years"><strong>Anos</strong></div>
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
