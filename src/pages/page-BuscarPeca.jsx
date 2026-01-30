import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { apiService } from '../utils/apiService';
import { SearchForm, PecasGrid } from '../components';
import '../styles/pages/page-BuscarPeca.css';
import { Menu, MenuLogin } from '../components';
import ProductDrawer from '../components/ProductDrawer';
// Mercado Livre integration disabled for now.
// Kept commented so it can be re-enabled later.
// import * as mlService from '../services/mlService';

export default function BuscarPeca() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  
  // filters and data
  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedModelo, setSelectedModelo] = useState('');
  const [selectedAno, setSelectedAno] = useState('');
  const [selectedFabricante, setSelectedFabricante] = useState('');

  // advanced vehicle attributes (optional)
  const [selectedMotor, setSelectedMotor] = useState('');
  const [selectedVersao, setSelectedVersao] = useState('');
  const [selectedCombustivel, setSelectedCombustivel] = useState('');
  const [selectedCambio, setSelectedCambio] = useState('');
  const [selectedCarroceria, setSelectedCarroceria] = useState('');

  // dropdown options for advanced fields (built from Supabase hint columns)
  const [motores, setMotores] = useState([]);
  const [versoes, setVersoes] = useState([]);

  const [grupos, setGrupos] = useState([]);
  // Lista de nomes de peças (para dropdown). Não carregamos o catálogo completo no início.
  const [todasPecas, setTodasPecas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [metaRelationships, setMetaRelationships] = useState({});
  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Track if user selected a specific car (to preserve filter values)
  const [carroSelecionadoId, setCarroSelecionadoId] = useState('');
  const [carroSelecionadoLabel, setCarroSelecionadoLabel] = useState('');
  const [searchFormKey, setSearchFormKey] = useState(0);

  // Estados para mensagens de incompatibilidade
  const [warningMarca, setWarningMarca] = useState('');
  const [warningModelo, setWarningModelo] = useState('');
  const [warningAno, setWarningAno] = useState('');
  const [warningFabricante, setWarningFabricante] = useState('');
  const [emptyFieldsWarning, setEmptyFieldsWarning] = useState('');

  // AI helper (MVP): free text -> structured filters
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiError, setAiError] = useState('');

  // drawer state (preferred over modals)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerProductId, setDrawerProductId] = useState(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState('compat');
  const navigate = useNavigate();

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const data = await apiService.getPecasMeta();
  // metadata loaded

        try {
          const p0 = (data && Array.isArray(data.pecas) && data.pecas.length) ? data.pecas[0] : null;
          console.info('[BuscarPeca] meta loaded', {
            grupos: Array.isArray(data?.grupos) ? data.grupos.length : 0,
            pecas: Array.isArray(data?.pecas) ? data.pecas.length : 0,
            pecasType: p0 ? typeof p0 : 'none',
            pecaKeys: (p0 && typeof p0 === 'object') ? Object.keys(p0).slice(0, 8) : []
          });
        } catch (e) { /* ignore */ }
        
        setGrupos(data.grupos || []);
        setTodasPecas(data.pecas || []);
        setMarcas(data.marcas || []);
        setModelos(data.modelos || []);
        setAnos(data.anos || []);
        setFabricantes(data.fabricantes || []);
        setMotores(data.motores || []);
        setVersoes(data.versoes || []);
        setMetaRelationships((data && data.relationships && typeof data.relationships === 'object') ? data.relationships : {});
        
        // states initialized from metadata

        // Importante: não carregar/mostrar o catálogo completo na abertura.
        setPecas([]);
      } catch (err) {
        console.warn('Failed to load metadata:', err && err.message ? err.message : err);
        setError('Não foi possível carregar os dados iniciais. Tente recarregar a página.');
      }
    };

    loadMeta();

    const onRefresh = () => loadMeta();
    window.addEventListener('app-refresh', onRefresh);
    return () => window.removeEventListener('app-refresh', onRefresh);
  }, []);

  // When the group changes, ensure the selected "Peça" still belongs to it.
  useEffect(() => {
    if (!selectedGrupo) return;
    if (!selectedCategoria) return;
    const allowed = getFilteredPecas();
    if (Array.isArray(allowed) && allowed.length && !allowed.includes(selectedCategoria)) {
      setSelectedCategoria('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrupo]);

  // Observação: removemos a validação de compatibilidade baseada no catálogo completo
  // para evitar carregar todas as peças no início (ganho de performance).

  // Filtrar opções de dropdown baseado nas seleções atuais
  // Espera `todasPecas` como lista de objetos { name, category }.
  // (Mantém fallback caso venha como lista de strings em algum cenário antigo.)
  const getFilteredPecas = () => {
    if (!Array.isArray(todasPecas) || !todasPecas.length) return [];

    const first = todasPecas[0];
    const isStringList = typeof first === 'string';

    // Legacy fallback: cannot filter by group without category mapping.
    if (isStringList) {
      return [...new Set(todasPecas.map(p => String(p)).filter(Boolean))];
    }

    const asObjects = todasPecas.filter(p => p && typeof p === 'object');
    if (!selectedGrupo) {
      // Mostra todas as peças únicas
      return [...new Set(asObjects.map(p => p.name).filter(Boolean))];
    }
    // Filtra peças pelo grupo selecionado
    return [...new Set(asObjects.filter(p => p.category === selectedGrupo).map(p => p.name).filter(Boolean))];
  };

  const getFilteredFabricantes = () => {
    const rel = metaRelationships || {};
    const byGrupo = rel.fabricantesByGrupo || {};
    const byGrupoPeca = rel.fabricantesByGrupoPeca || {};

    if (selectedGrupo && selectedCategoria) {
      const key = `${selectedGrupo}||${selectedCategoria}`;
      const arr = byGrupoPeca[key];
      if (Array.isArray(arr) && arr.length) return arr;
    }
    if (selectedGrupo) {
      const arr = byGrupo[selectedGrupo];
      if (Array.isArray(arr) && arr.length) return arr;
    }
    return Array.isArray(fabricantes) ? fabricantes : [];
  };

  const getFilteredMarcas = () => {
    const rel = metaRelationships || {};
    const modelsByBrand = rel.modelsByBrand || {};
    const relBrands = Object.keys(modelsByBrand || {}).filter(Boolean).sort();
    if (relBrands.length) return relBrands;
    return Array.isArray(marcas) ? marcas : [];
  };

  const getFilteredModelos = () => {
    const rel = metaRelationships || {};
    const modelsByBrand = rel.modelsByBrand || {};
    if (selectedMarca && Array.isArray(modelsByBrand[selectedMarca]) && modelsByBrand[selectedMarca].length) {
      const modelosArray = [...modelsByBrand[selectedMarca]];
      if (carroSelecionadoId && selectedModelo && !modelosArray.includes(selectedModelo)) {
        modelosArray.push(selectedModelo);
        modelosArray.sort();
      }
      return modelosArray;
    }

    // Fallback: keep previous behavior (list provided by meta)
    if (!selectedMarca) return Array.isArray(modelos) ? modelos : [];
    return Array.isArray(modelos) ? modelos : [];
  };

  const getFilteredAnos = () => {
    const rel = metaRelationships || {};
    const yearsByBrandModel = rel.yearsByBrandModel || {};
    const modelsByBrand = rel.modelsByBrand || {};

    if (selectedMarca && selectedModelo) {
      const key = `${selectedMarca}||${selectedModelo}`;
      const arr = yearsByBrandModel[key];
      if (Array.isArray(arr) && arr.length) {
        const anosArray = [...arr];
        if (carroSelecionadoId && selectedAno && !anosArray.includes(selectedAno)) {
          anosArray.push(selectedAno);
          anosArray.sort();
        }
        return anosArray;
      }
    }

    if (selectedMarca && !selectedModelo && Array.isArray(modelsByBrand[selectedMarca])) {
      const union = new Set();
      for (const m of modelsByBrand[selectedMarca]) {
        const key = `${selectedMarca}||${m}`;
        const ys = yearsByBrandModel[key];
        if (Array.isArray(ys)) ys.forEach(y => union.add(String(y)));
      }
      const anosArray = Array.from(union).filter(Boolean).sort();
      if (carroSelecionadoId && selectedAno && !anosArray.includes(selectedAno)) {
        anosArray.push(selectedAno);
        anosArray.sort();
      }
      return anosArray;
    }

    if (!selectedMarca && !selectedModelo) return Array.isArray(anos) ? anos : [];
    return Array.isArray(anos) ? anos : [];
  };

  const openDrawerCompat = (pecaOrId) => {
    const id = (pecaOrId && typeof pecaOrId === 'object') ? pecaOrId.id : pecaOrId;
    if (!id) return;
    setDrawerProductId(id);
    setDrawerInitialTab('compat');
    setDrawerOpen(true);
  };

  const openDrawerDetails = (id) => {
    if (!id) return;
    setDrawerProductId(id);
    setDrawerInitialTab('details');
    setDrawerOpen(true);
  };

  const runSearch = async ({ validateNonEmpty = true, overrideFilters = null } = {}) => {
    // Limpar mensagem de campos vazios ao tentar buscar
    setEmptyFieldsWarning('');

    // Para performance: não buscar se isso implicar carregar o catálogo inteiro.
    // Exigimos pelo menos um filtro "estruturante" (grupo/peça/fabricante).
    const filtrosEfetivos = {
      grupo: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'grupo') ? overrideFilters.grupo : selectedGrupo,
      categoria: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'categoria') ? overrideFilters.categoria : selectedCategoria,
      marca: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'marca') ? overrideFilters.marca : selectedMarca,
      modelo: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'modelo') ? overrideFilters.modelo : selectedModelo,
      ano: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'ano') ? overrideFilters.ano : selectedAno,
      fabricante: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'fabricante') ? overrideFilters.fabricante : selectedFabricante,
      motor: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'motor') ? overrideFilters.motor : selectedMotor,
      versao: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'versao') ? overrideFilters.versao : selectedVersao,
      combustivel: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'combustivel') ? overrideFilters.combustivel : selectedCombustivel,
      cambio: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'cambio') ? overrideFilters.cambio : selectedCambio,
      carroceria: overrideFilters && Object.prototype.hasOwnProperty.call(overrideFilters, 'carroceria') ? overrideFilters.carroceria : selectedCarroceria
    };

    const temFiltroEstruturante = Boolean(filtrosEfetivos.grupo || filtrosEfetivos.categoria || filtrosEfetivos.fabricante);

    if (!temFiltroEstruturante) {
      if (validateNonEmpty) {
        setEmptyFieldsWarning('Para buscar, selecione pelo menos: Grupo, Peça ou Fabricante.');
      }
      // Limpar avisos de incompatibilidade quando mostrar aviso de campos vazios
      setWarningMarca('');
      setWarningModelo('');
      setWarningAno('');
      setWarningFabricante('');

      // Não carregar nada (evita puxar tudo do Supabase/JSON)
      setPecas([]);
      return;
    }

    setLoading(true);
    setError('');
    const filtros = filtrosEfetivos;

    try {
      const data = await apiService.buscarPecasML(filtros);
      const pecasFiltradas = data?.pecas || [];

      // Always reflect the current filter in the catálogo (even if empty)
      setPecas(pecasFiltradas);

      if (pecasFiltradas.length === 0) {
        const filtrosAtivos = [];
        if (filtros.marca) filtrosAtivos.push(`Marca: ${filtros.marca}`);
        if (filtros.modelo) filtrosAtivos.push(`Modelo: ${filtros.modelo}`);
        if (filtros.ano) filtrosAtivos.push(`Ano: ${filtros.ano}`);
        if (filtros.motor) filtrosAtivos.push(`Motor: ${filtros.motor}`);
        if (filtros.versao) filtrosAtivos.push(`Versão: ${filtros.versao}`);
        if (filtros.combustivel) filtrosAtivos.push(`Combustível: ${filtros.combustivel}`);
        if (filtros.cambio) filtrosAtivos.push(`Câmbio: ${filtros.cambio}`);
        if (filtros.carroceria) filtrosAtivos.push(`Carroceria: ${filtros.carroceria}`);
        if (filtros.grupo) filtrosAtivos.push(`Grupo: ${filtros.grupo}`);
        if (filtros.categoria) filtrosAtivos.push(`Peça: ${filtros.categoria}`);
        if (filtros.fabricante) filtrosAtivos.push(`Fabricante: ${filtros.fabricante}`);

        const mensagem = filtrosAtivos.length > 0
          ? `Nenhuma peça encontrada para: ${filtrosAtivos.join(', ')}. Tente remover alguns filtros ou buscar por termos mais genéricos.`
          : 'Nenhuma peça encontrada para os filtros selecionados.';
        setError(mensagem);
      }
    } catch (err) {
      console.error('❌ Erro na busca:', err);
      setError(err.message || 'Erro ao buscar peças');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await runSearch({ validateNonEmpty: true });
  };

  const applyAiSuggestions = async () => {
    setAiError('');
    setAiQuestions([]);

    const q = String(aiQuery || '').trim();
    if (!q) {
      setAiError('Digite o que você precisa para eu sugerir os filtros.');
      return;
    }

    setAiLoading(true);
    try {
      const context = {
        marca: selectedMarca,
        modelo: selectedModelo,
        ano: selectedAno,
        carroSelecionadoId
      };

      const result = await apiService.suggestFiltersAI({ query: q, context });
      const suggested = (result && result.filters) ? result.filters : {};

      const nextGrupo = suggested.grupo || '';
      const nextCategoria = suggested.categoria || '';
      const nextFabricante = suggested.fabricante || '';

      // Apply suggested structural filters to UI
      if (nextGrupo) setSelectedGrupo(nextGrupo);
      if (nextCategoria) setSelectedCategoria(nextCategoria);
      if (nextFabricante) setSelectedFabricante(nextFabricante);

      // If user is in general search mode (no saved car selected), allow AI to fill missing vehicle year.
      if (!carroSelecionadoId) {
        if (!selectedAno && suggested.ano) setSelectedAno(String(suggested.ano));
        if (!selectedMarca && suggested.marca) setSelectedMarca(String(suggested.marca));
        if (!selectedModelo && suggested.modelo) setSelectedModelo(String(suggested.modelo));
      }

      const hasStructural = Boolean(nextGrupo || nextCategoria || nextFabricante);
      const qs = Array.isArray(result?.questions) ? result.questions : [];

      // Always show backend follow-up questions (if any), even when we can run a search.
      if (qs.length) setAiQuestions(qs);
      if (!hasStructural) {
        if (qs.length) setAiQuestions(qs);
        else setAiQuestions(['Não consegui identificar Grupo/Peça/Fabricante. Tente ser mais específico.']);
        return;
      }

      // Trigger search using effective (override) filters to avoid React async state timing.
      await runSearch({
        validateNonEmpty: true,
        overrideFilters: {
          grupo: nextGrupo || selectedGrupo,
          categoria: nextCategoria || selectedCategoria,
          fabricante: nextFabricante || selectedFabricante,
          marca: suggested.marca || selectedMarca,
          modelo: suggested.modelo || selectedModelo,
          ano: suggested.ano || selectedAno,
          motor: selectedMotor,
          versao: selectedVersao,
          combustivel: selectedCombustivel,
          cambio: selectedCambio,
          carroceria: selectedCarroceria
        }
      });
    } catch (e) {
      setAiError(e && e.message ? e.message : 'Erro ao sugerir filtros');
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-filter when a car is selected
  useEffect(() => {
    // If cleared, restore full catalog
    if (!carroSelecionadoId) {
      setError('');
      setEmptyFieldsWarning('');
      setPecas([]);
      return;
    }

    // Debounce a bit to avoid flicker if multiple state updates happen together
    const t = setTimeout(() => {
      runSearch({ validateNonEmpty: false });
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carroSelecionadoId]);

  const handleClear = () => {
    setSelectedGrupo('');
    setSelectedCategoria('');
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAno('');
    setSelectedFabricante('');
    setSelectedMotor('');
    setSelectedVersao('');
    setSelectedCombustivel('');
    setSelectedCambio('');
    setSelectedCarroceria('');
    setCarroSelecionadoId('');
    setCarroSelecionadoLabel('');
    setSearchFormKey((k) => k + 1);
    // Ao limpar, não voltar para o catálogo completo (performance)
    setPecas([]);
    setError('');
    setWarningMarca('');
    setWarningModelo('');
    setWarningAno('');
    setWarningFabricante('');
    setEmptyFieldsWarning('');
    setAiQuery('');
    setAiQuestions([]);
    setAiError('');
  };

  return (
    <>
      {/* Menu dinâmico: MenuLogin para visitantes, Menu para usuários logados */}
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      {usuarioLogado && <div className="site-header-spacer"></div>}
      <div className="page-wrapper menu-page">
  <div className="page-content buscarpeca-section">
              <h2 className="page-title">Buscar Peças</h2>
              
              <p className="page-subtitle">
                Escolha seu carro e a peça. O catálogo mostra opções compatíveis e alternativas.
              </p>

              <div className="buscarpeca-ai">
                <div className="buscarpeca-ai-title">Sugestão por IA (beta)</div>
                <div className="buscarpeca-ai-row">
                  <input
                    type="text"
                    className="buscarpeca-ai-input"
                    placeholder='Ex: "pastilha dianteira", "filtro de óleo", "amortecedor traseiro"'
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyAiSuggestions();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="buscarpeca-ai-btn"
                    onClick={applyAiSuggestions}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Analisando...' : 'Aplicar'}
                  </button>
                </div>

                {aiError ? <div className="buscarpeca-ai-error">{aiError}</div> : null}
                {Array.isArray(aiQuestions) && aiQuestions.length > 0 ? (
                  <div className="buscarpeca-ai-questions">
                    <div className="buscarpeca-ai-questions-title">Perguntas rápidas</div>
                    <ul>
                      {aiQuestions.map((q, idx) => (
                        <li key={`${idx}-${q}`}>{q}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

            <SearchForm
              key={searchFormKey}
              selectedGrupo={selectedGrupo}
              setSelectedGrupo={setSelectedGrupo}
              selectedCategoria={selectedCategoria}
              setSelectedCategoria={setSelectedCategoria}
              selectedMarca={selectedMarca}
              setSelectedMarca={setSelectedMarca}
              selectedModelo={selectedModelo}
              setSelectedModelo={setSelectedModelo}
              selectedAno={selectedAno}
              setSelectedAno={setSelectedAno}
              selectedFabricante={selectedFabricante}
              setSelectedFabricante={setSelectedFabricante}
              selectedMotor={selectedMotor}
              setSelectedMotor={setSelectedMotor}
              selectedVersao={selectedVersao}
              setSelectedVersao={setSelectedVersao}
              selectedCombustivel={selectedCombustivel}
              setSelectedCombustivel={setSelectedCombustivel}
              selectedCambio={selectedCambio}
              setSelectedCambio={setSelectedCambio}
              selectedCarroceria={selectedCarroceria}
              setSelectedCarroceria={setSelectedCarroceria}
              motores={motores}
              versoes={versoes}
              grupos={grupos}
              todasPecas={getFilteredPecas()}
              marcas={getFilteredMarcas()}
              modelos={getFilteredModelos()}
              anos={getFilteredAnos()}
              fabricantes={getFilteredFabricantes()}
              onSearch={handleSearch}
              onClear={handleClear}
              onCarroChange={setCarroSelecionadoId}
              onCarroLabelChange={setCarroSelecionadoLabel}
              loading={loading}
              error={error}
              warningMarca={warningMarca}
              warningModelo={warningModelo}
              warningAno={warningAno}
              warningFabricante={warningFabricante}
              emptyFieldsWarning={emptyFieldsWarning}
            />

            <div className="buscarpeca-results">
              <div className="buscarpeca-results-header">
                <h3 className="buscarpeca-results-title">Catálogo</h3>
                <div className="buscarpeca-results-count">{Array.isArray(pecas) ? pecas.length : 0} item(ns)</div>
              </div>
              <PecasGrid
                pecas={pecas}
                onViewCompatibility={openDrawerCompat}
                onViewDetails={openDrawerDetails}
              />
            </div>
        </div>
      </div>

      <ProductDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        productId={drawerProductId}
        initialTab={drawerInitialTab}
        selectedCarId={carroSelecionadoId}
        selectedCarLabel={carroSelecionadoLabel}
      />
    </>
  );
}
