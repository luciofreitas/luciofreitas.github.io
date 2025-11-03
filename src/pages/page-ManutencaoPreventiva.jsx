import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuLogin } from '../components';
import { AuthContext } from '../App';
import '../styles/pages/page-ManutencaoPreventiva.css';

const ManutencaoPreventiva = () => {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const manualData = {
    quilometragens: [
      {
        km: '5.000 km',
        itens: [
          { item: 'Troca de óleo do motor', prioridade: 'alta' },
          { item: 'Troca do filtro de óleo', prioridade: 'alta' },
          { item: 'Verificação de níveis (freio, arrefecimento, direção)', prioridade: 'alta' },
          { item: 'Calibragem dos pneus', prioridade: 'média' },
          { item: 'Inspeção visual de vazamentos', prioridade: 'média' }
        ]
      },
      {
        km: '10.000 km',
        itens: [
          { item: 'Troca de óleo do motor', prioridade: 'alta' },
          { item: 'Troca do filtro de óleo', prioridade: 'alta' },
          { item: 'Troca do filtro de ar', prioridade: 'alta' },
          { item: 'Troca do filtro de ar condicionado', prioridade: 'média' },
          { item: 'Rodízio de pneus', prioridade: 'média' },
          { item: 'Verificação do sistema de freios', prioridade: 'alta' },
          { item: 'Limpeza dos bicos injetores', prioridade: 'média' }
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
          { item: 'Troca de óleo do motor', prioridade: 'alta' },
          { item: 'Troca do filtro de óleo', prioridade: 'alta' },
          { item: 'Troca do filtro de ar', prioridade: 'alta' },
          { item: 'Troca das velas de ignição', prioridade: 'alta' },
          { item: 'Limpeza do corpo de borboleta', prioridade: 'média' },
          { item: 'Verificação da correia dentada', prioridade: 'alta' },
          { item: 'Troca do fluido de freio', prioridade: 'alta' }
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
        km: '50.000 km',
        itens: [
          { item: 'Troca de óleo do motor', prioridade: 'alta' },
          { item: 'Troca do filtro de óleo', prioridade: 'alta' },
          { item: 'Troca do filtro de ar', prioridade: 'alta' },
          { item: 'Troca da correia dentada', prioridade: 'alta' },
          { item: 'Troca da correia do alternador', prioridade: 'média' },
          { item: 'Substituição das pastilhas de freio', prioridade: 'alta' },
          { item: 'Verificação do sistema de direção', prioridade: 'média' }
        ]
      },
      {
        km: '60.000 km',
        itens: [
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
        periodicidade: 'A cada 5.000 - 10.000 km'
      },
      {
        servico: 'Troca de filtro de ar',
        faixa: 'R$ 50 - R$ 150',
        periodicidade: 'A cada 10.000 km'
      },
      {
        servico: 'Troca de pastilhas de freio',
        faixa: 'R$ 200 - R$ 500',
        periodicidade: 'A cada 20.000 - 40.000 km'
      },
      {
        servico: 'Troca de correia dentada',
        faixa: 'R$ 600 - R$ 1.500',
        periodicidade: 'A cada 40.000 - 60.000 km'
      },
      {
        servico: 'Alinhamento e balanceamento',
        faixa: 'R$ 100 - R$ 200',
        periodicidade: 'A cada 10.000 km ou quando necessário'
      },
      {
        servico: 'Troca de velas de ignição',
        faixa: 'R$ 150 - R$ 400',
        periodicidade: 'A cada 30.000 km'
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
    <div className="manutencao-page">
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      <div className="site-header-spacer"></div>
      
      <div className="manutencao-container">
        <div className="manutencao-header">
          <div className="header-icon">🔧</div>
          <h1>Guia de Manutenção Preventiva</h1>
          <p className="header-subtitle">
            Mantenha seu veículo sempre em perfeito estado seguindo este guia completo de manutenção preventiva.
            Evite surpresas, economize e prolongue a vida útil do seu carro.
          </p>
        </div>

        {/* Introdução */}
        <section className="manutencao-intro">
          <div className="intro-card">
            <h2>Por que fazer manutenção preventiva?</h2>
            <div className="intro-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">💰</span>
                <h3>Economia</h3>
                <p>Prevenir é sempre mais barato que corrigir. Uma manutenção regular evita gastos maiores com reparos emergenciais.</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🛡️</span>
                <h3>Segurança</h3>
                <p>Veículo bem mantido oferece mais segurança para você e sua família, evitando falhas mecânicas em momentos críticos.</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⏰</span>
                <h3>Durabilidade</h3>
                <p>Manutenção adequada prolonga significativamente a vida útil do veículo e mantém seu valor de revenda.</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🚀</span>
                <h3>Performance</h3>
                <p>Motor e componentes bem cuidados mantêm a potência, eficiência e conforto originais do veículo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cronograma de Manutenção */}
        <section className="manutencao-cronograma">
          <h2>Cronograma de Manutenção por Quilometragem</h2>
          <p className="section-description">
            Siga este cronograma baseado na quilometragem do seu veículo. Os itens variam conforme o fabricante,
            sempre consulte o manual do proprietário do seu carro.
          </p>
          
          <div className="cronograma-grid">
            {manualData.quilometragens.map((etapa, index) => (
              <div key={index} className="cronograma-card">
                <div className="cronograma-header">
                  <h3>{etapa.km}</h3>
                  <span className="itens-count">{etapa.itens.length} itens</span>
                </div>
                <ul className="cronograma-lista">
                  {etapa.itens.map((item, idx) => (
                    <li key={idx} className={`prioridade-${item.prioridade}`}>
                      <span className="prioridade-badge">{item.prioridade}</span>
                      {item.item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="legenda-prioridades">
            <h4>Legenda de Prioridades:</h4>
            <div className="legenda-items">
              <span className="legenda-item alta">
                <span className="legenda-badge">alta</span> Essencial - não pode ser adiado
              </span>
              <span className="legenda-item media">
                <span className="legenda-badge">média</span> Importante - agende em breve
              </span>
            </div>
          </div>
        </section>

        {/* Dicas Práticas */}
        <section className="manutencao-dicas">
          <h2>Dicas Práticas de Manutenção</h2>
          
          <div className="dicas-grid">
            {manualData.dicasPraticas.map((dica, index) => (
              <div key={index} className="dica-card">
                <h3>{dica.titulo}</h3>
                <p className="dica-descricao">{dica.descricao}</p>
                <ul className="dica-lista">
                  {dica.lista.map((item, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Custos de Referência */}
        <section className="manutencao-custos">
          <h2>Custos Médios de Referência</h2>
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
    </div>
  );
};

export default ManutencaoPreventiva;
