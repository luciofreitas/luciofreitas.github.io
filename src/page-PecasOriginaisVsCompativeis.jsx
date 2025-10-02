import React, { useState, useContext } from 'react';
import Menu from './components/Menu';
import MenuLogin from './components/MenuLogin';
import { AuthContext } from './App';
import './page-PecasOriginaisVsCompativeis.css';

const PecasOriginaisVsCompativeis = () => {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const [selectedCategory, setSelectedCategory] = useState('todas');

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
        situacoes: [
          'Veículo ainda está na garantia de fábrica',
          'Peças de segurança críticas (freios, suspensão, airbag)',
          'Veículo de alto valor que você pretende revender',
          'Histórico completo de manutenção é importante',
          'Peça apresentou defeito recorrente com compatíveis',
          'Modelo muito específico ou raro',
          'Sistema eletrônico complexo (injeção, ABS, etc.)',
          'Você busca máxima durabilidade sem preocupações'
        ]
      },
      {
        titulo: 'Use Peças Compatíveis Quando:',
        icone: '✅',
        situacoes: [
          'Veículo já saiu da garantia de fábrica',
          'Orçamento limitado para a manutenção',
          'Peça de desgaste natural (filtros, velas, lâmpadas)',
          'Veículo mais antigo ou de menor valor',
          'Marca compatível de reconhecida qualidade',
          'Peça estética ou de acabamento interno',
          'Urgência e peça original indisponível',
          'Relação custo-benefício é prioridade'
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

  return (
    <div className="pecas-page">
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      
      <div className="pecas-container">
        {/* Header */}
        <div className="pecas-header">
          <div className="header-icon">⚙️</div>
          <h1>Peças Originais vs Compatíveis</h1>
          <p className="header-subtitle">
            Entenda as diferenças, vantagens e desvantagens de cada tipo de peça para tomar a melhor decisão
            na manutenção do seu veículo.
          </p>
        </div>

        {/* Definições */}
        <section className="pecas-definicoes">
          <h2>O que são?</h2>
          <div className="definicoes-grid">
            <div className="definicao-card original">
              <div className="definicao-icon">{comparacaoData.definicoes.originais.icone}</div>
              <h3>{comparacaoData.definicoes.originais.titulo}</h3>
              <p className="definicao-texto">{comparacaoData.definicoes.originais.definicao}</p>
              <h4>Características:</h4>
              <ul>
                {comparacaoData.definicoes.originais.caracteristicas.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="definicao-card compativel">
              <div className="definicao-icon">{comparacaoData.definicoes.compativeis.icone}</div>
              <h3>{comparacaoData.definicoes.compativeis.titulo}</h3>
              <p className="definicao-texto">{comparacaoData.definicoes.compativeis.definicao}</p>
              <h4>Características:</h4>
              <ul>
                {comparacaoData.definicoes.compativeis.caracteristicas.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Comparação Detalhada */}
        <section className="pecas-comparacao">
          <h2>Comparação Detalhada</h2>
          <p className="section-subtitle">
            Análise ponto a ponto para ajudar na sua decisão
          </p>
          
          <div className="comparacao-grid">
            {comparacaoData.comparacoes.map((comp, index) => (
              <div key={index} className="comparacao-card">
                <h3 className="comparacao-categoria">{comp.categoria}</h3>
                
                <div className="comparacao-sides">
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
            ))}
          </div>
        </section>

        {/* Quando Usar */}
        <section className="pecas-quando-usar">
          <h2>Quando Usar Cada Tipo?</h2>
          
          <div className="quando-grid">
            {comparacaoData.quandoUsar.map((guia, index) => (
              <div key={index} className="quando-card">
                <div className="quando-header">
                  <span className="quando-icon">{guia.icone}</span>
                  <h3>{guia.titulo}</h3>
                </div>
                <ul className="quando-lista">
                  {guia.situacoes.map((situacao, idx) => (
                    <li key={idx}>
                      <span className="bullet">•</span>
                      {situacao}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Marcas Renomadas */}
        <section className="pecas-marcas">
          <h2>Marcas Compatíveis Renomadas</h2>
          <p className="section-subtitle">
            Fabricantes de peças compatíveis com excelente reputação no mercado
          </p>
          
          <div className="marcas-grid">
            {comparacaoData.marcasRenomadas.map((marca, index) => (
              <div key={index} className="marca-card">
                <div className="marca-header">
                  <h3>{marca.nome}</h3>
                  <span className={`qualidade-badge ${marca.qualidade.toLowerCase()}`}>
                    {marca.qualidade}
                  </span>
                </div>
                <p className="marca-especialidade">
                  <strong>Especialidade:</strong> {marca.especialidade}
                </p>
                <p className="marca-descricao">{marca.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dicas de Economia */}
        <section className="pecas-dicas-economia">
          <h2>Dicas para Economizar</h2>
          
          <div className="dicas-economia-grid">
            {comparacaoData.dicasEconomia.map((dica, index) => (
              <div key={index} className="dica-economia-card">
                <div className="dica-icon">{dica.icone}</div>
                <h3>{dica.titulo}</h3>
                <p>{dica.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Alertas Importantes */}
        <section className="pecas-alertas">
          <h2>Alertas Importantes</h2>
          
          <div className="alertas-grid">
            {comparacaoData.alertas.map((alerta, index) => (
              <div key={index} className="alerta-card">
                <h3>{alerta.titulo}</h3>
                <ul>
                  {alerta.conteudo.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Conclusão */}
        <section className="pecas-conclusao">
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
        </section>
      </div>
    </div>
  );
};

export default PecasOriginaisVsCompativeis;
