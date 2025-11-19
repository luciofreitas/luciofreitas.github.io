import React, { useState, useEffect } from 'react';
import { Menu } from '../components';
import { apiService } from '../utils/apiService';
import '../styles/pages/page-GlossarioAutomotivo.css';

function PageGlossarioAutomotivo() {
  const [luzes, setLuzes] = useState([]);
  const [luzesFiltered, setLuzesFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    categoria: '',
    prioridade: '',
    cor: '',
    busca: ''
  });

  // Categorias disponíveis
  const categorias = [
    { value: '', label: 'Todas as categorias' },
    { value: 'motor', label: 'Motor' },
    { value: 'freios', label: 'Freios' },
    { value: 'eletrico', label: 'Elétrico' },
    { value: 'seguranca', label: 'Segurança' },
    { value: 'arrefecimento', label: 'Arrefecimento' },
    { value: 'pneus', label: 'Pneus' },
    { value: 'combustivel', label: 'Combustível' },
    { value: 'emissoes', label: 'Emissões' }
  ];

  const prioridades = [
    { value: '', label: 'Todas as prioridades' },
    { value: 'Crítico', label: 'Crítico' },
    { value: 'Alto', label: 'Alto' },
    { value: 'Médio', label: 'Médio' },
    { value: 'Baixo', label: 'Baixo' }
  ];

  const cores = [
    { value: '', label: 'Todas as cores' },
    { value: 'vermelho', label: 'Vermelho' },
    { value: 'amarelo', label: 'Amarelo' },
    { value: 'verde', label: 'Verde' },
    { value: 'azul', label: 'Azul' }
  ];

  // Carregar dados das luzes
  useEffect(() => {
    const fetchLuzes = async () => {
      try {
        const data = await apiService.getLuzesPainel();
        const luzesData = data.luzes || data;
        // Garantir que sempre seja um array
        const arrayData = Array.isArray(luzesData) ? luzesData : (luzesData ? [luzesData] : []);
        setLuzes(arrayData);
        setLuzesFiltered(arrayData);
      } catch (err) {
        setError(err.message || 'Erro ao carregar dados das luzes do painel');
        console.error('Erro:', err);
        // Definir arrays vazios em caso de erro
        setLuzes([]);
        setLuzesFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLuzes();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = Array.isArray(luzes) ? luzes : [];

    // Filtrar por categoria
    if (filtros.categoria) {
      filtered = filtered.filter(luz => luz && luz.categoria === filtros.categoria);
    }

    // Filtrar por prioridade
    if (filtros.prioridade) {
      filtered = filtered.filter(luz => luz && luz.prioridade === filtros.prioridade);
    }

    // Filtrar por cor
    if (filtros.cor) {
      filtered = filtered.filter(luz => luz && luz.cor === filtros.cor);
    }

    // Busca por texto
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      filtered = filtered.filter(luz => {
        if (!luz) return false;
        return (luz.nome && luz.nome.toLowerCase().includes(busca)) ||
               (luz.descricao && luz.descricao.toLowerCase().includes(busca)) ||
               (Array.isArray(luz.causasComuns) && luz.causasComuns.some(causa => 
                 causa && causa.toLowerCase().includes(busca)
               ));
      });
    }

    setLuzesFiltered(filtered);
  }, [filtros, luzes]);

  const handleFiltroChange = (tipo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [tipo]: valor
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      categoria: '',
      prioridade: '',
      cor: '',
      busca: ''
    });
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'Crítico': return '#dc2626';
      case 'Alto': return '#ea580c';
      case 'Médio': return '#ca8a04';
      case 'Baixo': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getCorIndicator = (cor) => {
    switch (cor) {
      case 'vermelho': return '#dc2626';
      case 'amarelo': return '#eab308';
      case 'verde': return '#16a34a';
      case 'azul': return '#2563eb';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <>
        <Menu />
      <div className="site-header-spacer"></div>
      <div className="page-wrapper menu-page">
          <div className="page-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Carregando glossário automotivo...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Menu />
      <div className="site-header-spacer"></div>
      <div className="page-wrapper menu-page">
          <div className="page-content">
            <div className="error-container">
              <h2>Erro ao carregar dados</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Menu />
      <div className="site-header-spacer"></div>
      <div className="page-wrapper menu-page">
        <div className="page-content">
          <h2 className="page-title">Glossário Automotivo</h2>
          
          <div className="glossario-intro">
            <p>
              Luzes do Painel - Entenda os avisos do seu veículo
            </p>
          </div>

          {/* Filtros e Busca */}
          <div className="filtros-section">
            <div className="filtros-row">
              <div className="filtro-group">
                <label>Buscar:</label>
                <input
                  type="text"
                  placeholder="Digite o nome da luz ou sintoma..."
                  value={filtros.busca}
                  onChange={(e) => handleFiltroChange('busca', e.target.value)}
                  className="busca-input"
                />
              </div>

              <div className="filtro-group">
                <label>Categoria:</label>
                <select
                  value={filtros.categoria}
                  onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                >
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-group">
                <label>Prioridade:</label>
                <select
                  value={filtros.prioridade}
                  onChange={(e) => handleFiltroChange('prioridade', e.target.value)}
                >
                  {prioridades.map(prio => (
                    <option key={prio.value} value={prio.value}>{prio.label}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-group">
                <label>Cor da Luz:</label>
                <select
                  value={filtros.cor}
                  onChange={(e) => handleFiltroChange('cor', e.target.value)}
                >
                  {cores.map(cor => (
                    <option key={cor.value} value={cor.value}>{cor.label}</option>
                  ))}
                </select>
              </div>

              <button onClick={limparFiltros} className="btn-limpar-filtros">
                Limpar Filtros
              </button>
            </div>

            <div className="resultados-info">
              Exibindo {luzesFiltered.length} de {luzes.length} luzes do painel
            </div>
          </div>

          {/* Grid de Luzes */}
          <div className="luzes-grid">
            {luzesFiltered.map(luz => (
              <div key={luz.id} className="luz-card">
                <div className="luz-header">
                    <div className="luz-icone">
                      {luz.icone ? (
                        <img src={luz.icone} alt={luz.nome} className="luz-icone-img" />
                      ) : (
                        luz.icone
                      )}
                    </div>
                  <div className="luz-info">
                    <h3 className="luz-nome">{luz.nome}</h3>
                    <div className="luz-indicators">
                      <span 
                        className="prioridade-badge"
                        style={{ backgroundColor: getPrioridadeColor(luz.prioridade) }}
                      >
                        {luz.prioridade}
                      </span>
                      <span 
                        className="cor-indicator"
                        style={{ backgroundColor: getCorIndicator(luz.cor) }}
                        title={`Cor: ${luz.cor}`}
                      ></span>
                    </div>
                  </div>
                </div>

                <div className="luz-content">
                  <p className="luz-descricao">{luz.descricao}</p>

                  <div className="luz-section">
                    <h4>O que fazer:</h4>
                    <ul className="acoes-list">
                      {luz.acoes.map((acao, index) => (
                        <li key={index}>{acao}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="luz-section">
                    <h4>Causas comuns:</h4>
                    <ul className="causas-list">
                      {luz.causasComuns.map((causa, index) => (
                        <li key={index}>{causa}</li>
                      ))}
                    </ul>
                  </div>

                  {luz.tempoEstimado && (
                    <div className="luz-meta">
                      <span><strong>Tempo estimado:</strong> {luz.tempoEstimado}</span>
                      <span><strong>Dificuldade:</strong> {luz.dificuldade}</span>
                    </div>
                  )}

                  {luz.recallRelacionado && (
                    <div className="recall-alert">
                      ⚠️ Pode estar relacionado a recalls conhecidos
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {luzesFiltered.length === 0 && (
            <div className="no-results">
              <p>Nenhuma luz encontrada com os filtros aplicados.</p>
              <button onClick={limparFiltros} className="btn-limpar-filtros">
                Limpar Filtros
              </button>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="glossario-footer">
            <div className="info-section">
              <h3>Como interpretar as cores das luzes:</h3>
              <div className="cores-legend">
                <div className="cor-item">
                  <span className="cor-dot" style={{backgroundColor: '#dc2626'}}></span>
                  <span><strong>Vermelho:</strong> Pare imediatamente - problema crítico</span>
                </div>
                <div className="cor-item">
                  <span className="cor-dot" style={{backgroundColor: '#eab308'}}></span>
                  <span><strong>Amarelo:</strong> Atenção - manutenção necessária</span>
                </div>
                <div className="cor-item">
                  <span className="cor-dot" style={{backgroundColor: '#16a34a'}}></span>
                  <span><strong>Verde:</strong> Sistema funcionando/ativado</span>
                </div>
                <div className="cor-item">
                  <span className="cor-dot" style={{backgroundColor: '#2563eb'}}></span>
                  <span><strong>Azul:</strong> Informativo (farol alto, etc.)</span>
                </div>
              </div>
            </div>

            <div className="disclaimer">
              <p><strong>Importante:</strong> Este glossário é apenas informativo. Sempre consulte um mecânico qualificado para diagnósticos e reparos. Em caso de emergência, pare o veículo em local seguro.</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default PageGlossarioAutomotivo;
