import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuLogin } from '../components';
import { AuthContext } from '../App';
import { ComponenteEstrelas } from '../components';
import { useAvaliacoes } from '../hooks/useAvaliacoes';
import { apiService } from '../utils/apiService';
import { glossarioMockData } from '../data/glossarioData';
import { ensureGlossarioColors } from '../utils/glossarioColors';
import '../styles/pages/page-LuzesDoPainel.css';

// Use import.meta.glob to lazily import images (globEager may not be available in some runtimes)
const imagensLuzesModules = import.meta.glob('../../images/luzes-no-painel/*.png');

function LuzesDoPainel() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  // Estados principais
  const [glossarioData, setGlossarioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // mapa das imagens carregadas dinamicamente
  const [imagensLuzesMap, setImagensLuzesMap] = useState({});
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    cor: ''
  });

  // Hook customizado para avaliações (namespace por email do usuário)
  const { avaliacoes, votosUsuario, avaliarGuia } = useAvaliacoes(usuarioLogado?.email);

  // Carregar dados do glossário (luzes do painel)
  useEffect(() => {
    // Ensure the generated CSS from the glossário color map is present in the document.
    try { ensureGlossarioColors(); } catch (e) { /* ignore on SSR */ }
        // carregar as imagens do diretório dinamicamente (lazy import)
        let mounted = true;
        (async () => {
          try {
            const entries = await Promise.all(Object.entries(imagensLuzesModules).map(async ([k, loader]) => {
              const mod = await loader();
              const parts = k.split('/');
              const filename = parts[parts.length - 1];
              return [filename, mod && (mod.default || mod)];
            }));
            if (mounted) setImagensLuzesMap(Object.fromEntries(entries));
          } catch (e) {
            console.warn('Falha ao carregar imagens do diretório:', e);
          }
        })();
    const carregarGlossario = async () => {
      try {
        // Preferir endpoint de luzes do painel que tem os dados corretos
        const data = await apiService.getLuzesPainel();

        // A API pode retornar um objeto com propriedade `luzes` ou uma array direta
        const raw = Array.isArray(data) ? data : (data && data.luzes ? data.luzes : (data ? [data] : glossarioMockData));

        // Normalizar campos para a estrutura esperada pela página
        const normalizePrioridade = (p) => {
          if (!p) return 'Média';
          const s = p.toString().toLowerCase();
          if (s.includes('alto') || s.includes('crít') || s.includes('crit')) return 'Alta';
          if (s.includes('méd') || s.includes('med')) return 'Média';
          if (s.includes('baixo')) return 'Baixa';
          return 'Média';
        };

        const arrayData = raw.map(item => ({
          id: item.id || item.nome || item.name,
          nome: item.nome || item.title || item.name || '',
          icone: item.icone || item.icon || '',
          cor: item.cor || item.color || 'amarelo',
          prioridade: normalizePrioridade(item.prioridade || item.priority),
          descricao: item.descricao || item.description || '',
          acoes: item.acoes || item.actions || [],
          causas: item.causas || item.causas_comuns || item.causes || []
        }));

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
    setFiltros({ busca: '', cor: '' });
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
      // Use visually distinct accessible tones (adjusted to increase contrast between amarelo/laranja/vermelho)
      'vermelho': '#b91c1c', // darker red
      'laranja': '#ff7a00',  // brighter / more orange
      'amarelo': '#ffd400',  // vivid yellow, distinct from orange
      'verde': '#16a34a',
      'azul': '#2563eb'
    };
    return cores[cor.toLowerCase()] || '#6b7280';
  };

  const getCorClass = (cor) => {
    if (!cor) return '';
    const k = String(cor).trim().toLowerCase();
    const known = ['vermelho','amarelo','verde','azul','laranja'];
    if (known.includes(k)) return k;
    return k.replace(/[^a-z0-9]+/g, '-');
  };

  const resolveIcon = (icone, item) => {
    if (!icone && !item) return '';
    // If icone is not a string (could be a React node), return as-is
    if (icone && typeof icone !== 'string') return icone;

    // If icone is a string and looks like a path (contains '/'), try to resolve filename
    const tryResolveFilename = (filename) => {
      if (!filename) return null;
      if (imagensLuzesMap[filename]) return imagensLuzesMap[filename];
      return null;
    };

    if (typeof icone === 'string' && icone.includes('/')) {
      const filename = icone.split('/').pop();
      const found = tryResolveFilename(filename);
      if (found) return found;
      if (icone.startsWith('/')) return `${import.meta.env.BASE_URL}${icone.slice(1)}`;
      return icone;
    }

    // icone is likely an emoji or short text. Try to map using the item id or nome.
    if (item) {
      const candidates = [];
      const id = String(item.id || '').trim();
      const nome = String(item.nome || '').trim().toLowerCase();
      if (id) candidates.push(`${id}.png`);
      if (nome) {
        // create several normalized forms from nome
        const slug = nome.normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        candidates.push(`${slug}.png`);
        candidates.push(`${slug.replace(/-/g, '_')}.png`);
        candidates.push(`${slug.replace(/-/g, '')}.png`);
      }
      // also try common hyphen/underscore variants
      if (id && id.includes('-')) candidates.push(`${id.replace(/-/g, '_')}.png`);
      if (id && id.includes('_')) candidates.push(`${id.replace(/_/g, '-')}.png`);

      for (const c of candidates) {
        const f = tryResolveFilename(c);
        if (f) return f;
      }
    }

    // Fallback: return the original icon (emoji/text) so it's displayed as text
    return icone || '';
  };

  // Aplicar filtros
  const dadosFiltrados = glossarioData.filter(luz => {
    const matchBusca = !filtros.busca || 
      luz.nome.toLowerCase().includes(filtros.busca.toLowerCase());
    const matchCor = !filtros.cor || 
      luz.cor.toLowerCase() === filtros.cor.toLowerCase();

    return matchBusca && matchCor;
  });

  return (
    <>
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      <div className="site-header-spacer"></div>
      <div className="page-wrapper menu-page">
        <div className="page-content">
          {/* Header com ícone */}
          <div className="luzes-header">
            <div className="header-icon">⚠️</div>
            <h2 className="page-title">Luzes do Painel</h2>
            <div className="header-subtitle">
              <p>Entenda os avisos do seu veículo e saiba como agir quando as luzes do painel acenderem.</p>
              <p>Mantenha-se seguro e evite problemas maiores.</p>
            </div>
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
                
                {/* Prioridade filter removed - placeholder removed to reclaim layout space */}
                
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
              
            </div>

            {/* Legenda: mover para cima dos cards, logo abaixo do buscador */}
            <div className="glossario-footer-section">
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

            <div className="resultados-info resultados-info--below-legend">
              {dadosFiltrados.length} luz(es) encontrada(s)
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
                      {
                        // Determine if this is the "Falha de Freio" card (support both string ids from backend and numeric ids from fallback)
                      }
                        {(() => {
                        const isFalhaDeFreio = (String(luz.id) === 'falha-de-freio') || (String(luz.id) === '10') || (String(luz.nome || '').toLowerCase().includes('falha de freio'));
                        const isRed = isFalhaDeFreio || (String(luz.cor || '').toLowerCase() === 'vermelho');
                        return <div className={`luz-icone ${isRed ? 'luz-icone--red' : ''}`}>
                          {(() => {
                            const resolved = resolveIcon(luz.icone);
                            // If resolved looks like an image path or URL, render an <img>
                            const looksLikeImage = typeof resolved === 'string' && (
                              resolved.includes('/') || /\.(png|jpg|jpeg|svg|gif)$/.test(resolved)
                            );
                            if (looksLikeImage) {
                              const filterValue = "invert(29%) sepia(81%) saturate(600%) hue-rotate(-10deg) brightness(95%) contrast(90%)";
                              const imgRefCallback = (el) => {
                                if (!el) return;
                                try {
                                  if (isRed) {
                                    if (typeof resolved === 'string' && resolved.includes('falha-de-freio')) {
                                      el.classList.remove('luz-icone--red-img');
                                      el.classList.add('luz-icone--red-raw');
                                    } else {
                                      el.classList.remove('luz-icone--red-raw');
                                      el.classList.add('luz-icone--red-img');
                                    }
                                  } else {
                                    el.classList.remove('luz-icone--red-img');
                                    el.classList.remove('luz-icone--red-raw');
                                  }
                                } catch (e) {
                                  // defensive
                                }
                              };
                              return <img ref={imgRefCallback} src={resolved} alt={luz.nome} className={`luz-icone-img ${isRed ? 'luz-icone--red' : ''}`} />;
                            }
                            // Otherwise render the resolved value as text (emoji or fallback)
                            return <div className="luz-icone-text">{resolved || '⚠️'}</div>;
                          })()}
                        </div>})()}
                      <div className="luz-info">
                        <h3 className="luz-nome">{luz.nome}</h3>
                        <div className="luz-indicators">
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
