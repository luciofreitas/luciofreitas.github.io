import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuLogin } from '../components';
import { AuthContext } from '../App';
import { ComponenteEstrelas } from '../components';
import { useAvaliacoes } from '../hooks/useAvaliacoes';
import { apiService } from '../utils/apiService';
import { glossarioMockData, glossarioColors } from '../data/glossarioData';
import { getCorClass } from '../utils/colorUtils';
import '../styles/pages/page-LuzesDoPainel.css';

// Use import.meta.glob to lazily import images (globEager may not be available in some runtimes)
// Load both PNG and SVG files and prefer SVG when available to allow tintable icons.
const imagensLuzesModules = import.meta.glob('../../images/luzes-no-painel/*.{png,svg}');

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

  // Selected state per multi-state item (keyed by luz.id)
  const [selectedStateMap, setSelectedStateMap] = useState({});
  
  // Track which cards are expanded (show content) vs collapsed (header only)
  const [expandedMap, setExpandedMap] = useState({});

  // Hook customizado para avaliações (namespace por email do usuário)
  const { avaliacoes, votosUsuario, avaliarGuia } = useAvaliacoes(usuarioLogado?.email);

  // Carregar dados do glossário (luzes do painel)
  useEffect(() => {
    // runtime stylesheet is injected globally in `main.jsx`
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
          // Prefer icon path from our local mock data when available (so tests using SVGs succeed)
          icone: (function() {
            try {
              const lookup = (item.nome || item.title || item.name || item.id || '').toString().trim().toLowerCase();
              const mockIconMap = new Map((Array.isArray(glossarioMockData) ? glossarioMockData : []).map(m => [String(m.nome || m.id || '').trim().toLowerCase(), m.icone || m.icon || m.icone || '']));
              const fromMock = mockIconMap.get(lookup);
              if (fromMock) return fromMock;
            } catch (e) {}
            return item.icone || item.icon || '';
          })(),
          // Force color token to come from glossarioMockData when available
          cor: (function() {
            try {
              const lookup = (item.nome || item.title || item.name || item.id || '').toString().trim().toLowerCase();
              // build a quick map from mock data (nome -> cor)
              const mockMap = new Map((Array.isArray(glossarioMockData) ? glossarioMockData : []).map(m => [String(m.nome || m.id || '').trim().toLowerCase(), m.cor]));
              return mockMap.get(lookup) || item.cor || item.color || 'amarelo';
            } catch (e) {
              return item.cor || item.color || 'amarelo';
            }
          })(),
          prioridade: normalizePrioridade(item.prioridade || item.priority),
          descricao: item.descricao || item.description || '',
          acoes: item.acoes || item.actions || [],
          causas: item.causas || item.causas_comuns || item.causes || [],
          // preserve multi-state metadata when present so UI can toggle per-state
          estados: item.estados || item.states || []
        }));

        // If the backend omitted `estados` for some items (e.g., production API),
        // merge `estados` from our local mock by matching on name/id so multi-state
        // items like Start-Stop remain interactive in the UI.
        const merged = arrayData.map(item => {
          try {
            if ((!item.estados || item.estados.length === 0) && Array.isArray(glossarioMockData)) {
              const lookup = String(item.nome || item.id || '').trim().toLowerCase();
              const fromMock = (glossarioMockData || []).find(m => String(m.nome || m.id || '').trim().toLowerCase() === lookup);
              if (fromMock && Array.isArray(fromMock.estados) && fromMock.estados.length > 0) {
                // copy states from mock when missing
                item = { ...item, estados: fromMock.estados };
                try { console.log('[glossario] merged estados from mock for', lookup); } catch(e){}
              }
            }
          } catch(e) {}
          return item;
        });

        setGlossarioData(merged);
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

    // Cache for fetched SVG contents to avoid repeated network requests
    // Cache key includes colorHex so we don't reuse a colored SVG for a different token
    const svgCacheRef = useRef({});

    // InlineSvg: fetches an external SVG, normalizes fills/strokes to currentColor and injects it inline
    function InlineSvg({ src, className, alt, colorHex }) {
      const [svgContent, setSvgContent] = useState(null);
      useEffect(() => {
        let mounted = true;
        if (!src) return;
        const cacheKey = `${src}::${colorHex || ''}`;
        if (svgCacheRef.current[cacheKey]) {
          setSvgContent(svgCacheRef.current[cacheKey]);
          return;
        }
        (async () => {
          try {
            const res = await fetch(src);
            if (!res.ok) throw new Error('Fetch failed: ' + res.status);
            let text = await res.text();

            // Try to parse the SVG and normalize attributes for reliable sizing and coloring
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(text, 'image/svg+xml');
              const svgEl = doc.querySelector('svg');
              if (svgEl) {
                // Remove any internal <style> rules to avoid conflicts
                svgEl.querySelectorAll('style').forEach(s => s.remove());

                // Remove inline style fill/stroke declarations on elements
                svgEl.querySelectorAll('[style]').forEach(el => {
                  const s = el.getAttribute('style') || '';
                  const cleaned = s.replace(/(fill|stroke)\s*:\s*[^;]+;?/gi, '');
                  if (cleaned.trim()) el.setAttribute('style', cleaned);
                  else el.removeAttribute('style');
                });

                // Insert an internal style to force all fills/strokes to currentColor
                try {
                  const ns = 'http://www.w3.org/2000/svg';
                  const styleEl = doc.createElementNS(ns, 'style');
                  styleEl.textContent = '* { fill: currentColor !important; stroke: currentColor !important; }';
                  svgEl.insertBefore(styleEl, svgEl.firstChild);
                } catch (inner) {
                  // ignore if createElementNS fails in some envs
                }

                // As a stronger fallback, set presentation attributes on elements
                // that currently have explicit fill/stroke values so they use currentColor
                // (we avoid embedding a concrete hex here so CSS `.cor-icon.<token> { color: ... }`
                // can recolor the inlined SVG when the token changes).
                svgEl.querySelectorAll('*').forEach(el => {
                  try {
                    if (el.hasAttribute('fill')) {
                      const v = el.getAttribute('fill');
                      if (v && v.toLowerCase() !== 'none') el.setAttribute('fill', 'currentColor');
                    }
                    if (el.hasAttribute('stroke')) {
                      const v2 = el.getAttribute('stroke');
                      if (v2 && v2.toLowerCase() !== 'none') el.setAttribute('stroke', 'currentColor');
                    }
                  } catch (e) {
                    // ignore per-element errors
                  }
                });

                // Remove explicit width/height so CSS can size the SVG
                const widthAttr = svgEl.getAttribute('width');
                const heightAttr = svgEl.getAttribute('height');
                if (widthAttr) svgEl.removeAttribute('width');
                if (heightAttr) svgEl.removeAttribute('height');

                // If viewBox missing and numeric width/height were present, create a viewBox
                if (!svgEl.hasAttribute('viewBox')) {
                  const w = parseFloat(widthAttr || '0');
                  const h = parseFloat(heightAttr || '0');
                  if (w > 0 && h > 0) svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
                }

                // Ensure consistent scaling
                if (!svgEl.hasAttribute('preserveAspectRatio')) svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

                // Merge className onto root <svg>
                const cls = (className || '').trim();
                if (cls) {
                  const existing = svgEl.getAttribute('class') || '';
                  const merged = (existing + ' ' + cls).trim();
                  svgEl.setAttribute('class', merged);
                }

                // Serialize only the inner <svg> markup (root) to keep things tidy
                const serializer = new XMLSerializer();
                text = serializer.serializeToString(svgEl);
              }
            } catch (e) {
              // fallback: simple regex replacement when parsing fails
              text = text.replace(/(fill|stroke)=(["'])(?!none)(#[^"']+|[^"']+?)\2/gi, '$1="currentColor"');
              // also try to strip style:fill/... occurrences
              text = text.replace(/style=(["'])(.*?)\1/gi, (m, q, content) => {
                const cleaned = content.replace(/(fill|stroke)\s*:\s*[^;]+;?/gi, '');
                return `style=${q}${cleaned}${q}`;
              });
            }

                // Cache and set (cache keyed by src+color so recolor updates produce fresh markup)
                svgCacheRef.current[cacheKey] = text;
            if (mounted) {
              try { console.debug('[InlineSvg] loaded', src, 'len=', text && text.length); } catch (e) {}
              setSvgContent(text);
            }
          } catch (e) {
            if (mounted) {
              try { console.warn('[InlineSvg] failed to load', src, e && e.message); } catch (er) {}
              setSvgContent(null);
            }
          }
        })();
        return () => { mounted = false; };
      }, [src, colorHex]);

      if (!svgContent) return <img src={src} alt={alt} className={className} />;
      return <span className={className} role={alt ? 'img' : undefined} aria-label={alt || undefined} dangerouslySetInnerHTML={{ __html: svgContent }} />;
    }

    // SvgMask: render the SVG as a mask/background so the element's background-color/currentColor
    // paints the icon regardless of internal SVG fills. This is robust against inline styles
    // or presentation attributes inside the SVG file.
    function SvgMask({ src, className, alt, colorHex }) {
      const style = {};
      if (src) {
        // apply both mask and background for compatibility
        style.backgroundImage = `url(${src})`;
        style.WebkitMaskImage = `url(${src})`;
        style.maskImage = `url(${src})`;
        style.WebkitMaskSize = 'contain';
        style.maskSize = 'contain';
        style.WebkitMaskRepeat = 'no-repeat';
        style.maskRepeat = 'no-repeat';
        style.WebkitMaskPosition = 'center';
        style.maskPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
        style.backgroundPosition = 'center';
        style.backgroundSize = 'contain';
        if (colorHex) style.backgroundColor = colorHex;
      }
      return <span className={className} role={alt ? 'img' : undefined} aria-label={alt || undefined} style={style} />;
    }

  // Funções auxiliares
  const limparFiltros = () => {
    setFiltros({ busca: '', cor: '' });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        // ignore
      }
    }, 200);
  };

  const getPrioridadeColor = (prioridade) => {
    const cores = {
      'Alta': '#dc2626',
      'Média': '#f59e0b',
      'Baixa': '#16a34a'
    };
    return cores[prioridade] || '#6b7280';
  };

  // Use shared getCorClass from utils

  const resolveIcon = (icone, item) => {
    if (!icone && !item) return '';
    // If icone is not a string (could be a React node), return as-is
    if (icone && typeof icone !== 'string') return icone;

    // If icone is a string and looks like a path (contains '/'), try to resolve filename
    const tryResolveFilename = (filename) => {
      if (!filename) return null;
      // direct match
      if (imagensLuzesMap[filename]) return imagensLuzesMap[filename];
      // try alternative extensions (prefer .svg over .png)
      const m = filename.match(/^(.*)\.([a-z0-9]+)$/i);
      if (m) {
        const base = m[1];
        const altSvg = `${base}.svg`;
        const altPng = `${base}.png`;
        if (imagensLuzesMap[altSvg]) return imagensLuzesMap[altSvg];
        if (imagensLuzesMap[altPng]) return imagensLuzesMap[altPng];
      } else {
        const alt = `${filename}.svg`;
        if (imagensLuzesMap[alt]) return imagensLuzesMap[alt];
      }
      return null;
    };

    if (typeof icone === 'string' && icone.includes('/')) {
      const filename = icone.split('/').pop();
      const found = tryResolveFilename(filename);
      try { console.debug('[resolveIcon] ', item && item.nome ? item.nome : item.id, '->', found || icone); } catch (e) {}
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
      <div className="page-wrapper menu-page" id="topo" tabIndex={-1}>
        <div className="page-content">
          {/* Header com ícone */}
          <div className="luzes-header">
            <h2 className="page-title">Luzes do Painel</h2>
            <div className="header-subtitle">
              <p>Entenda os avisos do seu veículo e saiba como agir quando as luzes do painel acenderem.</p>
              <p>Mantenha-se seguro e evite problemas maiores.</p>
            </div>
          </div>

          {/* Atalhos (mobile) */}
          <div className="luzes-nav" id="luzes-atalhos" tabIndex={-1} aria-label="Atalhos do guia">
            <span className="luzes-nav-title">Navegar:</span>
            <div className="luzes-nav-pills" role="navigation" aria-label="Seções do guia">
              <button type="button" className="luzes-nav-pill" onClick={() => scrollToSection('filtros')}>Filtros</button>
              <button type="button" className="luzes-nav-pill" onClick={() => scrollToSection('legenda')}>Legenda</button>
              <button type="button" className="luzes-nav-pill" onClick={() => scrollToSection('resultados')}>Resultados</button>
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
            <div className="filtros-section" id="filtros" tabIndex={-1}>
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
                    <option value="amarelo">Amarelo</option>
                    <option value="azul">Azul</option>
                    <option value="laranja">Laranja</option>
                    <option value="verde">Verde</option>
                    <option value="vermelho">Vermelho</option>
                  </select>
                </div>
                
                <button className="btn-limpar-filtros" onClick={limparFiltros}>
                  Limpar
                </button>
              </div>
              
            </div>

            {/* Legenda: mover para cima dos cards, logo abaixo do buscador */}
            <div className="glossario-footer-section" id="legenda" tabIndex={-1}>
              <div className="info-section">
                <h3>🎨 Legenda das Cores</h3>
                <div className="cores-legend">
                  <div className="cor-item">
                    <div className={`cor-dot ${getCorClass('vermelho')}`}></div>
                    <span><strong>Vermelho:</strong> Pare</span>
                  </div>
                  <div className="cor-item">
                    <div className={`cor-dot ${getCorClass('laranja')}`}></div>
                    <span><strong>Laranja:</strong> Mais Atenção</span>
                  </div>
                  <div className="cor-item">
                    <div className={`cor-dot ${getCorClass('amarelo')}`}></div>
                    <span><strong>Amarelo:</strong> Atenção</span>
                  </div>
                  <div className="cor-item">
                    <div className={`cor-dot ${getCorClass('verde')}`}></div>
                    <span><strong>Verde:</strong> Sistema funcionando</span>
                  </div>
                  <div className="cor-item">
                    <div className={`cor-dot ${getCorClass('azul')}`}></div>
                    <span><strong>Azul:</strong> Informativo</span>
                  </div>
                </div>
              </div>
              
              <div className="disclaimer">
                <p>
                  ⚠️ <strong>Aviso 1:</strong> Este glossário é apenas informativo. 
                  Sempre consulte um mecânico qualificado para diagnósticos precisos.
                </p>
                <p>
                  ⚠️ <strong>Aviso 2:</strong> Alguns itens possuem mais de uma cor. 
                  Clique na bolinha para ver o que cada cor significa.
                </p>
              </div>
            </div>

            <div className="luzes-section-actions">
              <button
                type="button"
                className="luzes-top-btn"
                onClick={() => scrollToSection('topo')}
                aria-label="Voltar ao topo"
              >
                Topo
              </button>
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
              <div className="luzes-grid" id="resultados" tabIndex={-1}>
                {dadosFiltrados.map((luz, index) => {
                  const hasStates = Array.isArray(luz.estados) && luz.estados.length > 0;
                  const defaultKey = hasStates ? (luz.estados[0] && luz.estados[0].key) : luz.cor;
                  const mapKey = `${luz.id}-${index}`; // unique key per card using id + index
                  const selectedKey = selectedStateMap[mapKey] || defaultKey;
                  const selectedState = hasStates ? (luz.estados.find(s => s.key === selectedKey) || luz.estados[0]) : null;
                  const selectedColorToken = selectedState ? (selectedState.cor || luz.cor) : (luz.cor || defaultKey);

                  const descricaoAtiva = selectedState ? (selectedState.descricao || selectedState.titulo || luz.descricao) : luz.descricao;
                  const acoesAtivas = selectedState ? (selectedState.acoes || luz.acoes || []) : (luz.acoes || []);
                  const causasAtivas = selectedState ? (selectedState.causas || luz.causas || []) : (luz.causas || []);

                  const isExpanded = expandedMap[mapKey];
                  const contentId = `luz-content-${mapKey}`;
                  
                  const handleCardClick = (e) => {
                    // Don't toggle if clicking the indicator button
                    if (e.target.closest('.cor-indicator')) return;
                    setExpandedMap(prev => ({ ...prev, [mapKey]: !prev[mapKey] }));
                  };

                  const handleHeaderKeyDown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      // Don't toggle if focus is inside the color indicator
                      if (e.target.closest && e.target.closest('.cor-indicator')) return;
                      setExpandedMap(prev => ({ ...prev, [mapKey]: !prev[mapKey] }));
                    }
                  };

                  return (
                  <div 
                    key={mapKey} 
                    className={`luz-card ${getCorClass(selectedColorToken)} ${isExpanded ? 'expanded' : 'collapsed'}`}
                  >
                    <div
                      className="luz-header"
                      role="button"
                      tabIndex={0}
                      aria-expanded={!!isExpanded}
                      aria-controls={contentId}
                      onClick={handleCardClick}
                      onKeyDown={handleHeaderKeyDown}
                      style={{ cursor: 'pointer' }}
                    >
                        {(() => {
                        // Color decisions come solely from the `luz.cor` token now.
                        const isRed = (String(luz.cor || '').toLowerCase() === 'vermelho');
                        return <div className={`luz-icone`}>
                          {(() => {
                            const resolved = resolveIcon(luz.icone);
                            // If resolved looks like an image path or URL, render an <img>
                            const looksLikeImage = typeof resolved === 'string' && (
                              resolved.includes('/') || /\.(png|jpg|jpeg|svg|gif)$/.test(resolved)
                            );
                            if (looksLikeImage) {
                              const isSvg = (function(r) {
                                if (typeof r !== 'string') return false;
                                if (/\.svg(\?|$)/i.test(r)) return true;
                                if (r.startsWith('data:image/svg+xml')) return true;
                                if (r.includes('%3Csvg') || r.includes('%3csvg')) return true;
                                if (r.indexOf('<svg') !== -1) return true;
                                return false;
                              })(resolved);
                              if (isSvg) {
                                // Compute explicit color hex for the token so we can force it on the SVG
                                const colorHex = (glossarioColors && glossarioColors[selectedColorToken]) ? glossarioColors[selectedColorToken] : undefined;
                                // Inline the SVG so we can rewrite fills/strokes reliably
                                return (
                                  <InlineSvg src={resolved} colorHex={colorHex} className={`cor-icon ${getCorClass(selectedColorToken)} luz-icone-img`} alt={luz.nome} />
                                );
                              }
                              const filterValue = "invert(29%) sepia(81%) saturate(600%) hue-rotate(-10deg) brightness(95%) contrast(90%)";
                              const isSvgLikeImg = (function(r){
                                if (typeof r !== 'string') return false;
                                if (/\.svg(\?|$)/i.test(r)) return true;
                                if (r.startsWith('data:image/svg+xml')) return true;
                                if (r.includes('%3Csvg') || r.includes('%3csvg')) return true;
                                if (r.indexOf('<svg') !== -1) return true;
                                return false;
                              })(resolved);
                              const imgRefCallback = (el) => { /* no-op; no per-file recolor handling */ };
                              const imgClassName = `luz-icone-img ${isSvgLikeImg ? `cor-icon ${getCorClass(selectedColorToken)}` : ''}`.trim();
                              return <img ref={imgRefCallback} src={resolved} alt={luz.nome} className={imgClassName} />;
                            }
                            // Otherwise render the resolved value as text (emoji or fallback)
                            return <div className="luz-icone-text">{resolved || '⚠️'}</div>;
                          })()}
                        </div>})()}
                        <div className="luz-info">
                        <h3 className="luz-nome">{luz.nome}</h3>
                        <div className="luz-indicators">
                              {(() => {
                                const hasStates = Array.isArray(luz.estados) && luz.estados.length > 0;
                                const defaultKey = hasStates ? (luz.estados[0] && luz.estados[0].key) : luz.cor;
                                // Use mapKey from parent scope
                                const selectedKey = selectedStateMap[mapKey] || defaultKey;
                                const selectedState = hasStates ? (luz.estados.find(s => s.key === selectedKey) || luz.estados[0]) : null;
                                const indicatorToken = selectedState ? selectedState.cor : (luz.cor || 'amarelo');

                                const handleToggle = (e) => {
                                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation(); // prevent card click
                                  if (!hasStates) return;
                                  const idx = luz.estados.findIndex(s => s.key === selectedKey);
                                  const next = luz.estados[(idx + 1) % luz.estados.length];
                                  try { console.log('[StartStop] toggle', mapKey, 'from', selectedKey, 'to', next && next.key); } catch(e) {}
                                  setSelectedStateMap(prev => ({ ...prev, [mapKey]: next.key }));
                                };

                                const onKeyDown = (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleToggle(e);
                                  }
                                };

                                return (
                                  <button
                                    type="button"
                                    className={`cor-indicator ${getCorClass(indicatorToken)} ${hasStates ? 'clickable-state' : ''}`}
                                    aria-pressed={hasStates ? (selectedKey !== undefined) : undefined}
                                    aria-label={hasStates ? `${luz.nome} — estado: ${selectedState ? selectedState.nome : selectedKey}` : undefined}
                                    onClick={hasStates ? handleToggle : undefined}
                                    onKeyDown={hasStates ? onKeyDown : undefined}
                                  />
                                );
                              })()}

                              <span className={`luzes-expand-indicator ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">▾</span>
                        </div>
                      </div>
                    </div>

                    <div className="luz-content" id={contentId}>
                      {(() => {
                        const hasStates = Array.isArray(luz.estados) && luz.estados.length > 0;
                        const defaultKey = hasStates ? (luz.estados[0] && luz.estados[0].key) : luz.cor;
                        // Use the same mapKey as defined above
                        const selectedKey = selectedStateMap[mapKey] || defaultKey;
                        const selectedState = hasStates ? (luz.estados.find(s => s.key === selectedKey) || luz.estados[0]) : null;
                        const descricaoAtiva = selectedState ? (selectedState.descricao || selectedState.titulo || luz.descricao) : luz.descricao;
                        const acoesAtivas = selectedState ? (selectedState.acoes || luz.acoes || []) : (luz.acoes || []);
                        const causasAtivas = selectedState ? (selectedState.causas || luz.causas || []) : (luz.causas || []);

                        return (
                          <>
                            <div className="luz-descricao">{descricaoAtiva}</div>

                            {acoesAtivas && acoesAtivas.length > 0 && (
                              <div className="luz-section">
                                <h4>⚡ O que fazer:</h4>
                                <ul className="acoes-list">
                                  {acoesAtivas.map((acao, index) => (
                                    <li key={index}>{acao}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {causasAtivas && causasAtivas.length > 0 && (
                              <div className="luz-section">
                                <h4>🔍 Possíveis causas:</h4>
                                <ul className="causas-list">
                                  {causasAtivas.map((causa, index) => (
                                    <li key={index}>{causa}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
                })}
              </div>
            )}

            <div className="luzes-section-actions">
              <button
                type="button"
                className="luzes-top-btn"
                onClick={() => scrollToSection('topo')}
                aria-label="Voltar ao topo"
              >
                Topo
              </button>
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
