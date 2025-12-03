import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { buscarMarcas, buscarModelos, buscarVeiculosComFiltros } from '../services/fipeService';
import '../styles/pages/page-TabelaFIPE.css';

export default function TabelaFIPE() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterModelo, setFilterModelo] = useState('');
  const [filterAno, setFilterAno] = useState('');
  
  // Estados para dados da API
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [mesReferencia, setMesReferencia] = useState('');
  
  // Verifica se o usuário é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  // Carrega marcas ao montar o componente
  useEffect(() => {
    async function carregarMarcas() {
      const marcasData = await buscarMarcas();
      setMarcas(marcasData);
    }
    carregarMarcas();
  }, []);

  // Carrega veículos iniciais (populares)
  useEffect(() => {
    async function carregarVeiculosIniciais() {
      setLoading(true);
      const veiculosData = await buscarVeiculosComFiltros({});
      setVeiculos(veiculosData);
      if (veiculosData.length > 0 && veiculosData[0].referencia) {
        setMesReferencia(veiculosData[0].referencia);
      }
      setLoading(false);
    }
    carregarVeiculosIniciais();
  }, []);

  // Carrega modelos quando marca é selecionada
  useEffect(() => {
    async function carregarModelos() {
      if (filterMarca) {
        setLoadingModelos(true);
        const marcaSelecionada = marcas.find(m => m.codigo === filterMarca);
        const modelosData = await buscarModelos(filterMarca);
        setModelos(modelosData);
        setLoadingModelos(false);
        
        // Busca veículos da marca selecionada
        setLoading(true);
        const veiculosData = await buscarVeiculosComFiltros({
          codigoMarca: filterMarca,
          nomeMarca: marcaSelecionada?.nome
        });
        setVeiculos(veiculosData);
        if (veiculosData.length > 0 && veiculosData[0].referencia) {
          setMesReferencia(veiculosData[0].referencia);
        }
        setLoading(false);
      } else {
        setModelos([]);
        setFilterModelo('');
      }
    }
    carregarModelos();
  }, [filterMarca, marcas]);

  // Busca veículos quando modelo é selecionado
  useEffect(() => {
    async function buscarPorModelo() {
      if (filterMarca && filterModelo) {
        setLoading(true);
        const marcaSelecionada = marcas.find(m => m.codigo === filterMarca);
        const veiculosData = await buscarVeiculosComFiltros({
          codigoMarca: filterMarca,
          codigoModelo: filterModelo,
          nomeMarca: marcaSelecionada?.nome
        });
        setVeiculos(veiculosData);
        if (veiculosData.length > 0 && veiculosData[0].referencia) {
          setMesReferencia(veiculosData[0].referencia);
        }
        setLoading(false);
      }
    }
    buscarPorModelo();
  }, [filterModelo, filterMarca, marcas]);

  // Extrair anos únicos para o filtro
  const anosUnicos = useMemo(() => {
    const anos = [...new Set(veiculos.map(item => item.ano))];
    return anos.sort((a, b) => b - a);
  }, [veiculos]);

  // Filtrar dados com base nos filtros ativos
  const dadosFiltrados = useMemo(() => {
    return veiculos.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.codigo && item.codigo.includes(searchTerm));
      
      const matchAno = filterAno === '' || item.ano.toString() === filterAno;

      return matchSearch && matchAno;
    });
  }, [searchTerm, filterAno, veiculos]);

  const limparFiltros = () => {
    setSearchTerm('');
    setFilterMarca('');
    setFilterModelo('');
    setFilterAno('');
  };

  return (
    <>
      <Menu />
      <div className="site-header-spacer"></div>
      <div className="page-wrapper">
        <div className="page-content" id="tabela-fipe">
          <h2 className="page-title">Tabela FIPE</h2>
          
          <div className="fipe-intro">
            <p>
              Consulte os preços de referência de veículos atualizados pela Tabela FIPE.
              {mesReferencia && <span className="fipe-mes-ref"> Mês de referência: <strong>{mesReferencia}</strong></span>}
            </p>
          </div>

          {/* Filtros de Busca */}
          <div className="fipe-filtros">
            <div className="filtro-group">
              <label htmlFor="search" className="filtro-label">Buscar por modelo ou código:</label>
              <input
                type="text"
                id="search"
                className="filtro-input"
                placeholder="Digite o modelo ou código FIPE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filtro-group">
              <label htmlFor="marca" className="filtro-label">Marca:</label>
              <select
                id="marca"
                className="filtro-select"
                value={filterMarca}
                onChange={(e) => {
                  setFilterMarca(e.target.value);
                  setFilterModelo('');
                }}
              >
                <option value="">Todas as marcas</option>
                {marcas.map(marca => (
                  <option key={marca.codigo} value={marca.codigo}>{marca.nome}</option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="modelo" className="filtro-label">Modelo:</label>
              <select
                id="modelo"
                className="filtro-select"
                value={filterModelo}
                onChange={(e) => setFilterModelo(e.target.value)}
                disabled={!filterMarca || loadingModelos}
              >
                <option value="">
                  {!filterMarca ? 'Selecione uma marca primeiro' : loadingModelos ? 'Carregando...' : 'Todos os modelos'}
                </option>
                {modelos.map(modelo => (
                  <option key={modelo.codigo} value={modelo.codigo}>{modelo.nome}</option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="ano" className="filtro-label">Ano:</label>
              <select
                id="ano"
                className="filtro-select"
                value={filterAno}
                onChange={(e) => setFilterAno(e.target.value)}
              >
                <option value="">Todos os anos</option>
                {anosUnicos.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>

            <button className="filtro-btn-limpar" onClick={limparFiltros}>
              Limpar Filtros
            </button>
          </div>

          {/* Contador de Resultados */}
          <div className="fipe-resultados-info">
            <p>
              Exibindo <strong>{dadosFiltrados.length}</strong> veículo{dadosFiltrados.length !== 1 ? 's' : ''}
              {loading && <span className="fipe-loading"> (Carregando...)</span>}
            </p>
          </div>

          {/* Tabela FIPE */}
          <div className="fipe-tabela-container">
            {loading && veiculos.length === 0 ? (
              <div className="fipe-loading-container">
                <div className="fipe-spinner"></div>
                <p>Carregando dados da Tabela FIPE...</p>
              </div>
            ) : dadosFiltrados.length > 0 ? (
              <table className="fipe-tabela">
                <thead>
                  <tr>
                    <th>Código FIPE</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Ano</th>
                    <th>Combustível</th>
                    <th>Preço Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map(item => (
                    <tr key={item.id}>
                      <td data-label="Código FIPE">{item.codigo || 'N/A'}</td>
                      <td data-label="Marca">{item.marca}</td>
                      <td data-label="Modelo">{item.modelo}</td>
                      <td data-label="Ano">{item.ano}</td>
                      <td data-label="Combustível">{item.combustivel || 'N/A'}</td>
                      <td data-label="Preço Médio" className="fipe-preco">
                        <div className="fipe-preco-wrapper">
                          <span className={isPro ? '' : 'fipe-preco-blur'}>{item.preco}</span>
                          {!isPro && (
                            <div className="fipe-preco-lock">
                              <img src="/images/padlock.png" alt="Cadeado" className="fipe-padlock-icon" />
                              <div className="fipe-preco-tooltip">
                                Seja Pro para visualizar os preços da Tabela FIPE
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="fipe-sem-resultados">
                <p>Nenhum veículo encontrado com os filtros aplicados.</p>
                <button className="filtro-btn-limpar" onClick={limparFiltros}>
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>

          {/* CTA para usuários não-Pro */}
          {!isPro && dadosFiltrados.length > 0 && (
            <div className="fipe-cta-pro">
              <div className="fipe-cta-content">
                <h3>🔓 Desbloqueie os Preços da Tabela FIPE</h3>
                <p>
                  Assine a Versão Pro e tenha acesso completo aos preços atualizados 
                  de todos os veículos da Tabela FIPE, além de outros benefícios exclusivos!
                </p>
                <button 
                  className="fipe-cta-button"
                  onClick={() => navigate('/seja-pro')}
                >
                  Assinar Versão Pro
                </button>
              </div>
            </div>
          )}

          {/* Aviso sobre atualização */}
          <div className="fipe-aviso">
            <p>
              <strong>Atenção:</strong> Os valores apresentados são preços médios de mercado 
              coletados pela Tabela FIPE e servem apenas como referência. Os preços reais 
              podem variar conforme o estado de conservação, quilometragem, opcionais e região.
            </p>
            {mesReferencia && (
              <p className="fipe-atualizacao">
                Última atualização: {mesReferencia}
              </p>
            )}
            <p className="fipe-fonte">
              Fonte: API Tabela FIPE - Dados oficiais
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
