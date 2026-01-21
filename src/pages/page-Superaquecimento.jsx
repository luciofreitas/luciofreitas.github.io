import React, { useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuLogin } from '../components';
import { AuthContext } from '../App';
import '../styles/pages/page-Superaquecimento.css';

export default function Superaquecimento() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const navSections = useMemo(
    () => [
      { id: 'na-hora', label: 'Na hora' },
      { id: 'sinais', label: 'Sinais' },
      { id: 'checklist', label: 'Checklist' },
      { id: 'causas', label: 'Causas' },
      { id: 'pecas', label: 'Peças' }
    ],
    []
  );

  const [expandedCards, setExpandedCards] = useState({
    naHora: true,
    sinais: true,
    checklist: true,
    causas: false,
    pecas: true
  });

  const toggleCard = (key) => setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      try { el.focus({ preventScroll: true }); } catch { /* ignore */ }
    }, 200);
  };

  const onToggleKeyDown = (e, key) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    toggleCard(key);
  };

  const goToCatalog = () => {
    navigate('/buscar-pecas');
    window.setTimeout(() => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* ignore */ }
    }, 150);
  };

  return (
    <>
      {usuarioLogado ? <Menu /> : <MenuLogin />}

      <div className="page-wrapper menu-page supera-page" id="topo" tabIndex={-1}>
        <div className="page-content">
          <div className="supera-hero">
            <h2 className="page-title">Carro esquentando (superaquecimento)</h2>
            <p className="page-subtitle">
              O que fazer na hora, como identificar a causa e quais peças normalmente resolvem — do jeito seguro.
            </p>
            <div className="supera-hero-cta">
              <button className="supera-cta" onClick={goToCatalog}>Buscar peças no catálogo →</button>
            </div>
          </div>

          <nav className="guia-mobile-nav" aria-label="Navegação do guia">
            <div className="guia-mobile-nav-title">Navegar</div>
            <div className="guia-mobile-nav-pills">
              {navSections.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className="guia-mobile-nav-pill"
                  onClick={() => scrollToSection(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </nav>

          <section className="guia-section" id="na-hora" tabIndex={-1}>
            <h3 className="guia-section-title">O que fazer na hora (sem piorar o motor)</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.naHora ? 'true' : 'false'}
                aria-controls="supera-card-na-hora"
                onClick={() => toggleCard('naHora')}
                onKeyDown={(e) => onToggleKeyDown(e, 'naHora')}
              >
                <div>
                  <div className="guia-card-title">Passo a passo rápido</div>
                  <div className="guia-card-subtitle">Serve pra maioria dos carros</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.naHora && (
                <div className="guia-card-body" id="supera-card-na-hora">
                  <ol className="guia-list ordered">
                    <li><strong>Encoste com segurança</strong> assim que possível. Evite “forçar mais um pouco”.</li>
                    <li><strong>Desligue o ar-condicionado</strong> e reduza carga do motor.</li>
                    <li><strong>Se a temperatura estiver no vermelho</strong>, pare e desligue o motor.</li>
                    <li><strong>Não abra a tampa do reservatório/radiador quente</strong> (risco de queimadura).</li>
                    <li>Espere esfriar e verifique nível do reservatório (se estiver vazio, pode haver vazamento).</li>
                  </ol>

                  <div className="guia-callout warning">
                    <strong>Regra de ouro:</strong> ferveu ou acendeu alerta vermelho? Trate como emergência.
                    Superaquecer pode queimar junta do cabeçote.
                  </div>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="sinais" tabIndex={-1}>
            <h3 className="guia-section-title">Sinais típicos e o que eles sugerem</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.sinais ? 'true' : 'false'}
                aria-controls="supera-card-sinais"
                onClick={() => toggleCard('sinais')}
                onKeyDown={(e) => onToggleKeyDown(e, 'sinais')}
              >
                <div>
                  <div className="guia-card-title">Como “ler” os sintomas</div>
                  <div className="guia-card-subtitle">Do iniciante ao avançado</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.sinais && (
                <div className="guia-card-body" id="supera-card-sinais">
                  <ul className="guia-list">
                    <li><strong>Some água do reservatório</strong>: vazamento (mangueira, radiador, bomba d’água, tampa).</li>
                    <li><strong>Ventoinha não arma</strong>: fusível/relé, sensor, módulo, ventoinha.</li>
                    <li><strong>Esquenta em trânsito</strong> e melhora andando: ventoinha / radiador sujo.</li>
                    <li><strong>Esquenta na estrada</strong>: circulação ruim (bomba/termostática) ou radiador entupido.</li>
                    <li><strong>Cheiro doce / vapor</strong>: vazamento de arrefecimento.</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="checklist" tabIndex={-1}>
            <h3 className="guia-section-title">Checklist (com motor frio)</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.checklist ? 'true' : 'false'}
                aria-controls="supera-card-checklist"
                onClick={() => toggleCard('checklist')}
                onKeyDown={(e) => onToggleKeyDown(e, 'checklist')}
              >
                <div>
                  <div className="guia-card-title">O que você consegue checar em casa</div>
                  <div className="guia-card-subtitle">Sem ferramentas especiais</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.checklist && (
                <div className="guia-card-body" id="supera-card-checklist">
                  <ol className="guia-list ordered">
                    <li><strong>Nível do reservatório</strong> (entre MIN e MAX) e cor do líquido.</li>
                    <li><strong>Vazamentos</strong> (mangueiras, conexões, radiador, embaixo do carro).</li>
                    <li><strong>Tampa do reservatório</strong> (rachada/sem vedação causa perda de pressão).</li>
                    <li><strong>Mangueiras</strong> (ressecadas, inchadas, rachadas).</li>
                    <li><strong>Ventoinha</strong>: liga quando o carro esquenta? (com cuidado e distância)</li>
                  </ol>

                  <div className="guia-callout tip">
                    <strong>Boa prática:</strong> complete sempre com o líquido correto (aditivo + água desmineralizada conforme manual).
                  </div>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="causas" tabIndex={-1}>
            <h3 className="guia-section-title">Causas comuns (e como confirmar)</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.causas ? 'true' : 'false'}
                aria-controls="supera-card-causas"
                onClick={() => toggleCard('causas')}
                onKeyDown={(e) => onToggleKeyDown(e, 'causas')}
              >
                <div>
                  <div className="guia-card-title">Mapa causa → teste</div>
                  <div className="guia-card-subtitle">A parte “útil pra todo mundo”</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.causas && (
                <div className="guia-card-body" id="supera-card-causas">
                  <ul className="guia-list">
                    <li><strong>Válvula termostática travada</strong>: demora a circular, sobe rápido.</li>
                    <li><strong>Bomba d’água</strong>: circulação fraca, barulho, vazamento na bomba.</li>
                    <li><strong>Radiador entupido</strong>: diferença grande de temperatura entre mangueiras (diagnóstico profissional ajuda).</li>
                    <li><strong>Ventoinha/relés</strong>: não arma, ou arma tarde demais.</li>
                    <li><strong>Junta do cabeçote</strong>: bolhas no reservatório, óleo “maionese”, perda constante de água (precisa oficina).</li>
                  </ul>

                  <div className="guia-callout warning">
                    Se houver suspeita de <strong>junta do cabeçote</strong>, evite rodar: pode aumentar muito o prejuízo.
                  </div>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="pecas" tabIndex={-1}>
            <h3 className="guia-section-title">Peças que mais aparecem quando resolve</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.pecas ? 'true' : 'false'}
                aria-controls="supera-card-pecas"
                onClick={() => toggleCard('pecas')}
                onKeyDown={(e) => onToggleKeyDown(e, 'pecas')}
              >
                <div>
                  <div className="guia-card-title">Lista de peças relacionadas</div>
                  <div className="guia-card-subtitle">Checklist de orçamento</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.pecas && (
                <div className="guia-card-body" id="supera-card-pecas">
                  <div className="guia-chips">
                    <span className="guia-chip">Aditivo / fluido de arrefecimento</span>
                    <span className="guia-chip">Tampa do reservatório</span>
                    <span className="guia-chip">Mangueiras e abraçadeiras</span>
                    <span className="guia-chip">Válvula termostática</span>
                    <span className="guia-chip">Bomba d’água</span>
                    <span className="guia-chip">Radiador</span>
                    <span className="guia-chip">Sensor de temperatura</span>
                    <span className="guia-chip">Ventoinha / relé</span>
                  </div>

                  <button className="guia-inline-cta" onClick={goToCatalog}>Ir para o catálogo →</button>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
