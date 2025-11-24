import React from 'react';
import { getCorClass, getPrioridadeClass } from '../utils/colorUtils';

const GlossarioExpandido = ({ 
  loading, 
  error, 
  filtros, 
  setFiltros, 
  dadosFiltrados, 
  getPrioridadeColor, 
  limparFiltros 
}) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando glossário...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erro ao carregar</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="glossario-content">
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
            <div key={luz.id} className={`luz-card ${getCorClass(luz.cor)}`}>
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
                    <div className={`luz-indicators ${getPrioridadeClass(luz.prioridade)}`}>
                          <span 
                      className={`prioridade-badge ${getPrioridadeClass(luz.prioridade)}`}
                    >
                      {luz.prioridade}
                    </span>
                    <div 
                      className={`cor-indicator ${getCorClass(luz.cor)}`}
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
      <div className="glossario-footer">
        <div className="info-section">
          <h3>🎨 Legenda das Cores</h3>
          <div className="cores-legend">
            <div className="cor-item">
              <div className={`cor-dot ${getCorClass('vermelho')}`}></div>
              <span><strong>Vermelho:</strong> Pare imediatamente</span>
            </div>
            <div className="cor-item">
              <div className={`cor-dot ${getCorClass('amarelo')}`}></div>
              <span><strong>Amarelo:</strong> Atenção necessária</span>
            </div>
            <div className="cor-item">
              <div className={`cor-dot ${getCorClass('verde')}`}></div>
              <span><strong>Verde:</strong> Sistema funcionando</span>
            </div>
            <div className="cor-item">
              <div className={`cor-dot ${getCorClass('azul')}`}></div>
              <span><strong>Azul:</strong> Informativo</span>
            </div>
            <div className="cor-item">
              <div className={`cor-dot ${getCorClass('laranja')}`}></div>
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
    </div>
  );
};

export default GlossarioExpandido;