import React, { useState, useEffect, useContext } from 'react';
import Menu from '../components/Menu';
import '../styles/pages/page-Recalls.css';
import recallsData from '../data/recalls.json';
import { AuthContext } from '../App';
import { getCars } from '../services/carService';

function PageRecalls() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const [recalls, setRecalls] = useState([]);
  const [filteredRecalls, setFilteredRecalls] = useState([]);
  const [searchMarca, setSearchMarca] = useState('');
  const [searchModelo, setSearchModelo] = useState('');
  const [searchAno, setSearchAno] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [carros, setCarros] = useState([]);
  const [carroSelecionado, setCarroSelecionado] = useState('');

  // Carrega carros do usuário quando logado
  useEffect(() => {
    const loadUserCars = async () => {
      if (usuarioLogado) {
        const userId = usuarioLogado.id || usuarioLogado.email;
        const userCars = await getCars(userId);
        setCarros(userCars);
      } else {
        setCarros([]);
        setCarroSelecionado('');
      }
    };
    loadUserCars();
  }, [usuarioLogado]);

  // Quando seleciona um carro, preenche apenas marca e modelo (não o ano)
  // Recalls usam intervalos de anos, então não faz sentido filtrar por ano específico
  const handleCarroChange = (e) => {
    const carId = e.target.value;
    setCarroSelecionado(carId);
    
    if (!carId) {
      // Se desmarcou, não limpa os campos (permite busca manual)
      return;
    }

    const carro = carros.find(c => c.id === carId);
    if (carro) {
      setSearchMarca(carro.marca);
      setSearchModelo(carro.modelo);
      // NÃO preenche o ano - recalls trabalham com intervalo de anos
    }
  };

  useEffect(() => {
    setRecalls(recallsData);
    setFilteredRecalls(recallsData);
  }, []);

  useEffect(() => {
    let filtered = recalls;

    if (searchMarca) {
      filtered = filtered.filter(recall => 
        recall.marca.toLowerCase().includes(searchMarca.toLowerCase())
      );
    }

    if (searchModelo) {
      filtered = filtered.filter(recall => 
        recall.modelo.toLowerCase().includes(searchModelo.toLowerCase())
      );
    }

    if (searchAno) {
      const ano = parseInt(searchAno);
      filtered = filtered.filter(recall => 
        ano >= recall.anoInicial && ano <= recall.anoFinal
      );
    }

    if (selectedRisk) {
      filtered = filtered.filter(recall => recall.risco === selectedRisk);
    }

    setFilteredRecalls(filtered);
  }, [searchMarca, searchModelo, searchAno, selectedRisk, recalls]);

  const getRiskClass = (risk) => {
    switch (risk) {
      case 'Alto': return 'risk-high';
      case 'Médio': return 'risk-medium';
      case 'Baixo': return 'risk-low';
      default: return 'risk-unknown';
    }
  };

  const getStatusClass = (status) => {
    return status === 'Ativo' ? 'status-active' : 'status-completed';
  };

  const clearFilters = () => {
    setSearchMarca('');
    setSearchModelo('');
    setSearchAno('');
    setSelectedRisk('');
  };

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page">
        <div className="page-content recalls-section">
          <h2 className="page-title">Recalls por Modelo</h2>
          
          <div className="recalls-intro-wrapper">
            <div className="recalls-intro">
              <p>
                Consulte recalls oficiais por marca, modelo e ano do seu veículo. MantenhaSe informado sobre questões de segurança.
              </p>
            </div>
          </div>

          {/* Filtros de busca */}
          <div className="recalls-search">
            {/* Dropdown de carros - só aparece se usuário logado e tiver carros */}
            {usuarioLogado && carros.length > 0 && (
              <div className="recalls-car-selector">
                <label htmlFor="carro-selecionado">Buscar recalls para um carro específico (opcional)</label>
                <select
                  id="carro-selecionado"
                  value={carroSelecionado}
                  onChange={handleCarroChange}
                  className="recalls-input"
                >
                  <option value="">-- Busca geral (deixar em branco) --</option>
                  {carros.map(carro => (
                    <option key={carro.id} value={carro.id}>
                      {carro.marca} {carro.modelo} {carro.ano}{carro.isDefault ? ' ⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="search-row">
              <div className="search-field">
                <label htmlFor="marca">Marca</label>
                <input 
                  type="text" 
                  id="marca"
                  value={searchMarca}
                  onChange={(e) => setSearchMarca(e.target.value)}
                  placeholder="Ex: Ford, Chevrolet, Volkswagen"
                  className="recalls-input"
                />
              </div>
              
              <div className="search-field">
                <label htmlFor="modelo">Modelo</label>
                <input 
                  type="text" 
                  id="modelo"
                  value={searchModelo}
                  onChange={(e) => setSearchModelo(e.target.value)}
                  placeholder="Ex: Ka, Onix, Gol"
                  className="recalls-input"
                />
              </div>
              
              <div className="search-field">
                <label htmlFor="ano">Ano</label>
                <input 
                  type="number" 
                  id="ano"
                  value={searchAno}
                  onChange={(e) => setSearchAno(e.target.value)}
                  placeholder="Ex: 2020"
                  min="1990"
                  max="2025"
                  className="recalls-input"
                />
              </div>
              
              <div className="search-field">
                <label htmlFor="risco">Nível de Risco</label>
                <select 
                  id="risco"
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className="recalls-select"
                >
                  <option value="">Todos</option>
                  <option value="Alto">Alto</option>
                  <option value="Médio">Médio</option>
                  <option value="Baixo">Baixo</option>
                </select>
              </div>
            </div>
            
            <div className="search-actions">
              <button onClick={clearFilters} className="recalls-btn recalls-btn-secondary">
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Resultados */}
          <div className="recalls-results">
            <div className="results-header">
              <h3>
                {filteredRecalls.length} recall{filteredRecalls.length !== 1 ? 's' : ''} encontrado{filteredRecalls.length !== 1 ? 's' : ''}
              </h3>
            </div>

            <div className="recalls-list">
              {filteredRecalls.map((recall) => (
                <div key={recall.recallId} className="recall-card">
                  <div className="recall-header">
                    <div className="recall-title">
                      <h4>{recall.marca} {recall.modelo}</h4>
                      <span className="recall-years">
                        {recall.anoInicial} - {recall.anoFinal}
                      </span>
                    </div>
                    <div className="recall-badges">
                      <span className={`risk-badge ${getRiskClass(recall.risco)}`}>
                        Risco {recall.risco}
                      </span>
                      <span className={`status-badge ${getStatusClass(recall.status)}`}>
                        {recall.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="recall-info">
                    <div className="recall-component">
                      <strong>Componente:</strong> {recall.componente}
                    </div>
                    <div className="recall-date">
                      <strong>Data de Publicação:</strong> {new Date(recall.dataPublicacao).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="recall-description">
                    <h5>Descrição do Problema</h5>
                    <p>{recall.descricao}</p>
                  </div>
                  
                  <div className="recall-action">
                    <h5>Ação Recomendada</h5>
                    <p>{recall.acaoRecomendada}</p>
                  </div>
                  
                  <div className="recall-details">
                    <div className="recall-vin">
                      <strong>Veículos Afetados:</strong> {recall.vinAffected}
                    </div>
                    <div className="recall-source">
                      <strong>Fonte:</strong> {recall.fonteOficial}
                    </div>
                  </div>
                  
                  <div className="recall-id">
                    ID: {recall.recallId}
                  </div>
                </div>
              ))}
            </div>

            {filteredRecalls.length === 0 && (
              <div className="no-results">
                <p>Nenhum recall encontrado para os critérios selecionados.</p>
                <p>Isso pode significar que não há recalls ativos para este veículo ou que os dados ainda não foram atualizados.</p>
              </div>
            )}
          </div>

          {/* Informações importantes */}
          <div className="recalls-footer">
            <div className="important-info">
              <h3>Informações Importantes</h3>
              <ul>
                <li><strong>Gratuito:</strong> Todo atendimento de recall é gratuito, mesmo fora da garantia.</li>
                <li><strong>Agendamento:</strong> Entre em contato com a concessionária autorizada para agendar.</li>
                <li><strong>Documentos:</strong> Leve o documento do veículo e um documento pessoal com foto.</li>
                <li><strong>Prazo:</strong> Recalls não têm prazo de validade - podem ser realizados a qualquer momento.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PageRecalls;
