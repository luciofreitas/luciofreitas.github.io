import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { veiculosFIPE, mesReferencia } from '../data/veiculosFIPE';
import '../styles/pages/page-TabelaFIPE.css';

export default function TabelaFIPE() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterAno, setFilterAno] = useState('');
  const [filterCombustivel, setFilterCombustivel] = useState('');
  
  // Verifica se o usuário é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  // Extrair marcas únicas para o filtro
  const marcasUnicas = useMemo(() => {
    const marcas = [...new Set(veiculosFIPE.map(item => item.marca))];
    return marcas.sort();
  }, []);

  // Extrair anos únicos para o filtro
  const anosUnicos = useMemo(() => {
    const anos = [...new Set(veiculosFIPE.map(item => item.ano))];
    return anos.sort((a, b) => b - a);
  }, []);

  // Extrair combustíveis únicos para o filtro
  const combustiveisUnicos = useMemo(() => {
    const combustiveis = [...new Set(veiculosFIPE.map(item => item.combustivel))];
    return combustiveis.sort();
  }, []);

  // Filtrar dados com base nos filtros ativos
  const dadosFiltrados = useMemo(() => {
    return veiculosFIPE.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.codigo && item.codigo.includes(searchTerm));
      
      const matchMarca = filterMarca === '' || item.marca === filterMarca;
      const matchAno = filterAno === '' || item.ano.toString() === filterAno;
      const matchCombustivel = filterCombustivel === '' || item.combustivel === filterCombustivel;

      return matchSearch && matchMarca && matchAno && matchCombustivel;
    });
  }, [searchTerm, filterMarca, filterAno, filterCombustivel]);

  const limparFiltros = () => {
    setSearchTerm('');
    setFilterMarca('');
    setFilterAno('');
    setFilterCombustivel('');
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
              <span className="fipe-mes-ref"> Mês de referência: <strong>{mesReferencia}</strong></span>
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
                onChange={(e) => setFilterMarca(e.target.value)}
              >
                <option value="">Todas as marcas</option>
                {marcasUnicas.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
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

            <div className="filtro-group">
              <label htmlFor="combustivel" className="filtro-label">Combustível:</label>
              <select
                id="combustivel"
                className="filtro-select"
                value={filterCombustivel}
                onChange={(e) => setFilterCombustivel(e.target.value)}
              >
                <option value="">Todos</option>
                {combustiveisUnicos.map(combustivel => (
                  <option key={combustivel} value={combustivel}>{combustivel}</option>
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
              Exibindo <strong>{dadosFiltrados.length}</strong> de <strong>{veiculosFIPE.length}</strong> veículos
            </p>
          </div>

          {/* Tabela FIPE */}
          <div className="fipe-tabela-container">
            {dadosFiltrados.length > 0 ? (
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
            <p className="fipe-atualizacao">
              Última atualização: {mesReferencia}
            </p>
            <p className="fipe-fonte">
              Base de dados com {veiculosFIPE.length} veículos das marcas mais populares do mercado brasileiro
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
