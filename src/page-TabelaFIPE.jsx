import React, { useState, useMemo } from 'react';
import Menu from './components/Menu';
import './page-TabelaFIPE.css';

export default function TabelaFIPE() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterAno, setFilterAno] = useState('');

  // Dados fictícios da Tabela FIPE - em produção viriam de uma API
  const dadosFIPE = [
    { id: 1, marca: 'Chevrolet', modelo: 'Onix 1.0 Turbo', ano: 2024, preco: 'R$ 89.500', codigo: '001234-1' },
    { id: 2, marca: 'Volkswagen', modelo: 'Gol 1.0', ano: 2024, preco: 'R$ 68.900', codigo: '002345-2' },
    { id: 3, marca: 'Fiat', modelo: 'Argo 1.3', ano: 2024, preco: 'R$ 75.800', codigo: '003456-3' },
    { id: 4, marca: 'Toyota', modelo: 'Corolla 2.0 XEi', ano: 2024, preco: 'R$ 145.900', codigo: '004567-4' },
    { id: 5, marca: 'Honda', modelo: 'Civic 2.0 EXL', ano: 2024, preco: 'R$ 168.900', codigo: '005678-5' },
    { id: 6, marca: 'Hyundai', modelo: 'HB20 1.0', ano: 2024, preco: 'R$ 72.900', codigo: '006789-6' },
    { id: 7, marca: 'Jeep', modelo: 'Compass 1.3 Turbo', ano: 2024, preco: 'R$ 189.900', codigo: '007890-7' },
    { id: 8, marca: 'Chevrolet', modelo: 'Tracker 1.0 Turbo', ano: 2023, preco: 'R$ 125.900', codigo: '008901-8' },
    { id: 9, marca: 'Volkswagen', modelo: 'T-Cross 1.0 TSI', ano: 2023, preco: 'R$ 119.900', codigo: '009012-9' },
    { id: 10, marca: 'Fiat', modelo: 'Toro 1.8 Freedom', ano: 2023, preco: 'R$ 139.900', codigo: '010123-0' },
    { id: 11, marca: 'Toyota', modelo: 'Hilux 2.8 SRX', ano: 2024, preco: 'R$ 285.900', codigo: '011234-1' },
    { id: 12, marca: 'Honda', modelo: 'HR-V 1.5 Turbo', ano: 2023, preco: 'R$ 149.900', codigo: '012345-2' },
    { id: 13, marca: 'Hyundai', modelo: 'Creta 1.0 Turbo', ano: 2024, preco: 'R$ 129.900', codigo: '013456-3' },
    { id: 14, marca: 'Nissan', modelo: 'Kicks 1.6', ano: 2023, preco: 'R$ 109.900', codigo: '014567-4' },
    { id: 15, marca: 'Renault', modelo: 'Kwid 1.0', ano: 2024, preco: 'R$ 64.900', codigo: '015678-5' },
    { id: 16, marca: 'Ford', modelo: 'Ranger 3.2 XLT', ano: 2023, preco: 'R$ 259.900', codigo: '016789-6' },
    { id: 17, marca: 'Chevrolet', modelo: 'S10 2.8 LTZ', ano: 2023, preco: 'R$ 245.900', codigo: '017890-7' },
    { id: 18, marca: 'Volkswagen', modelo: 'Amarok 2.0 Highline', ano: 2024, preco: 'R$ 279.900', codigo: '018901-8' },
    { id: 19, marca: 'Fiat', modelo: 'Pulse 1.3 Turbo', ano: 2024, preco: 'R$ 99.900', codigo: '019012-9' },
    { id: 20, marca: 'Jeep', modelo: 'Renegade 1.8', ano: 2023, preco: 'R$ 129.900', codigo: '020123-0' },
  ];

  // Extrair marcas únicas para o filtro
  const marcasUnicas = useMemo(() => {
    const marcas = [...new Set(dadosFIPE.map(item => item.marca))];
    return marcas.sort();
  }, []);

  // Extrair anos únicos para o filtro
  const anosUnicos = useMemo(() => {
    const anos = [...new Set(dadosFIPE.map(item => item.ano))];
    return anos.sort((a, b) => b - a);
  }, []);

  // Filtrar dados com base nos filtros ativos
  const dadosFiltrados = useMemo(() => {
    return dadosFIPE.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo.includes(searchTerm);
      
      const matchMarca = filterMarca === '' || item.marca === filterMarca;
      const matchAno = filterAno === '' || item.ano.toString() === filterAno;

      return matchSearch && matchMarca && matchAno;
    });
  }, [searchTerm, filterMarca, filterAno]);

  const limparFiltros = () => {
    setSearchTerm('');
    setFilterMarca('');
    setFilterAno('');
  };

  return (
    <>
      <Menu />
      <div className="page-wrapper">
        <div className="page-content" id="tabela-fipe">
          <h2 className="page-title">Tabela FIPE</h2>
          
          <div className="fipe-intro">
            <p>
              Consulte os preços de referência de veículos atualizados pela Tabela FIPE.
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

            <button className="filtro-btn-limpar" onClick={limparFiltros}>
              Limpar Filtros
            </button>
          </div>

          {/* Contador de Resultados */}
          <div className="fipe-resultados-info">
            <p>
              Exibindo <strong>{dadosFiltrados.length}</strong> de <strong>{dadosFIPE.length}</strong> veículos
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
                    <th>Preço Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map(item => (
                    <tr key={item.id}>
                      <td data-label="Código FIPE">{item.codigo}</td>
                      <td data-label="Marca">{item.marca}</td>
                      <td data-label="Modelo">{item.modelo}</td>
                      <td data-label="Ano">{item.ano}</td>
                      <td data-label="Preço Médio" className="fipe-preco">{item.preco}</td>
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

          {/* Aviso sobre atualização */}
          <div className="fipe-aviso">
            <p>
              <strong>Atenção:</strong> Os valores apresentados são preços médios de mercado 
              coletados pela Tabela FIPE e servem apenas como referência. Os preços reais 
              podem variar conforme o estado de conservação, quilometragem, opcionais e região.
            </p>
            <p className="fipe-atualizacao">
              Última atualização: Janeiro/2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
