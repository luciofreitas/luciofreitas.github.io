import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuLogin } from '../components';
import { AuthContext } from '../App';
import '../styles/pages/page-ManutencaoPreventiva.css';

const ManutencaoPreventiva = () => {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Track which cards are expanded (show content) vs collapsed (header only)
  const [expandedCards, setExpandedCards] = useState({});

  const navSections = useMemo(
    () => [
      { id: 'cronograma', label: 'Cronograma' },
      { id: 'dicas', label: 'Dicas' },
      { id: 'custos', label: 'Custos' }
    ],
    []
  );

  const [activeSectionId, setActiveSectionId] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToShortcuts = () => {
    const el = document.getElementById('guia-atalhos');
    if (!el) {
      scrollToSection('topo');
      return;
    }

    // Ajuste simples para não “colar” embaixo do header/menu.
    const headerOffset = 90;
    const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });

    // Ajuda leitores de tela a entenderem que mudou de contexto
    window.setTimeout(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        // ignore
      }
    }, 250);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleCard = (cardKey) => {
    setExpandedCards(prev => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observed = navSections
      .map(s => document.getElementById(s.id))
      .filter(Boolean);

    if (!observed.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting entry
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
        if (visible[0]?.target?.id) setActiveSectionId(visible[0].target.id);
      },
      {
        root: null,
        // Consider "active" when the section header is around the middle of viewport
        rootMargin: '-35% 0px -55% 0px',
        threshold: [0.05, 0.1, 0.2, 0.35]
      }
    );

    observed.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [navSections]);

  const manualData = {
    quilometragens: [
      {
        km: '5.000 km',
        itens: [
          { item: 'Checagem do nível e condição do óleo (verificar cor/nível)', prioridade: 'alta' },
          { item: 'Inspeção de vazamentos e verificação de níveis (freio, arrefecimento, direção)', prioridade: 'alta' },
          { item: 'Verificação rápida dos pneus (pressão/visual)', prioridade: 'média' }
        ]
      },
      {
        km: '10.000 km',
        itens: [
          { item: 'Troca de óleo do motor + filtro — A cada 10.000 km OU 6 meses (o que ocorrer primeiro). Ajuste conforme tipo de óleo / manual.', prioridade: 'alta' },
          { item: 'Troca do filtro de ar (exceto uso severo)', prioridade: 'alta' },
          { item: 'Troca do filtro de ar condicionado', prioridade: 'média' },
          { item: 'Rodízio de pneus', prioridade: 'média' },
          { item: 'Verificação do sistema de freios', prioridade: 'alta' },
          { item: 'Limpeza dos bicos injetores (se aplicável)', prioridade: 'média' }
        ]
      },
      {
        km: '20.000 km',
        itens: [
          { item: 'Troca de óleo do motor', prioridade: 'alta' },
          { item: 'Troca do filtro de óleo', prioridade: 'alta' },
          { item: 'Troca do filtro de ar', prioridade: 'alta' },
          { item: 'Troca do filtro de combustível', prioridade: 'alta' },
          { item: 'Verificação das pastilhas de freio', prioridade: 'alta' },
          { item: 'Verificação da bateria', prioridade: 'média' },
          { item: 'Alinhamento e balanceamento', prioridade: 'média' }
        ]
      },
      {
        km: '30.000 km',
        itens: [
          { item: 'Inspeção de sistemas (verificar necessidade de troca de óleo conforme indicador)', prioridade: 'alta' },
          { item: 'Troca das velas de ignição (nota: vida útil varia — 15.000–100.000 km dependendo do material)', prioridade: 'alta' },
          { item: 'Limpeza do corpo de borboleta', prioridade: 'média' },
          { item: 'Troca do fluido de freio — A cada 2 anos OU 30.000 km (o que ocorrer primeiro)', prioridade: 'alta' }
        ]
      },
      {
        km: '40.000 km',
        itens: [
          { item: 'Troca de óleo do motor', prioridade: 'alta' },
          { item: 'Troca do filtro de óleo', prioridade: 'alta' },
          { item: 'Troca do filtro de ar', prioridade: 'alta' },
          { item: 'Verificação das velas de ignição', prioridade: 'média' },
          { item: 'Troca do fluido de arrefecimento', prioridade: 'alta' },
          { item: 'Verificação da suspensão', prioridade: 'média' },
          { item: 'Limpeza dos bicos injetores', prioridade: 'média' }
        ]
      },
      {
        km: '60.000 km',
        itens: [
          { item: 'Troca da correia dentada (ou conforme manual do fabricante) — muitos fabricantes indicam ~60.000 km', prioridade: 'alta' },
          { item: 'Troca de óleo do motor', prioridade: 'alta' },
          { item: 'Troca do filtro de óleo', prioridade: 'alta' },
          { item: 'Troca do filtro de ar', prioridade: 'alta' },
          { item: 'Troca do filtro de combustível', prioridade: 'alta' },
          { item: 'Troca das velas de ignição', prioridade: 'alta' },
          { item: 'Troca do fluido de freio', prioridade: 'alta' },
          { item: 'Revisão completa da suspensão', prioridade: 'alta' },
          { item: 'Verificação dos discos de freio', prioridade: 'alta' }
        ]
      }
    ],
    dicasPraticas: [
      {
        titulo: 'Verificação Semanal',
        descricao: 'Faça estas verificações toda semana para evitar surpresas',
        lista: [
          'Nível do óleo do motor (com o motor frio)',
          'Nível da água do radiador',
          'Calibragem dos pneus (incluindo o estepe)',
          'Funcionamento das luzes (faróis, lanternas, setas)',
          'Limpadores de para-brisa e nível do reservatório',
          'Vazamentos embaixo do veículo'
        ]
      },
      {
        titulo: 'Verificação Mensal',
        descricao: 'Checagens importantes para fazer mensalmente',
        lista: [
          'Nível do fluido de freio',
          'Nível do fluido da direção hidráulica',
          'Estado das palhetas do limpador',
          'Condição dos pneus (desgaste e danos)',
          'Funcionamento do ar condicionado',
          'Bateria (terminais e fixação)'
        ]
      },
      {
        titulo: 'Sinais de Alerta',
        descricao: 'Fique atento a estes sinais que indicam necessidade de revisão',
        lista: [
          'Luzes do painel acesas',
          'Ruídos estranhos ao frear',
          'Vibrações anormais no volante',
          'Perda de potência do motor',
          'Consumo excessivo de combustível',
          'Dificuldade para dar partida',
          'Vazamentos de fluidos',
          'Fumaça excessiva pelo escapamento'
        ]
      },
      {
        titulo: 'Economia e Vida Útil',
        descricao: 'Práticas que economizam e prolongam a vida do veículo',
        lista: [
          'Deixe o motor aquecer antes de acelerar forte',
          'Evite arrancadas e freadas bruscas',
          'Use o freio motor em descidas',
          'Não sobrecarregue o veículo',
          'Mantenha o filtro de ar sempre limpo',
          'Use combustível de qualidade',
          'Evite deixar o carro parado por longos períodos',
          'Lave o carro regularmente (protege a pintura)'
        ]
      }
    ],
    custosReferencia: [
      {
        servico: 'Troca de óleo + filtro',
        faixa: 'R$ 150 - R$ 350',
        periodicidade: 'A cada 10.000 km OU 6 meses (o que ocorrer primeiro); ajustar conforme tipo de óleo / manual do fabricante'
      },
      {
        servico: 'Troca de filtro de ar',
        faixa: 'R$ 50 - R$ 150',
        periodicidade: 'A cada 10.000 km (reduzir em uso severo: poeira/estradas de terra)'
      },
      {
        servico: 'Troca de pastilhas de freio',
        faixa: 'R$ 200 - R$ 500',
        periodicidade: 'A cada 20.000 - 40.000 km'
      },
      {
        servico: 'Troca da correia dentada',
        faixa: 'R$ 600 - R$ 1.500',
        periodicidade: 'A cada 60.000 km (ou conforme manual do fabricante)'
      },
      {
        servico: 'Alinhamento e balanceamento',
        faixa: 'R$ 100 - R$ 200',
        periodicidade: 'A cada 10.000 km ou quando necessário'
      },
      {
        servico: 'Troca de velas de ignição',
        faixa: 'R$ 150 - R$ 400',
        periodicidade: '30.000 km (varia: 15.000–100.000 km dependendo do material — cobre/platina/irídio)'
      },
      {
        servico: 'Troca do fluido de freio',
        faixa: 'R$ 80 - R$ 200',
        periodicidade: 'A cada 2 anos ou 30.000 km'
      },
      {
        servico: 'Revisão completa (60.000 km)',
        faixa: 'R$ 1.500 - R$ 3.500',
        periodicidade: 'A cada 60.000 km'
      }
    ]
  };

  return (
    <div className="manutencao-page" id="topo">
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      <div className="site-header-spacer"></div>
      
      <div className="manutencao-container">
        <div className="manutencao-header">
          <h1>Guia de Manutenção Preventiva</h1>
          <p className="header-subtitle">
            Mantenha seu veículo sempre em perfeito estado seguindo este guia completo de manutenção preventiva.
            Evite surpresas, economize e prolongue a vida útil do seu carro.
          </p>
        </div>

        <div className="guia-nav" id="guia-atalhos" tabIndex={-1} aria-label="Atalhos do guia">
          <div className="guia-nav-left">
            <span className="guia-nav-title">Navegar:</span>
            <div className="guia-nav-pills" role="navigation" aria-label="Seções do guia">
              {navSections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`guia-nav-pill ${activeSectionId === s.id ? 'is-active' : ''}`}
                  onClick={() => scrollToSection(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Introdução */}
        <section className="manutencao-intro">
          <div className="intro-card">
            <h2>Por que fazer manutenção preventiva?</h2>
            <div className="intro-benefits">
              <div className="benefit-item is-economia">
                <div className="benefit-head">
                  <span className="benefit-badge" aria-hidden="true">💰</span>
                  <div className="benefit-title">
                    <h3>Economia</h3>
                    <span className="benefit-kicker">Menos surpresas no bolso</span>
                  </div>
                </div>
                <p>Prevenir é sempre mais barato que corrigir. Uma manutenção regular evita gastos maiores com reparos emergenciais.</p>
              </div>

              <div className="benefit-item is-seguranca">
                <div className="benefit-head">
                  <span className="benefit-badge" aria-hidden="true">🛡️</span>
                  <div className="benefit-title">
                    <h3>Segurança</h3>
                    <span className="benefit-kicker">Mais confiança ao dirigir</span>
                  </div>
                </div>
                <p>Veículo bem mantido oferece mais segurança para você e sua família, evitando falhas mecânicas em momentos críticos.</p>
              </div>

              <div className="benefit-item is-durabilidade">
                <div className="benefit-head">
                  <span className="benefit-badge" aria-hidden="true">⏰</span>
                  <div className="benefit-title">
                    <h3>Durabilidade</h3>
                    <span className="benefit-kicker">Mais vida útil e revenda</span>
                  </div>
                </div>
                <p>Manutenção adequada prolonga significativamente a vida útil do veículo e mantém seu valor de revenda.</p>
              </div>

              <div className="benefit-item is-performance">
                <div className="benefit-head">
                  <span className="benefit-badge" aria-hidden="true">🚀</span>
                  <div className="benefit-title">
                    <h3>Performance</h3>
                    <span className="benefit-kicker">Eficiência e conforto</span>
                  </div>
                </div>
                <p>Motor e componentes bem cuidados mantêm a potência, eficiência e conforto originais do veículo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cronograma de Manutenção */}
        <section className="manutencao-cronograma" id="cronograma">
          <h2>Cronograma de Manutenção por Quilometragem</h2>
          <div className="section-card">
            <div className="section-description">
              <p>Siga este cronograma baseado na quilometragem do seu veículo.</p>
              <p>Os itens variam conforme o fabricante — sempre consulte o manual do proprietário do seu carro.</p>
            </div>
            
            <div className="legenda-prioridades">
              <h4>Legenda de Prioridades:</h4>
              <div className="legenda-items">
                <span className="legenda-item alta">
                  <span className="legenda-badge">ALTA</span> Essencial - não pode ser adiado
                </span>
                <span className="legenda-item media">
                  <span className="legenda-badge">MÉDIA</span> Importante - agende em breve
                </span>
              </div>
              <div className="disclaimer">
                <p>
                  ⚠️ <strong>Aviso:</strong> As prioridades são orientativas. Sempre consulte um profissional para avaliar a urgência real dos serviços.
                </p>
              </div>
            </div>

            <div className="cronograma-grid">
              {manualData.quilometragens.map((etapa, index) => {
                const cardKey = `card-${index}`;
                const isExpanded = expandedCards[cardKey];
                const listId = `cronograma-lista-${cardKey}`;

                return (
                <div 
                  key={index} 
                  className={`cronograma-card ${isExpanded ? 'expanded' : 'collapsed'}`}
                >
                  <div 
                    className="cronograma-header"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={listId}
                    onClick={() => toggleCard(cardKey)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleCard(cardKey);
                      }
                    }}
                  >
                    <h3>{etapa.km}</h3>
                    <div className="cronograma-header-right">
                      <span className="itens-count">{etapa.itens.length} itens</span>
                      <span className={`expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                    </div>
                  </div>
                  <ul className="cronograma-lista" id={listId}>
                    {etapa.itens.map((item, idx) => {
                      const prioridadeRaw = String(item.prioridade || '').trim();
                      const prioridadeSlug = prioridadeRaw
                        .normalize('NFKD')
                        .replace(/\p{Diacritic}/gu, '')
                        .replace(/[^a-zA-Z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')
                        .toLowerCase();
                      return (
                        <li key={idx} className={`prioridade-${prioridadeSlug}`}>
                          <span className="prioridade-badge">{prioridadeRaw}</span>
                          {item.item}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
              })}
            </div>

            <div className="section-actions">
              <button
                type="button"
                className="to-shortcuts-btn"
                onClick={() => scrollToSection('topo')}
                aria-label="Voltar para o topo"
              >
                Topo
              </button>
            </div>
          </div>

          
        </section>

        {/* Dicas Práticas */}
        <section className="manutencao-dicas" id="dicas">
          <h2>Dicas Práticas de Manutenção</h2>

          <div className="section-card">
            <div className="dicas-grid">
              {manualData.dicasPraticas.map((dica, index) => {
                const dicaKey = `dica-${index}`;
                const isExpanded = expandedCards[dicaKey];
                const listId = `dica-lista-${dicaKey}`;
                
                return (
                <div 
                  key={index} 
                  className={`dica-card ${isExpanded ? 'expanded' : 'collapsed'}`}
                >
                  <div 
                    className="dica-header"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={listId}
                    onClick={() => toggleCard(dicaKey)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleCard(dicaKey);
                      }
                    }}
                  >
                    <div className="dica-header-text">
                      <h3>{dica.titulo}</h3>
                      <p className="dica-descricao">{dica.descricao}</p>
                    </div>
                    <span className={`expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                  </div>
                  <ul className="dica-lista" id={listId}>
                    {dica.lista.map((item, idx) => (
                      <li key={idx}>
                        <span className="check-icon">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
              })}
            </div>

            <div className="section-actions">
              <button
                type="button"
                className="to-shortcuts-btn"
                onClick={() => scrollToSection('topo')}
                aria-label="Voltar para o topo"
              >
                Topo
              </button>
            </div>
          </div>
        </section>

        {/* Custos de Referência */}
        <section className="manutencao-custos" id="custos">
          <h2>Custos Médios de Referência</h2>
          <div className="section-card">
            <p className="section-description">
              Valores aproximados para você planejar seu orçamento. Os preços variam conforme região, modelo do veículo e oficina.
            </p>
            
            <div className="custos-tabela">
              <div className="tabela-header">
                <div className="col-servico">Serviço</div>
                <div className="col-faixa">Faixa de Preço</div>
                <div className="col-periodicidade">Periodicidade</div>
              </div>
              {manualData.custosReferencia.map((custo, index) => (
                <div key={index} className="tabela-row">
                  <div className="col-servico">{custo.servico}</div>
                  <div className="col-faixa">{custo.faixa}</div>
                  <div className="col-periodicidade">{custo.periodicidade}</div>
                </div>
              ))}
            </div>

            <div className="custos-aviso">
              <span className="aviso-icon">ℹ️</span>
              <p>
                Os valores são apenas referências e podem variar significativamente. Sempre solicite orçamentos
                em diferentes oficinas e verifique a reputação antes de contratar o serviço.
              </p>
            </div>

            <div className="section-actions">
              <button
                type="button"
                className="to-shortcuts-btn"
                onClick={() => scrollToSection('topo')}
                aria-label="Voltar para o topo"
              >
                Topo
              </button>
            </div>
          </div>
        </section>

        {/* Dicas Finais */}
        <section className="manutencao-conclusao">
          <div className="conclusao-card">
            <h2>Lembre-se</h2>
            <div className="conclusao-content">
              <p>
                <strong>📖 Consulte sempre o manual do proprietário:</strong> Cada veículo tem suas especificidades
                e o manual é o guia definitivo para a manutenção do seu modelo específico.
              </p>
              <p>
                <strong>🔍 Escolha oficinas de confiança:</strong> Pesquise a reputação, peça indicações
                e sempre solicite orçamentos detalhados antes de autorizar qualquer serviço.
              </p>
              <p>
                <strong>📝 Mantenha um histórico:</strong> Guarde todas as notas fiscais e registros de manutenção.
                Isso valoriza o veículo na revenda e ajuda a acompanhar o que já foi feito.
              </p>
              <p>
                <strong>⚠️ Não ignore os sinais:</strong> Ruídos estranhos, luzes no painel ou mudanças no
                comportamento do veículo são avisos importantes. Investigue imediatamente.
              </p>
            </div>
          </div>
        </section>

        {/* Rodapé com botão voltar */}
        <div className="guia-footer-voltar">
          <span className="guia-cta" onClick={() => navigate('/guias')}>
            ← Voltar para Guias
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`guia-back-to-top ${showBackToTop ? 'is-visible' : ''}`}
        onClick={() => scrollToSection('topo')}
        aria-label="Voltar ao topo"
      >
        ↑
      </button>
    </div>
  );
};

export default ManutencaoPreventiva;
