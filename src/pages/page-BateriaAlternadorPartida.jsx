import React, { useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuLogin } from '../components';
import { AuthContext } from '../App';
import '../styles/pages/page-BateriaAlternadorPartida.css';

export default function BateriaAlternadorPartida() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const navSections = useMemo(
    () => [
      { id: 'sintomas', label: 'Sintomas' },
      { id: 'testes', label: 'Testes' },
      { id: 'fuga', label: 'Fuga' },
      { id: 'pecas', label: 'Peças' },
      { id: 'faq', label: 'FAQ' }
    ],
    []
  );

  const [expandedCards, setExpandedCards] = useState({
    sintomas: true,
    testes: true,
    fuga: false,
    pecas: true,
    faq: false
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

      <div className="page-wrapper menu-page bateria-page" id="topo" tabIndex={-1}>
        <div className="page-content">
          <div className="bateria-hero">
            <h2 className="page-title">Bateria, alternador e partida</h2>
            <p className="page-subtitle">
              Diagnóstico prático: quando é bateria fraca, quando é carga (alternador) e quando é fuga de corrente.
            </p>
            <div className="bateria-hero-cta">
              <button className="bateria-cta" onClick={goToCatalog}>Buscar peças no catálogo →</button>
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

          <section className="guia-section" id="sintomas" tabIndex={-1}>
            <h3 className="guia-section-title">Sintomas e o que eles sugerem</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.sintomas ? 'true' : 'false'}
                aria-controls="bateria-card-sintomas"
                onClick={() => toggleCard('sintomas')}
                onKeyDown={(e) => onToggleKeyDown(e, 'sintomas')}
              >
                <div>
                  <div className="guia-card-title">Leitura rápida dos sinais</div>
                  <div className="guia-card-subtitle">Serve pra iniciantes e pra quem já manja</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.sintomas && (
                <div className="guia-card-body" id="bateria-card-sintomas">
                  <ul className="guia-list">
                    <li><strong>Partida lenta</strong> e painel piscando: bateria fraca / mau contato.</li>
                    <li><strong>Carro morre andando</strong>: problema de carga (alternador/correia) ou conexão principal.</li>
                    <li><strong>Luz da bateria acesa</strong> no painel: carga com falha (não é “só bateria”).</li>
                    <li><strong>Funciona com chupeta</strong> e volta a arriar: bateria no fim ou alternador não carregando.</li>
                    <li><strong>Arreia parado em 1–2 dias</strong>: fuga de corrente (consumo com carro desligado).</li>
                  </ul>

                  <div className="guia-callout tip">
                    <strong>Atalho:</strong> “bateria” no painel acesa normalmente aponta para o <strong>alternador</strong> (carga).
                  </div>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="testes" tabIndex={-1}>
            <h3 className="guia-section-title">Testes simples (com segurança)</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.testes ? 'true' : 'false'}
                aria-controls="bateria-card-testes"
                onClick={() => toggleCard('testes')}
                onKeyDown={(e) => onToggleKeyDown(e, 'testes')}
              >
                <div>
                  <div className="guia-card-title">Checklist de testes</div>
                  <div className="guia-card-subtitle">Sem desmontar nada</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.testes && (
                <div className="guia-card-body" id="bateria-card-testes">
                  <ol className="guia-list ordered">
                    <li><strong>Inspeção visual:</strong> terminais oxidados? cabos frouxos? aperte e limpe.</li>
                    <li><strong>Comportamento ao dar partida:</strong> se apaga tudo, é queda de tensão (bateria/cabos).</li>
                    <li><strong>Teste de carga com multímetro</strong> (se tiver):
                      <ul className="guia-list">
                        <li>Motor desligado: ~12,4–12,8 V (depende do estado de carga).</li>
                        <li>Motor ligado: ~13,8–14,5 V (indicativo de alternador carregando).</li>
                      </ul>
                    </li>
                    <li><strong>Correia do alternador:</strong> ruído/folga pode reduzir carga.</li>
                  </ol>

                  <div className="guia-callout warning">
                    Evite “testes antigos” como tirar o cabo da bateria com motor ligado.
                    Isso pode danificar módulos eletrônicos.
                  </div>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="fuga" tabIndex={-1}>
            <h3 className="guia-section-title">Fuga de corrente (o vilão quando arreia parado)</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.fuga ? 'true' : 'false'}
                aria-controls="bateria-card-fuga"
                onClick={() => toggleCard('fuga')}
                onKeyDown={(e) => onToggleKeyDown(e, 'fuga')}
              >
                <div>
                  <div className="guia-card-title">Como suspeitar e o que pedir na oficina</div>
                  <div className="guia-card-subtitle">O básico que resolve 80%</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.fuga && (
                <div className="guia-card-body" id="bateria-card-fuga">
                  <ul className="guia-list">
                    <li><strong>Sintoma clássico:</strong> bateria boa, carro usa 1–2 dias parado e não pega.</li>
                    <li><strong>Causas comuns:</strong> módulo não “dorme”, som instalado errado, rastreador, luz interna/porta-malas, alarme.</li>
                    <li><strong>O que pedir:</strong> medição de consumo em repouso (amperímetro) e teste por fusíveis.</li>
                  </ul>

                  <div className="guia-callout tip">
                    Se você troca bateria e “resolve por 1 mês”, a chance de ser fuga é grande.
                  </div>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="pecas" tabIndex={-1}>
            <h3 className="guia-section-title">Peças relacionadas (pra orçamento)</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.pecas ? 'true' : 'false'}
                aria-controls="bateria-card-pecas"
                onClick={() => toggleCard('pecas')}
                onKeyDown={(e) => onToggleKeyDown(e, 'pecas')}
              >
                <div>
                  <div className="guia-card-title">Lista rápida</div>
                  <div className="guia-card-subtitle">O que mais aparece quando resolve</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.pecas && (
                <div className="guia-card-body" id="bateria-card-pecas">
                  <div className="guia-chips">
                    <span className="guia-chip">Bateria</span>
                    <span className="guia-chip">Alternador</span>
                    <span className="guia-chip">Correia do alternador</span>
                    <span className="guia-chip">Regulador/escovas (quando aplicável)</span>
                    <span className="guia-chip">Cabos e terminais</span>
                    <span className="guia-chip">Motor de partida</span>
                    <span className="guia-chip">Relés/fusíveis</span>
                  </div>

                  <button className="guia-inline-cta" onClick={goToCatalog}>Ir para o catálogo →</button>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="faq" tabIndex={-1}>
            <h3 className="guia-section-title">Perguntas rápidas</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.faq ? 'true' : 'false'}
                aria-controls="bateria-card-faq"
                onClick={() => toggleCard('faq')}
                onKeyDown={(e) => onToggleKeyDown(e, 'faq')}
              >
                <div>
                  <div className="guia-card-title">FAQ</div>
                  <div className="guia-card-subtitle">Respostas curtas, sem enrolação</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.faq && (
                <div className="guia-card-body" id="bateria-card-faq">
                  <div className="guia-faq">
                    <p><strong>Posso usar bateria maior (Ah)?</strong><br />
                    Em geral, pode ser ok se caber fisicamente e respeitar o padrão do carro. O ideal é seguir manual e orientação técnica.</p>

                    <p><strong>Luz da bateria acendeu, posso rodar?</strong><br />
                    Dá pra rodar pouco (até um lugar seguro), mas você está só na energia da bateria. Evite desligar/ligar e vá direto.</p>

                    <p><strong>Chupeta estraga o carro?</strong><br />
                    Se feita corretamente, costuma ser segura. O maior risco é inversão de polaridade e picos por cabos ruins.</p>
                  </div>
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
