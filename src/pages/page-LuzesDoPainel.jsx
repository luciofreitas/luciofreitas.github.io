import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/Menu';
import MenuLogin from '../components/MenuLogin';
import { AuthContext } from '../App';
import ComponenteEstrelas from '../components/ComponenteEstrelas';
import { useAvaliacoes } from '../hooks/useAvaliacoes';
import { apiService } from '../utils/apiService';
import { glossarioMockData } from '../data/glossarioData';
import '../styles/pages/page-LuzesDoPainel.css';

function LuzesDoPainel() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  // Estados principais
  const [glossarioData, setGlossarioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        const data = await apiService.getGlossarioDashboard();
        const arrayData = Array.isArray(data) ? data : (data ? [data] : glossarioMockData);
        setGlossarioData(arrayData);
      } catch (error) {
        console.error('Erro ao carregar glossário:', error);
        setGlossarioData(Array.isArray(glossarioMockData) ? glossarioMockData : []);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    carregarGlossario();
  }, []);

  // Funções auxiliares
  const limparFiltros = () => {
    setFiltros({ busca: '', prioridade: '', cor: '' });
  };

  const getPrioridadeColor = (prioridade) => {
    const cores = {
      'Alta': '#dc2626',
      'Média': '#f59e0b',
      'Baixa': '#16a34a'
    };
    return cores[prioridade] || '#6b7280';
  };

  const getCorHex = (cor) => {
    const cores = {
      'vermelho': '#dc2626',
      'amarelo': '#f59e0b',
      'verde': '#16a34a',
      'azul': '#2563eb',
      'laranja': '#ea580c'
    };
    return cores[cor.toLowerCase()] || '#6b7280';
  };

  // Aplicar filtros
  const dadosFiltrados = glossarioData.filter(luz => {
    const matchBusca = !filtros.busca || 
      luz.nome.toLowerCase().includes(filtros.busca.toLowerCase());
    const matchPrioridade = !filtros.prioridade || 
      luz.prioridade === filtros.prioridade;
    const matchCor = !filtros.cor || 
      luz.cor.toLowerCase() === filtros.cor.toLowerCase();
    
    return matchBusca && matchPrioridade && matchCor;
  });

  return (
    <>
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      <div className="page-wrapper menu-page">
        <div className="page-content">
          {/* Header com ícone */}
          <div className="luzes-header">
            <div className="header-icon">⚠️</div>
            <h2 className="page-title">Luzes do Painel</h2>
            <p className="header-subtitle">
              Entenda os avisos do seu veículo e saiba como agir quando as luzes do painel acenderem.
              Mantenha-se seguro e evite problemas maiores.
            </p>
          </div>

        {/* Conteúdo do Glossário */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando glossário...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h2>Erro ao carregar</h2>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Filtros */}
            <div className="filtros-section">
              <div className="filtros-row">
                <div className="filtro-group">
                  <label>Buscar:</label>
                  <input
                    type="text"
                    className="busca-input"
                    placeholder="Digite o nome da luz..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                  />
                </div>
                
                <div className="filtro-group">
                  <label>Prioridade:</label>
                  <select
                    value={filtros.prioridade}
                    onChange={(e) => setFiltros({...filtros, prioridade: e.target.value})}
                  >
                    <option value="">Todas</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
                
                <div className="filtro-group">
                  <label>Cor:</label>
                  <select
                    value={filtros.cor}
                    onChange={(e) => setFiltros({...filtros, cor: e.target.value})}
                  >
                    <option value="">Todas</option>
                    <option value="vermelho">Vermelho</option>
                    <option value="amarelo">Amarelo</option>
                    <option value="verde">Verde</option>
                    <option value="azul">Azul</option>
                    <option value="laranja">Laranja</option>
                  </select>
                </div>
                
                <button className="btn-limpar-filtros" onClick={limparFiltros}>
                  Limpar
                </button>
              </div>
              
              <div className="resultados-info">
                {dadosFiltrados.length} luz(es) encontrada(s)
              </div>
            </div>

            {/* Grid de Luzes */}
            {dadosFiltrados.length === 0 ? (
              <div className="no-results">
                <p>Nenhuma luz encontrada com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="luzes-grid">
                {dadosFiltrados.map(luz => (
                  <div key={luz.id} className="luz-card">
                    <div className="luz-header">
                      <div className="luz-icone">{luz.icone}</div>
                      <div className="luz-info">
                        <h3 className="luz-nome">{luz.nome}</h3>
                        <div className="luz-indicators">
                          <span 
                            className="prioridade-badge"
                            style={{ backgroundColor: getPrioridadeColor(luz.prioridade) }}
                          >
                            {luz.prioridade}
                          </span>
                          <div 
                            className="cor-indicator"
                            style={{ backgroundColor: getCorHex(luz.cor) }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="luz-content">
                      <div className="luz-descricao">
                        {luz.descricao}
                      </div>

                      {luz.acoes && luz.acoes.length > 0 && (
                        <div className="luz-section">
                          <h4>⚡ O que fazer:</h4>
                          <ul className="acoes-list">
                            {luz.acoes.map((acao, index) => (
                              <li key={index}>{acao}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {luz.causas && luz.causas.length > 0 && (
                        <div className="luz-section">
                          <h4>🔍 Possíveis causas:</h4>
                          <ul className="causas-list">
                            {luz.causas.map((causa, index) => (
                              <li key={index}>{causa}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer do glossário */}
            <div className="glossario-footer-section">
              <div className="info-section">
                <h3>🎨 Legenda das Cores</h3>
                <div className="cores-legend">
                  <div className="cor-item">
                    <div className="cor-dot" style={{ backgroundColor: '#dc2626' }}></div>
                    <span><strong>Vermelho:</strong> Pare imediatamente</span>
                  </div>
                  <div className="cor-item">
                    <div className="cor-dot" style={{ backgroundColor: '#f59e0b' }}></div>
                    <span><strong>Amarelo:</strong> Atenção necessária</span>
                  </div>
                  <div className="cor-item">
                    <div className="cor-dot" style={{ backgroundColor: '#16a34a' }}></div>
                    <span><strong>Verde:</strong> Sistema funcionando</span>
                  </div>
                  <div className="cor-item">
                    <div className="cor-dot" style={{ backgroundColor: '#2563eb' }}></div>
                    <span><strong>Azul:</strong> Informativo</span>
                  </div>
                  <div className="cor-item">
                    <div className="cor-dot" style={{ backgroundColor: '#ea580c' }}></div>
                    <span><strong>Laranja:</strong> Atenção</span>
                  </div>
                </div>
              </div>
              
              <div className="disclaimer">
                <p>
                  ⚠️ <strong>Aviso:</strong> Este glossário é apenas informativo. 
                  Sempre consulte um mecânico qualificado para diagnósticos precisos.
                </p>
              </div>
            </div>
          </>
        )}

          {/* Rodapé com botão voltar */}
          <div className="guia-footer-voltar">
            <span className="guia-cta" onClick={() => navigate('/guias')}>
              ← Voltar para Guias
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default LuzesDoPainel;
