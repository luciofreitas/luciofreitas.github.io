import React, { useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuLogin } from '../components';
import { AuthContext } from '../App';
import '../styles/pages/page-FreiosSemMisterio.css';

export default function FreiosSemMisterio() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const navSections = useMemo(
    () => [
      { id: 'quando-parar', label: 'Quando parar' },
      { id: 'sintomas', label: 'Sintomas' },
      { id: 'checklist', label: 'Checklist' },
      { id: 'pecas', label: 'Peças' },
      { id: 'faq', label: 'FAQ' }
    ],
    []
  );

  const [expandedCards, setExpandedCards] = useState({
    risco: true,
    vibracao: false,
    chiado: false,
    pedal: false,
    checklist: true,
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

      <div className="page-wrapper menu-page freios-page" id="topo" tabIndex={-1}>
        <div className="page-content">
          <div className="freios-hero">
            <h2 className="page-title">Freios sem Mistério</h2>
            <p className="page-subtitle">
              Um guia prático (do básico ao avançado) para entender sintomas, riscos e como decidir o que checar antes de trocar peças.
            </p>

            <div className="freios-hero-cta">
              <button className="freios-cta" onClick={goToCatalog}>Buscar peças no catálogo →</button>
              <div className="freios-hero-note">
                Segurança em primeiro lugar: se tiver dúvida, trate como risco e procure ajuda.
              </div>
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

          <section className="guia-section" id="quando-parar" tabIndex={-1}>
            <h3 className="guia-section-title">Quando parar e não insistir</h3>

            <div
              className="guia-card-header"
              role="button"
              tabIndex={0}
              aria-expanded={expandedCards.risco ? 'true' : 'false'}
              aria-controls="freios-card-risco"
              onClick={() => toggleCard('risco')}
              onKeyDown={(e) => onToggleKeyDown(e, 'risco')}
            >
              <div>
                <div className="guia-card-title">Sinais de risco imediato</div>
                <div className="guia-card-subtitle">Quando o mais seguro é encostar e pedir assistência</div>
              </div>
              <span className="guia-expand-indicator" aria-hidden="true">▾</span>
            </div>

            {expandedCards.risco && (
              <div className="guia-card-body" id="freios-card-risco">
                <ul className="guia-list">
                  <li><strong>Pedal indo ao fundo</strong> ou sensação de “vazio”.</li>
                  <li><strong>Luz de freio</strong> vermelha acesa + perda clara de eficiência.</li>
                  <li><strong>Carro puxando muito</strong> ao frear (pode travamento / falha hidráulica).</li>
                  <li><strong>Cheiro forte de queimado</strong> após frenagens leves (travamento).</li>
                  <li><strong>Vazamento</strong> aparente de fluido (em roda/na garagem).</li>
                </ul>

                <div className="guia-callout warning">
                  <strong>Dica rápida:</strong> se o pedal baixar, tente bombear 2–3 vezes.
                  Se melhorar por poucos segundos e voltar a piorar, é forte sinal de problema hidráulico (não “resolve”).
                </div>
              </div>
            )}

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="sintomas" tabIndex={-1}>
            <h3 className="guia-section-title">Sintomas comuns (e o que costuma ser)</h3>

            <div className="guia-grid">
              <div className="guia-card">
                <div
                  className="guia-card-header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedCards.vibracao ? 'true' : 'false'}
                  aria-controls="freios-card-vibracao"
                  onClick={() => toggleCard('vibracao')}
                  onKeyDown={(e) => onToggleKeyDown(e, 'vibracao')}
                >
                  <div>
                    <div className="guia-card-title">Vibração no volante ao frear</div>
                    <div className="guia-card-subtitle">Geralmente em velocidades mais altas</div>
                  </div>
                  <span className="guia-expand-indicator" aria-hidden="true">▾</span>
                </div>
                {expandedCards.vibracao && (
                  <div className="guia-card-body" id="freios-card-vibracao">
                    <ul className="guia-list">
                      <li><strong>Disco empenado</strong> (mais comum) ou com espessura irregular.</li>
                      <li><strong>Pneu/roda</strong> com problema (às vezes parece “freio”, mas é balanceamento).</li>
                      <li><strong>Pastilha</strong> vitrificada ou assentamento ruim após troca.</li>
                    </ul>
                    <div className="guia-callout tip">
                      <strong>Teste útil:</strong> vibra só ao frear? Pense primeiro em disco/pastilha.
                      Vibra também sem frear? Pense em pneu/rodas/suspensão.
                    </div>
                  </div>
                )}
              </div>

              <div className="guia-card">
                <div
                  className="guia-card-header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedCards.chiado ? 'true' : 'false'}
                  aria-controls="freios-card-chiado"
                  onClick={() => toggleCard('chiado')}
                  onKeyDown={(e) => onToggleKeyDown(e, 'chiado')}
                >
                  <div>
                    <div className="guia-card-title">Chiado / apito ao frear</div>
                    <div className="guia-card-subtitle">Pode ser normal ou sinal de desgaste</div>
                  </div>
                  <span className="guia-expand-indicator" aria-hidden="true">▾</span>
                </div>
                {expandedCards.chiado && (
                  <div className="guia-card-body" id="freios-card-chiado">
                    <ul className="guia-list">
                      <li><strong>Indicador de desgaste</strong> raspando (muito comum).</li>
                      <li><strong>Poeira/umidade</strong> (chiado some depois de algumas frenagens).</li>
                      <li><strong>Pastilha dura</strong> (compostos mais agressivos podem chiar).</li>
                      <li><strong>Disco riscado</strong> / pastilha no fim (se o som é “raspando metal”).</li>
                    </ul>
                    <div className="guia-callout warning">
                      Se o som virar <strong>raspagem metálica</strong>, pare de usar: pode destruir o disco.
                    </div>
                  </div>
                )}
              </div>

              <div className="guia-card">
                <div
                  className="guia-card-header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedCards.pedal ? 'true' : 'false'}
                  aria-controls="freios-card-pedal"
                  onClick={() => toggleCard('pedal')}
                  onKeyDown={(e) => onToggleKeyDown(e, 'pedal')}
                >
                  <div>
                    <div className="guia-card-title">Pedal baixo, duro ou “borrachudo”</div>
                    <div className="guia-card-subtitle">Sensação no pé é um ótimo diagnóstico</div>
                  </div>
                  <span className="guia-expand-indicator" aria-hidden="true">▾</span>
                </div>
                {expandedCards.pedal && (
                  <div className="guia-card-body" id="freios-card-pedal">
                    <ul className="guia-list">
                      <li><strong>Borrachudo</strong>: ar no sistema, fluido velho, mangueira dilatando.</li>
                      <li><strong>Duro</strong>: servo-freio/vácuo (ou ABS atuando em piso ruim).</li>
                      <li><strong>Baixo</strong>: vazamento, cilindro mestre, pinça com problema.</li>
                    </ul>
                    <div className="guia-callout tip">
                      <strong>Rápido:</strong> veja o nível do fluido. Se baixou sem motivo, procure vazamento.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="checklist" tabIndex={-1}>
            <h3 className="guia-section-title">Checklist antes de comprar/trocar peças</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.checklist ? 'true' : 'false'}
                aria-controls="freios-card-checklist"
                onClick={() => toggleCard('checklist')}
                onKeyDown={(e) => onToggleKeyDown(e, 'checklist')}
              >
                <div>
                  <div className="guia-card-title">5 minutos que evitam gasto errado</div>
                  <div className="guia-card-subtitle">O básico que serve pra qualquer carro</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.checklist && (
                <div className="guia-card-body" id="freios-card-checklist">
                  <ol className="guia-list ordered">
                    <li><strong>Olhar as rodas:</strong> vazamento, sujeira oleosa, mangueira ressecada.</li>
                    <li><strong>Nível do fluido:</strong> baixo pode indicar vazamento ou pastilha muito gasta.</li>
                    <li><strong>Espessura da pastilha:</strong> se estiver muito fina, troque (e avalie o disco).</li>
                    <li><strong>Disco:</strong> sulcos profundos, trincas, borda muito alta = atenção.</li>
                    <li><strong>Teste curto:</strong> freada leve, depois mais forte (em local seguro) e note ruído/vibração.</li>
                  </ol>

                  <div className="guia-callout tip">
                    Se trocar <strong>pastilha</strong> com disco ruim, o problema volta. Se trocar <strong>disco</strong> sem resolver pinça travando,
                    vai empenar de novo.
                  </div>
                </div>
              )}
            </div>

            <div className="guia-section-actions">
              <button className="guia-top-btn" onClick={() => scrollToSection('topo')}>Topo ↑</button>
            </div>
          </section>

          <section className="guia-section" id="pecas" tabIndex={-1}>
            <h3 className="guia-section-title">Peças relacionadas (o que normalmente entra no orçamento)</h3>

            <div className="guia-card">
              <div
                className="guia-card-header"
                role="button"
                tabIndex={0}
                aria-expanded={expandedCards.pecas ? 'true' : 'false'}
                aria-controls="freios-card-pecas"
                onClick={() => toggleCard('pecas')}
                onKeyDown={(e) => onToggleKeyDown(e, 'pecas')}
              >
                <div>
                  <div className="guia-card-title">Lista rápida de peças</div>
                  <div className="guia-card-subtitle">Use como checklist na loja/oficina</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.pecas && (
                <div className="guia-card-body" id="freios-card-pecas">
                  <div className="guia-chips">
                    <span className="guia-chip">Pastilha</span>
                    <span className="guia-chip">Disco</span>
                    <span className="guia-chip">Fluido DOT 3/4/5.1 (conforme manual)</span>
                    <span className="guia-chip">Kit reparo pinça</span>
                    <span className="guia-chip">Mangueiras</span>
                    <span className="guia-chip">Cilindro mestre</span>
                    <span className="guia-chip">Sensor ABS (quando aplicável)</span>
                  </div>

                  <div className="guia-callout tip">
                    <strong>Boa prática:</strong> sempre que trocar pastilha, avalie o disco; e a cada 2 anos,
                    pense no fluido (absorve umidade e piora a frenagem).
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
                aria-controls="freios-card-faq"
                onClick={() => toggleCard('faq')}
                onKeyDown={(e) => onToggleKeyDown(e, 'faq')}
              >
                <div>
                  <div className="guia-card-title">Dúvidas comuns</div>
                  <div className="guia-card-subtitle">Respostas curtas e úteis</div>
                </div>
                <span className="guia-expand-indicator" aria-hidden="true">▾</span>
              </div>

              {expandedCards.faq && (
                <div className="guia-card-body" id="freios-card-faq">
                  <div className="guia-faq">
                    <p><strong>Troquei pastilha e começou a chiar. É normal?</strong><br />
                    Pode acontecer no assentamento (primeiros km). Se persistir, revise disco, limpeza e lubrificação correta (sem contaminar a pastilha).</p>

                    <p><strong>Posso “retificar” disco?</strong><br />
                    Depende da espessura mínima do disco e do estado. Se passar do limite, o correto é substituir.</p>

                    <p><strong>Fluido de freio some com o tempo?</strong><br />
                    O nível pode baixar com desgaste das pastilhas, mas <em>queda rápida</em> normalmente indica vazamento.</p>
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
