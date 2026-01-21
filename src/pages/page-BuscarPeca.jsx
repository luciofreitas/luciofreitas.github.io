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

  const [grupos, setGrupos] = useState([]);
  // Lista de nomes de peças (para dropdown). Não carregamos o catálogo completo no início.
  const [todasPecas, setTodasPecas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
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
        
        setGrupos(data.grupos || []);
        setTodasPecas(data.pecas || []);
        setMarcas(data.marcas || []);
        setModelos(data.modelos || []);
        setAnos(data.anos || []);
        setFabricantes(data.fabricantes || []);
        
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

  // Observação: removemos a validação de compatibilidade baseada no catálogo completo
  // para evitar carregar todas as peças no início (ganho de performance).

  // Filtrar opções de dropdown baseado nas seleções atuais
  const getFilteredPecas = () => {
    // Meta já vem como lista de nomes; não filtramos por grupo aqui
    // para evitar depender de um índice completo de peças.
    return Array.isArray(todasPecas) ? todasPecas : [];
  };

  const getFilteredFabricantes = () => {
    return Array.isArray(fabricantes) ? fabricantes : [];
  };

  const getFilteredMarcas = () => {
    return Array.isArray(marcas) ? marcas : [];
  };

  const getFilteredModelos = () => {
    if (!selectedMarca) return Array.isArray(modelos) ? modelos : [];
    if (!Array.isArray(todasPecas)) return [];
    
    let filtered = todasPecas;
    if (selectedGrupo) {
      filtered = filtered.filter(p => p && p.category === selectedGrupo);
    }
    if (selectedCategoria) {
      filtered = filtered.filter(p => p && p.name === selectedCategoria);
    }
    if (selectedFabricante) {
      filtered = filtered.filter(p => p && p.manufacturer === selectedFabricante);
    }
    
    const modelosSet = new Set();
    const marcaLower = selectedMarca.toLowerCase();
    
    filtered.forEach(peca => {
      if (peca && peca.applications && Array.isArray(peca.applications)) {
        peca.applications.forEach(app => {
          if (typeof app === 'string') {
            const parts = app.trim().split(/\s+/);
            if (parts.length >= 2) {
              const marca = parts[0].toLowerCase();
              const modelo = parts[1];
              // Check if this application matches the selected brand
              if (marca === marcaLower) {
                modelosSet.add(modelo);
              }
            }
          } else if (typeof app === 'object' && app.make && app.model) {
            if (app.make.toLowerCase() === marcaLower) {
              modelosSet.add(app.model);
            }
          }
        });
      }
    });
    
    const modelosArray = Array.from(modelosSet).sort();
    
    // Only preserve selected model if user has selected a specific car
    if (carroSelecionadoId && selectedModelo && !modelosArray.includes(selectedModelo)) {
      modelosArray.push(selectedModelo);
    }
    
    return modelosArray;
  };

  const getFilteredAnos = () => {
    if (!selectedMarca && !selectedModelo) return Array.isArray(anos) ? anos : [];
    if (!Array.isArray(todasPecas)) return [];
    
    let filtered = todasPecas;
    if (selectedGrupo) {
      filtered = filtered.filter(p => p && p.category === selectedGrupo);
    }
    if (selectedCategoria) {
      filtered = filtered.filter(p => p && p.name === selectedCategoria);
    }
    if (selectedFabricante) {
      filtered = filtered.filter(p => p && p.manufacturer === selectedFabricante);
    }
    
    const anosSet = new Set();
    const marcaLower = selectedMarca?.toLowerCase();
    const modeloLower = selectedModelo?.toLowerCase();
    
    filtered.forEach(peca => {
      if (peca && peca.applications && Array.isArray(peca.applications)) {
        peca.applications.forEach(app => {
          if (typeof app === 'string') {
            const parts = app.trim().split(/\s+/);
            if (parts.length >= 2) {
              const marca = parts[0].toLowerCase();
              const modelo = parts[1].toLowerCase();
              
              const matchesMarca = !marcaLower || marca === marcaLower;
              const matchesModelo = !modeloLower || modelo === modeloLower;
              
              if (matchesMarca && matchesModelo) {
                // Extract years from application string
                const yearRegex = /\b(19|20)\d{2}\b/g;
                const yearMatches = app.match(yearRegex) || [];
                yearMatches.forEach(year => anosSet.add(year));
              }
            }
          } else if (typeof app === 'object') {
            const matchesMarca = !marcaLower || (app.make && app.make.toLowerCase() === marcaLower);
            const matchesModelo = !modeloLower || (app.model && app.model.toLowerCase() === modeloLower);
            
            if (matchesMarca && matchesModelo && app.year) {
              anosSet.add(String(app.year));
            }
          }
        });
      }
    });
    
    const anosArray = Array.from(anosSet).sort();
    
    // Only preserve selected year if user has selected a specific car
    if (carroSelecionadoId && selectedAno && !anosArray.includes(selectedAno)) {
      anosArray.push(selectedAno);
      anosArray.sort();
    }
    
    return anosArray;
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

  const runSearch = async ({ validateNonEmpty = true } = {}) => {
    // Limpar mensagem de campos vazios ao tentar buscar
    setEmptyFieldsWarning('');

    // Para performance: não buscar se isso implicar carregar o catálogo inteiro.
    // Exigimos pelo menos um filtro "estruturante" (grupo/peça/fabricante).
    const temFiltroEstruturante = Boolean(selectedGrupo || selectedCategoria || selectedFabricante);

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
    const filtros = {
      grupo: selectedGrupo,
      categoria: selectedCategoria,
      marca: selectedMarca,
      modelo: selectedModelo,
      ano: selectedAno,
      fabricante: selectedFabricante
    };

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
