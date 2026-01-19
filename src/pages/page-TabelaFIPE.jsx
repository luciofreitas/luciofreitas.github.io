import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { consultarPrecoPorCodigoFipe, listarTabelasReferencia } from '../services/brasilApiFipeService';
import { buscarMarcas, buscarModelos, buscarAnos, buscarValorPorTipo } from '../services/fipeService';
import { comparePtBr } from '../utils/sortUtils';
import '../styles/pages/page-TabelaFIPE.css';

export default function TabelaFIPE() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const [tabelasReferencia, setTabelasReferencia] = useState([]);
  const [tabelaReferenciaSelecionada, setTabelaReferenciaSelecionada] = useState('');

  // Consulta amigável (Marca/Modelo/Ano -> gera código FIPE -> BrasilAPI)
  const [tipoVeiculoOnline, setTipoVeiculoOnline] = useState('carros');
  const [marcasOnline, setMarcasOnline] = useState([]);
  const [marcaOnline, setMarcaOnline] = useState('');
  const [modelosOnline, setModelosOnline] = useState([]);
  const [modeloOnline, setModeloOnline] = useState('');
  const [anosOnline, setAnosOnline] = useState([]);
  const [anoOnline, setAnoOnline] = useState('');
  const [codigoFipeDerivado, setCodigoFipeDerivado] = useState('');
  const [precosBrasilApiOnline, setPrecosBrasilApiOnline] = useState([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineErro, setOnlineErro] = useState('');
  
  // Verifica se o usuário é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  // Carrega tabelas de referência (BrasilAPI)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listarTabelasReferencia();
        if (mounted) setTabelasReferencia(Array.isArray(data) ? data : []);
      } catch (e) {
        // silencioso: dropdown é opcional
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Carrega marcas (Parallelum) para o fluxo Marca/Modelo/Ano
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setOnlineErro('');
        setMarcasOnline([]);
        setMarcaOnline('');
        setModelosOnline([]);
        setModeloOnline('');
        setAnosOnline([]);
        setAnoOnline('');
        setCodigoFipeDerivado('');
        setPrecosBrasilApiOnline([]);

        const data = await buscarMarcas(tipoVeiculoOnline);
        if (mounted) setMarcasOnline(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setOnlineErro('Não foi possível carregar as marcas agora.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tipoVeiculoOnline]);

  const handleTabelaReferenciaChange = (value) => {
    setTabelaReferenciaSelecionada(value);
    // Evita mostrar resultado desatualizado; o usuário pode apenas re-selecionar o ano.
    setCodigoFipeDerivado('');
    setPrecosBrasilApiOnline([]);
    setOnlineErro('');
  };

  const limparConsultaOnline = () => {
    setOnlineErro('');
    setMarcaOnline('');
    setModelosOnline([]);
    setModeloOnline('');
    setAnosOnline([]);
    setAnoOnline('');
    setCodigoFipeDerivado('');
    setPrecosBrasilApiOnline([]);
  };

  const handleMarcaOnlineChange = async (codigoMarca) => {
    setOnlineErro('');
    setMarcaOnline(codigoMarca);
    setModeloOnline('');
    setAnosOnline([]);
    setAnoOnline('');
    setCodigoFipeDerivado('');
    setPrecosBrasilApiOnline([]);

    if (!codigoMarca) {
      setModelosOnline([]);
      return;
    }

    try {
      setOnlineLoading(true);
      const data = await buscarModelos(tipoVeiculoOnline, codigoMarca);
      setModelosOnline(Array.isArray(data) ? data : []);
    } catch (e) {
      setOnlineErro('Não foi possível carregar os modelos agora.');
      setModelosOnline([]);
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleModeloOnlineChange = async (codigoModelo) => {
    setOnlineErro('');
    setModeloOnline(codigoModelo);
    setAnosOnline([]);
    setAnoOnline('');
    setCodigoFipeDerivado('');
    setPrecosBrasilApiOnline([]);

    if (!codigoModelo || !marcaOnline) return;

    try {
      setOnlineLoading(true);
      const data = await buscarAnos(tipoVeiculoOnline, marcaOnline, codigoModelo);
      setAnosOnline(Array.isArray(data) ? data : []);
    } catch (e) {
      setOnlineErro('Não foi possível carregar os anos agora.');
      setAnosOnline([]);
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleAnoOnlineChange = async (codigoAno) => {
    setOnlineErro('');
    setAnoOnline(codigoAno);
    setCodigoFipeDerivado('');
    setPrecosBrasilApiOnline([]);

    if (!codigoAno || !marcaOnline || !modeloOnline) return;

    try {
      setOnlineLoading(true);
      // 1) Consulta Parallelum para obter o CodigoFipe
      const valorParallelum = await buscarValorPorTipo(tipoVeiculoOnline, marcaOnline, modeloOnline, codigoAno);
      const codigo = valorParallelum?.CodigoFipe;
      if (!codigo) {
        setOnlineErro('Não consegui obter o código FIPE para essa combinação.');
        return;
      }

      setCodigoFipeDerivado(codigo);

      // 2) Consulta BrasilAPI para obter o preço
      const data = await consultarPrecoPorCodigoFipe(codigo, tabelaReferenciaSelecionada || undefined);
      setPrecosBrasilApiOnline(Array.isArray(data) ? data : []);
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setOnlineErro('Nenhum resultado encontrado na BrasilAPI para esse código.');
      }
    } catch (e) {
      setOnlineErro(e?.message || 'Não foi possível consultar agora.');
    } finally {
      setOnlineLoading(false);
    }
  };

  return (
    <>
      <Menu />
      <div className="page-wrapper">
        <div className="page-content" id="tabela-fipe">
          <h2 className="page-title">Tabela FIPE</h2>
          
          <p className="page-subtitle">
            Consulte os preços de referência de veículos atualizados pela Tabela FIPE.
          </p>

          <div className="fipe-filtros">
            <div className="filtro-group">
              <label htmlFor="tipoOnline" className="filtro-label">Tipo de veículo</label>
              <select
                id="tipoOnline"
                className="filtro-select"
                value={tipoVeiculoOnline}
                onChange={(e) => setTipoVeiculoOnline(e.target.value)}
              >
                <option value="carros">Carros</option>
                <option value="motos">Motos</option>
                <option value="caminhoes">Caminhões</option>
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="tabelaRef" className="filtro-label">Tabela de referência (opcional)</label>
              <select
                id="tabelaRef"
                className="filtro-select"
                value={tabelaReferenciaSelecionada}
                onChange={(e) => handleTabelaReferenciaChange(e.target.value)}
                disabled={onlineLoading}
              >
                <option value="">Mais atual</option>
                {tabelasReferencia.map((t) => (
                  <option key={t.codigo} value={t.codigo}>{t.mes}</option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="marcaOnline" className="filtro-label">Marca</label>
              <select
                id="marcaOnline"
                className="filtro-select"
                value={marcaOnline}
                onChange={(e) => handleMarcaOnlineChange(e.target.value)}
                disabled={onlineLoading}
              >
                <option value="">Selecione a marca</option>
                {[...marcasOnline]
                  .sort((a, b) => comparePtBr(a?.nome, b?.nome))
                  .map((m) => (
                    <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                  ))}
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="modeloOnline" className="filtro-label">Modelo</label>
              <select
                id="modeloOnline"
                className="filtro-select"
                value={modeloOnline}
                onChange={(e) => handleModeloOnlineChange(e.target.value)}
                disabled={!marcaOnline || onlineLoading}
              >
                <option value="">{!marcaOnline ? 'Selecione a marca primeiro' : 'Selecione o modelo'}</option>
                {[...modelosOnline]
                  .sort((a, b) => comparePtBr(a?.nome, b?.nome))
                  .map((mo) => (
                    <option key={mo.codigo} value={mo.codigo}>{mo.nome}</option>
                  ))}
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="anoOnline" className="filtro-label">Ano</label>
              <select
                id="anoOnline"
                className="filtro-select"
                value={anoOnline}
                onChange={(e) => handleAnoOnlineChange(e.target.value)}
                disabled={!modeloOnline || onlineLoading}
              >
                <option value="">{!modeloOnline ? 'Selecione o modelo primeiro' : 'Selecione o ano'}</option>
                {anosOnline.map((a) => (
                  <option key={a.codigo} value={a.codigo}>{a.nome}</option>
                ))}
              </select>
            </div>

            {(marcaOnline || modeloOnline || anoOnline || codigoFipeDerivado || precosBrasilApiOnline.length > 0 || onlineErro) && (
              <button type="button" className="filtro-btn-limpar" onClick={limparConsultaOnline}>
                Limpar
              </button>
            )}
          </div>

          {(onlineLoading || onlineErro || precosBrasilApiOnline.length > 0 || codigoFipeDerivado) && (
            <div className="fipe-tabela-container">
              {onlineLoading ? (
                <div className="fipe-loading-container">
                  <div className="fipe-spinner" />
                  <p className="fipe-loading">Buscando…</p>
                </div>
              ) : onlineErro ? (
                <div className="fipe-sem-resultados">
                  <p>{onlineErro}</p>
                </div>
              ) : (
                <table className="fipe-tabela">
                  <thead>
                    <tr>
                      <th>Código FIPE</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Ano</th>
                      <th>Combustível</th>
                      <th>Mês ref.</th>
                      <th>Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {precosBrasilApiOnline.map((p, idx) => (
                      <tr key={`${p.codigoFipe || codigoFipeDerivado}-${p.anoModelo || idx}-${idx}`}>
                        <td data-label="Código FIPE">{p.codigoFipe || codigoFipeDerivado}</td>
                        <td data-label="Marca">{p.marca || '—'}</td>
                        <td data-label="Modelo">{p.modelo || '—'}</td>
                        <td data-label="Ano">{p.anoModelo ?? '—'}</td>
                        <td data-label="Combustível">{p.combustivel || '—'}</td>
                        <td data-label="Mês ref.">{(p.mesReferencia || '').trim() || '—'}</td>
                        <td data-label="Preço" className="fipe-preco">
                          <span className={isPro ? '' : 'fipe-preco-blur'}>{p.valor || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* CTA para usuários não-Pro */}
          {!isPro && precosBrasilApiOnline.length > 0 && (
            <div className="fipe-cta-pro">
              <div className="fipe-cta-content">
                <h3>🔓 Desbloqueie os Preços da Tabela FIPE</h3>
                <p>
                  Assine a Versão Pro e tenha acesso completo aos preços atualizados 
                  de todos os veículos da Tabela FIPE, além de outros benefícios exclusivos!
                </p>
                <button 
                  className="fipe-cta-button"
                  onClick={() => navigate('/versao-pro')}
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
          </div>
        </div>
      </div>
    </>
  );
}
