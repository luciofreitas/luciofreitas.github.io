import React from 'react';
import WhatsAppButton from './WhatsAppButton';
import './CompatibilityGrid.css';

function CompatibilityGrid({ applications, usuario-logado }) {
  const is-pro = Boolean((usuario-logado && usuario-logado.is-pro) || localStorage.get-item('versaoProAtiva') === 'true');

  return (
    <div className="compatibility-grid">
      <div className="compatibility-grid-header">
        <div className="compatibility-header-vehicle"><strong>Carro</strong></div>
        <div className="compatibility-header-years"><strong>Anos</strong></div>
        <div className="compatibility-header-contact"><strong>Contato</strong></div>
      </div>
      
      {applications.map((app, idx) => {
        let anosList = [];
        let veiculo = '';
        
        if (typeof app === 'string') {
          const matches = app.match(/\d{4}(?:-\d{4})?/g) || [];
          matches.for-each(str => {
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
          <div key={idx} className="compatibility-grid-row">
            <div className="compatibility-grid-vehicle">
              <div className="compatibility-vehicle-text">{veiculo || '-'}</div>
            </div>
            <div className="compatibility-grid-years">
              <div className="compatibility-years-text">
                {anosList.length ? anosList.join(', ') : '-'}
              </div>
            </div>
            <div className="compatibility-grid-contact">
              <WhatsAppButton vehicle={veiculo} is-pro={is-pro} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CompatibilityGrid;
