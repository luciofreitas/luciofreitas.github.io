import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuLogin } from '../components';
import { AuthContext } from '../App';
import '../styles/pages/page-PecasOriginaisVsCompativeis.css';

const PecasOriginaisVsCompativeis = () => {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('todas');
  
  // Track which cards are expanded (show content) vs collapsed (header only)
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (cardKey) => {
    setExpandedCards(prev => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    // scrollIntoView funciona mesmo quando quem rola não é o window
    // (ex.: algum container com overflow).
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Ajuda leitores de tela a entenderem que mudou de contexto.
    window.setTimeout(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        // ignore
      }
    }, 200);
  };

  const comparacaoData = {
    definicoes: {
      originais: {
        titulo: 'Peças Originais',
        icone: '🏭',
        definicao: 'São peças fabricadas pela montadora do veículo ou por fornecedores oficiais autorizados pela montadora. Possuem o selo e garantia do fabricante original.',
        caracteristicas: [
          'Fabricadas com os mesmos padrões da montadora',
          'Possuem garantia direta do fabricante',
          'Geralmente mais caras',
          'Encontradas em concessionárias autorizadas',
          'Embalagem com selo de autenticidade',
          'Código de peça específico da montadora'
        ]
      },
      compativeis: {
        titulo: 'Peças Compatíveis (Aftermarket)',
        icone: '🔧',
        definicao: 'São peças fabricadas por empresas terceirizadas que não são autorizadas pela montadora, mas seguem as especificações técnicas originais para serem compatíveis com o veículo.',
        caracteristicas: [
          'Fabricadas por empresas independentes',
          'Preço geralmente mais acessível',
          'Garantia do fabricante da peça',
          'Disponíveis em diversas lojas de autopeças',
          'Qualidade varia conforme o fabricante',
          'Várias marcas e opções disponíveis'
        ]
      }
    },
    comparacoes: [
      {
        categoria: 'Qualidade',
        original: {
          texto: 'Qualidade garantida e testada pela montadora',
          pontos: ['Rigoroso controle de qualidade', 'Durabilidade comprovada', 'Encaixe perfeito garantido'],
          nota: 10
        },
        compativel: {
          texto: 'Qualidade varia conforme fabricante',
          pontos: ['Marcas premium têm qualidade similar', 'Marcas desconhecidas podem ter problemas', 'Importante verificar certificações'],
          nota: 7
        }
      },
      {
        categoria: 'Preço',
        original: {
          texto: 'Preço mais elevado',
          pontos: ['30% a 70% mais caro', 'Custo-benefício em longo prazo', 'Menos opções de negociação'],
          nota: 5
        },
        compativel: {
          texto: 'Preço mais acessível',
          pontos: ['Economia significativa', 'Várias faixas de preço', 'Melhor custo-benefício imediato'],
          nota: 9
        }
      },
      {
        categoria: 'Garantia',
        original: {
          texto: 'Garantia da montadora',
          pontos: ['Garantia de fábrica ampla', 'Aceita em qualquer concessionária', 'Cobertura mais abrangente'],
          nota: 10
        },
        compativel: {
          texto: 'Garantia do fabricante da peça',
          pontos: ['Varia de 3 meses a 1 ano', 'Limitada ao fabricante', 'Pode exigir nota fiscal'],
          nota: 7
        }
      },
      {
        categoria: 'Disponibilidade',
        original: {
          texto: 'Disponível em concessionárias',
          pontos: ['Pode demorar para chegar', 'Estoque limitado em algumas regiões', 'Importação pode ser necessária'],
          nota: 6
        },
        compativel: {
          texto: 'Amplamente disponível',
          pontos: ['Fácil de encontrar', 'Várias opções de fornecedores', 'Pronta entrega na maioria'],
          nota: 9
        }
      },
      {
        categoria: 'Durabilidade',
        original: {
          texto: 'Alta durabilidade comprovada',
          pontos: ['Testadas em condições extremas', 'Vida útil longa', 'Mantém características originais'],
          nota: 10
        },
        compativel: {
          texto: 'Durabilidade depende da marca',
          pontos: ['Marcas premium são duráveis', 'Marcas genéricas podem durar menos', 'Importante pesquisar avaliações'],
          nota: 7
        }
      },
      {
        categoria: 'Garantia de Veículo',
        original: {
          texto: 'Não afeta garantia do veículo',
          pontos: ['Recomendada para carros na garantia', 'Mantém histórico da concessionária', 'Sem risco de perda de garantia'],
          nota: 10
        },
        compativel: {
          texto: 'Pode afetar garantia em alguns casos',
          pontos: ['Verifique termos da garantia', 'Problema deve ser comprovadamente da peça', 'Após garantia, sem restrições'],
          nota: 6
        }
      }
    ],
    quandoUsar: [
      {
        titulo: 'Use Peças Originais Quando:',
        icone: '✅',
        tipo: 'original',
        situacoes: [
          { icone: '🛡️', texto: 'Veículo ainda está na ', destaque: 'garantia de fábrica' },
          { icone: '🚨', texto: 'Peças de ', destaque: 'segurança críticas', complemento: ' (freios, suspensão, airbag)' },
          { icone: '💎', texto: 'Veículo de ', destaque: 'alto valor', complemento: ' que você pretende revender' },
          { icone: '📋', texto: 'Histórico completo de manutenção é ', destaque: 'importante' },
          { icone: '⚠️', texto: 'Peça apresentou ', destaque: 'defeito recorrente', complemento: ' com compatíveis' },
          { icone: '🎯', texto: 'Modelo muito ', destaque: 'específico ou raro' },
          { icone: '🔌', texto: 'Sistema eletrônico ', destaque: 'complexo', complemento: ' (injeção, ABS, etc.)' },
          { icone: '⭐', texto: 'Você busca ', destaque: 'máxima durabilidade', complemento: ' sem preocupações' }
        ]
      },
      {
        titulo: 'Use Peças Compatíveis Quando:',
        icone: '✅',
        tipo: 'compativel',
        situacoes: [
          { icone: '📅', texto: 'Veículo já saiu da ', destaque: 'garantia de fábrica' },
          { icone: '💰', texto: 'Orçamento ', destaque: 'limitado', complemento: ' para a manutenção' },
          { icone: '🔧', texto: 'Peça de ', destaque: 'desgaste natural', complemento: ' (filtros, velas, lâmpadas)' },
          { icone: '🚗', texto: 'Veículo mais ', destaque: 'antigo', complemento: ' ou de menor valor' },
          { icone: '⭐', texto: 'Marca compatível de ', destaque: 'reconhecida qualidade' },
          { icone: '🎨', texto: 'Peça ', destaque: 'estética', complemento: ' ou de acabamento interno' },
          { icone: '⏰', texto: 'Urgência e peça original ', destaque: 'indisponível' },
          { icone: '⚖️', texto: 'Relação ', destaque: 'custo-benefício', complemento: ' é prioridade' }
        ]
      }
    ],
    marcasRenomadas: [
      {
        nome: 'Bosch',
        especialidade: 'Sistema elétrico, freios, injeção',
        qualidade: 'Premium',
        descricao: 'Fornecedora oficial de várias montadoras, qualidade comparável às originais.'
      },
      {
        nome: 'Mahle',
        especialidade: 'Motor, filtros, arrefecimento',
        qualidade: 'Premium',
        descricao: 'Fabricante alemão com altíssima qualidade, fornece para montadoras.'
      },
      {
        nome: 'Monroe',
        especialidade: 'Suspensão e amortecedores',
        qualidade: 'Premium',
        descricao: 'Referência mundial em sistemas de suspensão.'
      },
      {
        nome: 'NGK',
        especialidade: 'Velas de ignição',
        qualidade: 'Premium',
        descricao: 'Líder mundial em velas, fornece para montadoras japonesas.'
      },
      {
        nome: 'Cofap',
        especialidade: 'Amortecedores, suspensão',
        qualidade: 'Boa',
        descricao: 'Marca brasileira consolidada, boa relação custo-benefício.'
      },
      {
        nome: 'Tecfil',
        especialidade: 'Filtros em geral',
        qualidade: 'Boa',
        descricao: 'Marca nacional com boa qualidade e preço acessível.'
      },
      {
        nome: 'TRW',
        especialidade: 'Freios e suspensão',
        qualidade: 'Premium',
        descricao: 'Fornecedora de montadoras, especialmente em sistemas de freio.'
      },
      {
        nome: 'Nakata',
        especialidade: 'Suspensão e direção',
        qualidade: 'Boa',
        descricao: 'Marca japonesa com amplo catálogo e qualidade consistente.'
      }
    ],
    dicasEconomia: [
      {
        titulo: 'Pesquise Preços',
        descricao: 'Compare preços em diferentes lojas e online. A variação pode chegar a 50%.',
        icone: '💰'
      },
      {
        titulo: 'Compre em Conjunto',
        descricao: 'Ao fazer várias trocas, negocie desconto ou peça frete grátis.',
        icone: '📦'
      },
      {
        titulo: 'Verifique Promoções',
        descricao: 'Grandes varejistas oferecem promoções em datas especiais.',
        icone: '🎯'
      },
      {
        titulo: 'Avalie Marcas Intermediárias',
        descricao: 'Nem sempre o mais barato ou mais caro é a melhor opção.',
        icone: '⚖️'
      },
      {
        titulo: 'Peça Original Usada',
        descricao: 'Para alguns itens, peças de desmanches são viáveis e econômicas.',
        icone: '♻️'
      },
      {
        titulo: 'Certifique-se da Necessidade',
        descricao: 'Nem sempre é preciso trocar. Consulte um mecânico de confiança.',
        icone: '🔍'
      }
    ],
    alertas: [
      {
        titulo: '⚠️ Cuidado com Peças Falsificadas',
        conteudo: [
          'Verifique sempre se há selo de autenticidade',
          'Desconfie de preços extremamente baixos',
          'Compre em lojas estabelecidas e confiáveis',
          'Peças falsificadas podem causar acidentes graves',
          'Embalagens originais têm código de barras e QR code'
        ]
      },
      {
        titulo: '⚠️ Atenção à Garantia do Veículo',
        conteudo: [
          'Leia o manual e termos da garantia do fabricante',
          'Peças não originais podem cancelar garantia em alguns casos',
          'Guarde todas as notas fiscais de manutenção',
          'Consulte a concessionária antes em caso de dúvida',
          'Após o fim da garantia, você tem liberdade total'
        ]
      },
      {
        titulo: '⚠️ Instalação Profissional',
        conteudo: [
          'Use mecânico qualificado independente da peça',
          'Instalação incorreta pode danificar a peça',
          'Guarde a nota e comprovante de instalação',
          'Erro de instalação pode invalidar garantia',
          'Peças de segurança exigem cuidado redobrado'
        ]
      }
    ]
  };

  const navSections = [
    { id: 'definicoes', label: 'O que são?' },
    { id: 'comparacao', label: 'Comparação' },
    { id: 'quando-usar', label: 'Quando usar' },
    { id: 'marcas', label: 'Marcas' },
    { id: 'economia', label: 'Economia' },
    { id: 'alertas', label: 'Alertas' },
    { id: 'conclusao', label: 'Conclusão' }
  ];

  const comparisonCategories = ['todas', ...comparacaoData.comparacoes.map(c => c.categoria)];
  const filteredComparacoes =
    selectedCategory === 'todas'
      ? comparacaoData.comparacoes
      : comparacaoData.comparacoes.filter(c => c.categoria === selectedCategory);

  return (
    <div className="pecas-page" id="topo" tabIndex={-1}>
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      <div className="site-header-spacer"></div>
      
      <div className="pecas-container">
        {/* Header */}
        <div className="pecas-header">
          <h1>Peças Originais vs Compatíveis</h1>
          <p className="header-subtitle">
            Entenda as diferenças, vantagens e desvantagens de cada tipo de peça para tomar a melhor decisão
            na manutenção do seu veículo.
          </p>
        </div>

        {/* Atalhos (mobile) */}
        <div className="pecas-nav" id="pecas-atalhos" tabIndex={-1} aria-label="Atalhos do guia">
          <span className="pecas-nav-title">Navegar:</span>
          <div className="pecas-nav-pills" role="navigation" aria-label="Seções do guia">
            {navSections.map((s) => (
              <button
                key={s.id}
                type="button"
                className="pecas-nav-pill"
                onClick={() => scrollToSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Definições */}
        <section className="pecas-definicoes" id="definicoes" tabIndex={-1}>
          <h2>O que são?</h2>
          <div className="definicoes-grid">
            {(() => {
              const isExpanded = !!expandedCards['def-original'];
              const contentId = 'definicao-content-def-original';

              return (
            <div 
              className={`definicao-card original ${expandedCards['def-original'] ? 'expanded' : 'collapsed'}`}
            >
              <div 
                className="definicao-header"
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={contentId}
                onClick={() => toggleCard('def-original')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCard('def-original');
                  }
                }}
              >
                <div className="definicao-icon">{comparacaoData.definicoes.originais.icone}</div>
                <div className="definicao-title-row">
                  <h3>{comparacaoData.definicoes.originais.titulo}</h3>
                  <span className={`pecas-expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                </div>
              </div>
              <div className="definicao-content" id={contentId}>
                <p className="definicao-texto">{comparacaoData.definicoes.originais.definicao}</p>
                <h4>Características:</h4>
                <ul>
                  {comparacaoData.definicoes.originais.caracteristicas.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
              );
            })()}

            {(() => {
              const isExpanded = !!expandedCards['def-compativel'];
              const contentId = 'definicao-content-def-compativel';

              return (
            <div 
              className={`definicao-card compativel ${expandedCards['def-compativel'] ? 'expanded' : 'collapsed'}`}
            >
              <div 
                className="definicao-header"
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={contentId}
                onClick={() => toggleCard('def-compativel')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCard('def-compativel');
                  }
                }}
              >
                <div className="definicao-icon">{comparacaoData.definicoes.compativeis.icone}</div>
                <div className="definicao-title-row">
                  <h3>{comparacaoData.definicoes.compativeis.titulo}</h3>
                  <span className={`pecas-expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                </div>
              </div>
              <div className="definicao-content" id={contentId}>
                <p className="definicao-texto">{comparacaoData.definicoes.compativeis.definicao}</p>
                <h4>Características:</h4>
                <ul>
                  {comparacaoData.definicoes.compativeis.caracteristicas.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
              );
            })()}
          </div>

          <div className="pecas-section-actions">
            <button
              type="button"
              className="pecas-top-btn"
              onClick={() => scrollToSection('topo')}
              aria-label="Voltar ao topo"
            >
              Topo
            </button>
          </div>
        </section>

        {/* Comparação Detalhada */}
        <section className="pecas-comparacao" id="comparacao" tabIndex={-1}>
          <h2>Comparação Detalhada</h2>
          <p className="section-subtitle">
            Análise ponto a ponto para ajudar na sua decisão
          </p>

          <div className="pecas-filter" role="tablist" aria-label="Filtrar categorias">
            {comparisonCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`pecas-filter-pill ${selectedCategory === cat ? 'is-active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                role="tab"
                aria-selected={selectedCategory === cat}
              >
                {cat === 'todas' ? 'Todas' : cat}
              </button>
            ))}
          </div>
          
          <div className="comparacao-grid">
            {filteredComparacoes.map((comp, index) => {
              const cardKey = `comp-${index}`;
              const isExpanded = expandedCards[cardKey];
              const sidesId = `comparacao-sides-${cardKey}`;
              
              return (
              <div 
                key={index} 
                className={`comparacao-card ${isExpanded ? 'expanded' : 'collapsed'}`}
              >
                <div
                  className="comparacao-header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={sidesId}
                  onClick={() => toggleCard(cardKey)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCard(cardKey);
                    }
                  }}
                >
                  <h3 className="comparacao-categoria">{comp.categoria}</h3>
                  <span className={`pecas-expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                </div>
                
                <div className="comparacao-sides" id={sidesId}>
                  <div className="side original">
                    <div className="side-header">
                      <span className="side-badge">Original</span>
                      <span className="side-nota">{comp.original.nota}/10</span>
                    </div>
                    <p className="side-texto">{comp.original.texto}</p>
                    <ul className="side-pontos">
                      {comp.original.pontos.map((ponto, idx) => (
                        <li key={idx}>{ponto}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="side compativel">
                    <div className="side-header">
                      <span className="side-badge">Compatível</span>
                      <span className="side-nota">{comp.compativel.nota}/10</span>
                    </div>
                    <p className="side-texto">{comp.compativel.texto}</p>
                    <ul className="side-pontos">
                      {comp.compativel.pontos.map((ponto, idx) => (
                        <li key={idx}>{ponto}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          <div className="pecas-section-actions">
            <button
              type="button"
              className="pecas-top-btn"
              onClick={() => scrollToSection('topo')}
              aria-label="Voltar ao topo"
            >
              Topo
            </button>
          </div>
        </section>

        {/* Quando Usar */}
        <section className="pecas-quando-usar" id="quando-usar" tabIndex={-1}>
          <h2>Quando Usar Cada Tipo?</h2>
          
          <div className="quando-grid">
            {comparacaoData.quandoUsar.map((guia, index) => {
              const cardKey = `quando-${index}`;
              const isExpanded = expandedCards[cardKey];
              const listId = `quando-lista-${cardKey}`;
              
              return (
              <div 
                key={index} 
                className={`quando-card quando-card-${guia.tipo} ${isExpanded ? 'expanded' : 'collapsed'}`}
              >
                <div 
                  className="quando-header"
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
                  <span className="quando-icon">{guia.icone}</span>
                  <h3>{guia.titulo}</h3>
                  <span className={`pecas-expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                </div>
                <ul className="quando-lista" id={listId}>
                  {guia.situacoes.map((situacao, idx) => (
                    <li key={idx}>
                      <span className="situacao-icone">{situacao.icone}</span>
                      <span className="situacao-texto">
                        {situacao.texto}
                        <strong>{situacao.destaque}</strong>
                        {situacao.complemento}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
            })}
          </div>

          <div className="pecas-section-actions">
            <button
              type="button"
              className="pecas-top-btn"
              onClick={() => scrollToSection('topo')}
              aria-label="Voltar ao topo"
            >
              Topo
            </button>
          </div>
        </section>

        {/* Marcas Renomadas */}
        <section className="pecas-marcas" id="marcas" tabIndex={-1}>
          <h2>Marcas Compatíveis Renomadas</h2>
          <p className="section-subtitle">
            Fabricantes de peças compatíveis com excelente reputação no mercado
          </p>
          
          <div className="marcas-grid">
            {comparacaoData.marcasRenomadas.map((marca, index) => {
              const cardKey = `marca-${index}`;
              const isExpanded = expandedCards[cardKey];
              const contentId = `marca-content-${cardKey}`;
              
              return (
              <div 
                key={index} 
                className={`marca-card ${isExpanded ? 'expanded' : 'collapsed'}`}
              >
                <div 
                  className="marca-header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  onClick={() => toggleCard(cardKey)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCard(cardKey);
                    }
                  }}
                >
                  <h3>{marca.nome}</h3>
                  <span className={`qualidade-badge ${marca.qualidade.toLowerCase()}`}>
                    {marca.qualidade}
                  </span>
                  <span className={`pecas-expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                </div>
                <p className="marca-especialidade" id={contentId}>
                  <strong>Especialidade:</strong> {marca.especialidade}
                </p>
                <p className="marca-descricao">{marca.descricao}</p>
              </div>
            );
            })}
          </div>

          <div className="pecas-section-actions">
            <button
              type="button"
              className="pecas-top-btn"
              onClick={() => scrollToSection('topo')}
              aria-label="Voltar ao topo"
            >
              Topo
            </button>
          </div>
        </section>

        {/* Dicas de Economia */}
        <section className="pecas-dicas-economia" id="economia" tabIndex={-1}>
          <h2>Dicas para Economizar</h2>
          
          <div className="dicas-economia-grid">
            {comparacaoData.dicasEconomia.map((dica, index) => {
              const cardKey = `economia-${index}`;
              const isExpanded = expandedCards[cardKey];
              const contentId = `economia-content-${cardKey}`;
              
              return (
              <div 
                key={index} 
                className={`dica-economia-card ${isExpanded ? 'expanded' : 'collapsed'}`}
              >
                <div 
                  className="dica-economia-header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  onClick={() => toggleCard(cardKey)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCard(cardKey);
                    }
                  }}
                >
                  <div className="dica-icon">{dica.icone}</div>
                  <h3>{dica.titulo}</h3>
                  <span className={`pecas-expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                </div>
                <p className="dica-economia-content" id={contentId}>{dica.descricao}</p>
              </div>
            );
            })}
          </div>

          <div className="pecas-section-actions">
            <button
              type="button"
              className="pecas-top-btn"
              onClick={() => scrollToSection('topo')}
              aria-label="Voltar ao topo"
            >
              Topo
            </button>
          </div>
        </section>

        {/* Alertas Importantes */}
        <section className="pecas-alertas" id="alertas" tabIndex={-1}>
          <h2>Alertas Importantes</h2>
          
          <div className="alertas-grid">
            {comparacaoData.alertas.map((alerta, index) => {
              const cardKey = `alerta-${index}`;
              const isExpanded = expandedCards[cardKey];
              const listId = `alerta-lista-${cardKey}`;
              
              return (
              <div 
                key={index} 
                className={`alerta-card ${isExpanded ? 'expanded' : 'collapsed'}`}
              >
                <div
                  className="alerta-header"
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
                  <h3>{alerta.titulo}</h3>
                  <span className={`pecas-expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                </div>
                <ul id={listId}>
                  {alerta.conteudo.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            );
            })}
          </div>

          <div className="pecas-section-actions">
            <button
              type="button"
              className="pecas-top-btn"
              onClick={() => scrollToSection('topo')}
              aria-label="Voltar ao topo"
            >
              Topo
            </button>
          </div>
        </section>

        {/* Conclusão */}
        <section className="pecas-conclusao" id="conclusao" tabIndex={-1}>
          <div className="conclusao-card">
            <h2>Decisão Informada</h2>
            <div className="conclusao-content">
              <p>
                <strong>Não existe escolha certa ou errada absoluta.</strong> A decisão entre peças originais
                e compatíveis deve considerar múltiplos fatores: condição do veículo, orçamento disponível,
                tipo de peça, urgência da troca e suas prioridades pessoais.
              </p>
              <p>
                <strong>Para segurança, nunca economize.</strong> Itens críticos como freios, suspensão,
                airbags e componentes estruturais merecem atenção especial. Nesses casos, considere sempre
                peças originais ou compatíveis de marcas premium reconhecidas.
              </p>
              <p>
                <strong>Pesquise e compare.</strong> Avalie avaliações de outros usuários, consulte mecânicos
                de confiança e compare preços. Uma escolha bem informada é sempre a melhor escolha.
              </p>
              <p>
                <strong>Guarde a documentação.</strong> Independente da escolha, sempre guarde notas fiscais,
                certificados de garantia e comprovantes de instalação. Isso protege seus direitos e agrega
                valor ao veículo.
              </p>
            </div>
          </div>

          <div className="pecas-section-actions">
            <button
              type="button"
              className="pecas-top-btn"
              onClick={() => scrollToSection('topo')}
              aria-label="Voltar ao topo"
            >
              Topo
            </button>
          </div>
        </section>

        {/* Rodapé com botão voltar */}
        <div className="guia-footer-voltar">
          <span className="guia-cta" onClick={() => navigate('/guias')}>
            ← Voltar para Guias
          </span>
        </div>
      </div>
    </div>
  );
};

export default PecasOriginaisVsCompativeis;
