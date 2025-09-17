import React, { useState, useEffect } from 'react';
import Menu from './components/Menu';
import ComponenteEstrelas from './components/ComponenteEstrelas';
import GlossarioExpandido from './components/GlossarioExpandido';
import { useAvaliacoes } from './hooks/useAvaliacoes';
import { glossarioMockData, outrosGuias } from './data/glossarioData';
import './page-Guias.css';

function PageGuias() {
  // Estados principais
  const [glossarioData, setGlossarioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    prioridade: '',
    cor: ''
  });

  // Hook customizado para avaliações
  const { avaliacoes, votosUsuario, avaliarGuia } = useAvaliacoes();

  // Carregar dados do glossário
  useEffect(() => {
    const carregarGlossario = async () => {
      try {
        const response = await fetch('/api/glossario-dashboard');
        if (!response.ok) {
          setGlossarioData(glossarioMockData);
        } else {
          const data = await response.json();
          setGlossarioData(data);
        }
      } catch (error) {
        console.error('Erro ao carregar glossário:', error);
        setGlossarioData(glossarioMockData);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    carregarGlossario();
  }, []);

  // Utilitários
  const toggleCard = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const limparFiltros = () => {
    setFiltros({ busca: '', prioridade: '', cor: '' });
  };

  const getPrioridadeColor = (prioridade) => {
    const cores = {
      'alta': '#dc2626',
      'média': '#f59e0b', 
      'baixa': '#16a34a'
    };
    return cores[prioridade?.toLowerCase()] || '#6b7280';
  };

  const getCorHex = (cor) => {
    const cores = {
      'vermelho': '#dc2626',
      'amarelo': '#f59e0b',
      'verde': '#16a34a',
      'azul': '#2563eb',
      'laranja': '#ea580c',
      'branco': '#f8fafc',
      'roxo': '#7c3aed'
    };
    return cores[cor?.toLowerCase()] || '#6b7280';
  };

  // Filtrar dados do glossário
  const dadosFiltrados = glossarioData.filter(item => {
    const matchBusca = !filtros.busca || 
      item.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      item.descricao.toLowerCase().includes(filtros.busca.toLowerCase());
    
    const matchPrioridade = !filtros.prioridade || item.prioridade === filtros.prioridade;
    const matchCor = !filtros.cor || item.cor === filtros.cor;
    
    return matchBusca && matchPrioridade && matchCor;
  });

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page">
        <div className="page-content">
          <div className="subtitle-container">
            <h2 className="page-title">Guias</h2>
          </div>
          
          <div className="guias-intro">
            <p>
              Encontre guias completos sobre manutenção, diagnóstico, peças e tudo relacionado ao seu veículo.
            </p>
          </div>

          {/* Grid de Cards dos Guias */}
          <div className="guias-grid">
            
            {/* Card do Glossário Automotivo - Expandível */}
            <div className={`guia-card glossario-card ${expandedCard === 'glossario' ? 'expanded' : ''}`}>
              <div className="guia-header" onClick={() => toggleCard('glossario')}>
                <div className="guia-icone">⚠️</div>
                <div className="guia-categoria">Diagnóstico</div>
              </div>
              
              <div className="guia-content">
                <h3 className="guia-titulo">Glossário Automotivo</h3>
                <p className="guia-subtitulo">Luzes do Painel - Entenda os avisos do seu veículo</p>
                <p className="guia-descricao">
                  Aprenda sobre as luzes de aviso do painel e o que fazer quando elas acendem.
                </p>
                
                {/* Sistema de Avaliação */}
                <div className="guia-avaliacao">
                  <ComponenteEstrelas 
                    guiaId="glossario-automotivo"
                    mediaAtual={avaliacoes['glossario-automotivo']?.media || 0}
                    totalVotos={avaliacoes['glossario-automotivo']?.total || 0}
                    votosUsuario={votosUsuario}
                    onAvaliar={avaliarGuia}
                  />
                </div>
                
                {expandedCard !== 'glossario' && (
                  <div className="guia-footer">
                    <span className="guia-cta" onClick={() => toggleCard('glossario')}>
                      Ver Glossário Completo →
                    </span>
                  </div>
                )}

                {/* Conteúdo expandido do Glossário */}
                {expandedCard === 'glossario' && (
                  <>
                    <GlossarioExpandido
                      loading={loading}
                      error={error}
                      filtros={filtros}
                      setFiltros={setFiltros}
                      dadosFiltrados={dadosFiltrados}
                      getPrioridadeColor={getPrioridadeColor}
                      getCorHex={getCorHex}
                      limparFiltros={limparFiltros}
                    />
                    
                    <div className="guia-footer">
                      <span className="guia-cta" onClick={() => toggleCard('glossario')}>
                        ← Minimizar Glossário
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Outros Cards de Guias */}
            {outrosGuias.map(guia => (
              <div key={guia.id} className="guia-card">
                <div className="guia-header">
                  <div className="guia-icone">{guia.icone}</div>
                  <div className="guia-categoria">{guia.categoria}</div>
                </div>
                
                <div className="guia-content">
                  <h3 className="guia-titulo">{guia.titulo}</h3>
                  <p className="guia-subtitulo">{guia.subtitulo}</p>
                  <p className="guia-descricao">{guia.descricao}</p>
                  
                  {/* Sistema de Avaliação */}
                  <div className="guia-avaliacao">
                    <ComponenteEstrelas 
                      guiaId={guia.id}
                      mediaAtual={avaliacoes[guia.id]?.media || 0}
                      totalVotos={avaliacoes[guia.id]?.total || 0}
                      votosUsuario={votosUsuario}
                      onAvaliar={avaliarGuia}
                    />
                  </div>
                </div>

                <div className="guia-footer">
                  <span className="guia-cta">Em breve →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Informações adicionais */}
          <div className="guias-footer">
            <div className="info-section">
              <h3>💡 Dica</h3>
              <p>
                Nossos guias são atualizados regularmente com as melhores práticas 
                e informações mais recentes do setor automotivo. Marque esta página 
                nos favoritos para consultar sempre que precisar!
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default PageGuias;