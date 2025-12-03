import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { buscarMarcas, buscarModelos, buscarAnos, buscarValor } from '../services/fipeService';
import '../styles/pages/page-TabelaFIPE.css';

export default function TabelaFIPE() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  
  // Estados para filtros
  const [marcaSelecionada, setMarcaSelecionada] = useState('');
  const [modeloSelecionado, setModeloSelecionado] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('');
  
  // Estados para dados da API
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  
  // Estados de loading
  const [loadingMarcas, setLoadingMarcas] = useState(true);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [loadingAnos, setLoadingAnos] = useState(false);
  const [loadingVeiculo, setLoadingVeiculo] = useState(false);
  
  const [mesReferencia, setMesReferencia] = useState('');
  
  // Verifica se o usuário é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  // Carrega marcas ao montar o componente
  useEffect(() => {
    async function carregarMarcas() {
      setLoadingMarcas(true);
      const marcasData = await buscarMarcas();
      setMarcas(marcasData);
      setLoadingMarcas(false);
    }
    carregarMarcas();
  }, []);

  // Carrega modelos quando marca é selecionada
  useEffect(() => {
    async function carregarModelos() {
      if (marcaSelecionada) {
        setLoadingModelos(true);
        setModelos([]);
        setAnos([]);
        setModeloSelecionado('');
        setAnoSelecionado('');
        
        const modelosData = await buscarModelos(marcaSelecionada);
        setModelos(modelosData);
        setLoadingModelos(false);
      } else {
        setModelos([]);
        setAnos([]);
        setModeloSelecionado('');
        setAnoSelecionado('');
      }
    }
    carregarModelos();
  }, [marcaSelecionada]);

  // Carrega anos quando modelo é selecionado
  useEffect(() => {
    async function carregarAnos() {
      if (marcaSelecionada && modeloSelecionado) {
        setLoadingAnos(true);
        setAnos([]);
        setAnoSelecionado('');
        
        const anosData = await buscarAnos(marcaSelecionada, modeloSelecionado);
        setAnos(anosData);
        setLoadingAnos(false);
      } else {
        setAnos([]);
        setAnoSelecionado('');
      }
    }
    carregarAnos();
  }, [marcaSelecionada, modeloSelecionado]);

  // Busca veículo quando ano é selecionado
  useEffect(() => {
    async function buscarVeiculo() {
      if (marcaSelecionada && modeloSelecionado && anoSelecionado) {
        setLoadingVeiculo(true);
        
        const valor = await buscarValor(marcaSelecionada, modeloSelecionado, anoSelecionado);
        
        if (valor) {
          const marcaNome = marcas.find(m => m.codigo === marcaSelecionada)?.nome || '';
          const anoNome = anos.find(a => a.codigo === anoSelecionado)?.nome || '';
          
          const veiculo = {
            id: `${marcaSelecionada}-${modeloSelecionado}-${anoSelecionado}`,
            marca: marcaNome,
            modelo: valor.Modelo,
            ano: parseInt(anoNome),
            preco: valor.Valor,
            codigo: valor.CodigoFipe,
            combustivel: valor.Combustivel,
            referencia: valor.MesReferencia
          };
          
          setVeiculos([veiculo]);
          setMesReferencia(valor.MesReferencia);
        }
        
        setLoadingVeiculo(false);
      }
    }
    buscarVeiculo();
  }, [marcaSelecionada, modeloSelecionado, anoSelecionado, marcas, anos]);

  const limparFiltros = () => {
    setMarcaSelecionada('');
    setModeloSelecionado('');
    setAnoSelecionado('');
    setVeiculos([]);
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
            <p className="fipe-instrucoes">
              💡 Selecione a marca, modelo e ano do veículo para consultar o valor na Tabela FIPE.
            </p>
          </div>

          {/* Filtros de Busca */}
          <div className="fipe-filtros">
            <div className="filtro-group">
              <label htmlFor="marca" className="filtro-label">
                1. Marca: <span className="filtro-obrigatorio">*</span>
              </label>
              <select
                id="marca"
                className="filtro-select"
                value={marcaSelecionada}
                onChange={(e) => setMarcaSelecionada(e.target.value)}
                disabled={loadingMarcas}
              >
                <option value="">
                  {loadingMarcas ? 'Carregando marcas...' : 'Selecione a marca'}
                </option>
                {marcas.map(marca => (
                  <option key={marca.codigo} value={marca.codigo}>{marca.nome}</option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="modelo" className="filtro-label">
                2. Modelo: <span className="filtro-obrigatorio">*</span>
              </label>
              <select
                id="modelo"
                className="filtro-select"
                value={modeloSelecionado}
                onChange={(e) => setModeloSelecionado(e.target.value)}
                disabled={!marcaSelecionada || loadingModelos}
              >
                <option value="">
                  {!marcaSelecionada 
                    ? 'Selecione uma marca primeiro' 
                    : loadingModelos 
                    ? 'Carregando modelos...' 
                    : 'Selecione o modelo'}
                </option>
                {modelos.map(modelo => (
                  <option key={modelo.codigo} value={modelo.codigo}>{modelo.nome}</option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="ano" className="filtro-label">
                3. Ano: <span className="filtro-obrigatorio">*</span>
              </label>
              <select
                id="ano"
                className="filtro-select"
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(e.target.value)}
                disabled={!modeloSelecionado || loadingAnos}
              >
                <option value="">
                  {!modeloSelecionado 
                    ? 'Selecione um modelo primeiro' 
                    : loadingAnos 
                    ? 'Carregando anos...' 
                    : 'Selecione o ano'}
                </option>
                {anos.map(ano => (
                  <option key={ano.codigo} value={ano.codigo}>{ano.nome}</option>
                ))}
              </select>
            </div>

            {(marcaSelecionada || modeloSelecionado || anoSelecionado) && (
              <button className="filtro-btn-limpar" onClick={limparFiltros}>
                Limpar Seleção
              </button>
            )}
          </div>

          {/* Tabela FIPE */}
          <div className="fipe-tabela-container">
            {loadingVeiculo ? (
              <div className="fipe-loading-container">
                <div className="fipe-spinner"></div>
                <p>Buscando informações do veículo na Tabela FIPE...</p>
              </div>
            ) : veiculos.length > 0 ? (
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
                  {veiculos.map(item => (
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
              <div className="fipe-vazio">
                <div className="fipe-vazio-icone">🔍</div>
                <h3>Nenhum veículo selecionado</h3>
                <p>
                  Utilize os filtros acima para selecionar a marca, modelo e ano do veículo 
                  que deseja consultar na Tabela FIPE.
                </p>
                <div className="fipe-vazio-passos">
                  <div className="passo">
                    <span className="passo-numero">1</span>
                    <span>Escolha a marca</span>
                  </div>
                  <div className="passo">
                    <span className="passo-numero">2</span>
                    <span>Selecione o modelo</span>
                  </div>
                  <div className="passo">
                    <span className="passo-numero">3</span>
                    <span>Escolha o ano</span>
                  </div>
                </div>
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
              Fonte: API oficial da Tabela FIPE - Dados atualizados em tempo real
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
