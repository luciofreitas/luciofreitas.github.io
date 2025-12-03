import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { marcasFIPE, getModelosPorMarca, getAnosPorModelo, getVeiculo, mesReferencia } from '../data/veiculosFIPE';
import '../styles/pages/page-TabelaFIPE.css';

export default function TabelaFIPE() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  
  // Estados para filtros
  const [marcaSelecionada, setMarcaSelecionada] = useState('');
  const [modeloSelecionado, setModeloSelecionado] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('');
  
  // Estados para dados
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [veiculo, setVeiculo] = useState(null);
  
  // Verifica se o usuário é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  // Quando marca é selecionada
  const handleMarcaChange = (codigoMarca) => {
    setMarcaSelecionada(codigoMarca);
    setModeloSelecionado('');
    setAnoSelecionado('');
    setVeiculo(null);
    
    if (codigoMarca) {
      const marca = marcasFIPE.find(m => m.codigo.toString() === codigoMarca);
      const modelosDisponiveis = getModelosPorMarca(marca.nome);
      setModelos(modelosDisponiveis);
      setAnos([]);
    } else {
      setModelos([]);
      setAnos([]);
    }
  };

  // Quando modelo é selecionado
  const handleModeloChange = (codigoModelo) => {
    setModeloSelecionado(codigoModelo);
    setAnoSelecionado('');
    setVeiculo(null);
    
    if (codigoModelo) {
      const marca = marcasFIPE.find(m => m.codigo.toString() === marcaSelecionada);
      const modelo = modelos.find(m => m.codigo.toString() === codigoModelo);
      const anosDisponiveis = getAnosPorModelo(marca.nome, modelo.nome);
      setAnos(anosDisponiveis);
    } else {
      setAnos([]);
    }
  };

  // Quando ano é selecionado
  const handleAnoChange = (ano) => {
    setAnoSelecionado(ano);
    
    if (ano) {
      const marca = marcasFIPE.find(m => m.codigo.toString() === marcaSelecionada);
      const modelo = modelos.find(m => m.codigo.toString() === modeloSelecionado);
      const veiculoEncontrado = getVeiculo(marca.nome, modelo.nome, ano);
      setVeiculo(veiculoEncontrado);
    } else {
      setVeiculo(null);
    }
  };

  const limparFiltros = () => {
    setMarcaSelecionada('');
    setModeloSelecionado('');
    setAnoSelecionado('');
    setModelos([]);
    setAnos([]);
    setVeiculo(null);
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
                onChange={(e) => handleMarcaChange(e.target.value)}
              >
                <option value="">Selecione a marca</option>
                {marcasFIPE.map(marca => (
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
                onChange={(e) => handleModeloChange(e.target.value)}
                disabled={!marcaSelecionada}
              >
                <option value="">
                  {!marcaSelecionada ? 'Selecione uma marca primeiro' : 'Selecione o modelo'}
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
                onChange={(e) => handleAnoChange(e.target.value)}
                disabled={!modeloSelecionado}
              >
                <option value="">
                  {!modeloSelecionado ? 'Selecione um modelo primeiro' : 'Selecione o ano'}
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
            {veiculo ? (
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
                  <tr>
                    <td data-label="Código FIPE">{veiculo.codigo || 'N/A'}</td>
                    <td data-label="Marca">{veiculo.marca}</td>
                    <td data-label="Modelo">{veiculo.modelo}</td>
                    <td data-label="Ano">{veiculo.ano}</td>
                    <td data-label="Combustível">{veiculo.combustivel || 'N/A'}</td>
                    <td data-label="Preço Médio" className="fipe-preco">
                      <div className="fipe-preco-wrapper">
                        <span className={isPro ? '' : 'fipe-preco-blur'}>{veiculo.preco}</span>
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
