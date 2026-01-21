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

        // Fazer uma busca inicial sem filtros para mostrar todas as peças
        if (data.pecas && data.pecas.length > 0) {
          // make initial search with all parts
          setPecas(data.pecas);
        }
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

  // Verificar compatibilidade e gerar mensagens de aviso
  useEffect(() => {
    // Limpar mensagens
    setWarningMarca('');
    setWarningModelo('');
    setWarningAno('');
    setWarningFabricante('');
    // Limpar aviso de campos vazios quando usuário começar a preencher
    const temAlgumCampo = selectedGrupo || selectedCategoria || selectedMarca || 
                          selectedModelo || selectedAno || selectedFabricante;
    if (temAlgumCampo) {
      setEmptyFieldsWarning('');
    }

    // Verificar se há incompatibilidade entre fabricante e outros campos
    if (selectedFabricante && todasPecas.length > 0) {
      const pecasComFabricante = todasPecas.filter(p => 
        (!selectedGrupo || p.category === selectedGrupo) &&
        (!selectedCategoria || p.name === selectedCategoria) &&
        p.manufacturer === selectedFabricante
      );

      // Verificar marca
      if (selectedMarca && pecasComFabricante.length > 0) {
        const temMarca = pecasComFabricante.some(p => {
          if (!p.applications || !Array.isArray(p.applications)) return false;
          return p.applications.some(app => 
            String(app).toLowerCase().includes(selectedMarca.toLowerCase())
          );
        });
        if (!temMarca) {
          setWarningMarca(`Não há peças do fabricante "${selectedFabricante}" compatíveis com a marca "${selectedMarca}"`);
        }
      }

      // Verificar modelo
      if (selectedModelo && pecasComFabricante.length > 0) {
        const temModelo = pecasComFabricante.some(p => {
          if (!p.applications || !Array.isArray(p.applications)) return false;
          return p.applications.some(app => 
            String(app).toLowerCase().includes(selectedModelo.toLowerCase())
          );
        });
        if (!temModelo) {
          setWarningModelo(`Não há peças do fabricante "${selectedFabricante}" compatíveis com o modelo "${selectedModelo}"`);
        }
      }

      // Verificar ano
      if (selectedAno && pecasComFabricante.length > 0) {
        const temAno = pecasComFabricante.some(p => {
          if (!p.applications || !Array.isArray(p.applications)) return false;
          return p.applications.some(app => 
            String(app).toLowerCase().includes(selectedAno)
          );
        });
        if (!temAno) {
          setWarningAno(`Não há peças do fabricante "${selectedFabricante}" compatíveis com o ano "${selectedAno}"`);
        }
      }
    }

    // Verificar incompatibilidade quando marca/modelo/ano são selecionados mas fabricante não tem peças
    if ((selectedMarca || selectedModelo || selectedAno) && selectedFabricante) {
      const pecasCompativeis = todasPecas.filter(p => {
        const grupoMatch = !selectedGrupo || p.category === selectedGrupo;
        const categoriaMatch = !selectedCategoria || p.name === selectedCategoria;
        const fabricanteMatch = p.manufacturer === selectedFabricante;
        
        if (!grupoMatch || !categoriaMatch || !fabricanteMatch) return false;
        
        if (!p.applications || !Array.isArray(p.applications)) return false;
        
        return p.applications.some(app => {
          const appStr = String(app).toLowerCase();
          const marcaMatch = !selectedMarca || appStr.includes(selectedMarca.toLowerCase());
          const modeloMatch = !selectedModelo || appStr.includes(selectedModelo.toLowerCase());
          const anoMatch = !selectedAno || appStr.includes(selectedAno);
          return marcaMatch && modeloMatch && anoMatch;
        });
      });

      if (pecasCompativeis.length === 0 && !warningMarca && !warningModelo && !warningAno) {
        setWarningFabricante(`Não há peças que atendam todos os filtros selecionados`);
      }
    }
  }, [selectedGrupo, selectedCategoria, selectedFabricante, selectedMarca, selectedModelo, selectedAno, todasPecas]);

  // Filtrar opções de dropdown baseado nas seleções atuais
  const getFilteredPecas = () => {
    // Verificação de segurança - retorna vazio se dados não carregaram
    if (!todasPecas || todasPecas.length === 0) {
      return [];
    }
    
    if (!selectedGrupo || selectedGrupo === '') {
      const todasPecasNomes = Array.from(new Set(todasPecas.map(p => p.name || '').filter(Boolean)));
      return todasPecasNomes;
    }
    
    // Filtrar peças pelo grupo selecionado
    const pecasFiltradas = todasPecas.filter(p => {
      if (!p.category) return false;
      const match = p.category.toLowerCase().trim() === selectedGrupo.toLowerCase().trim();
      return match;
    });
    
    const nomesUnicos = Array.from(new Set(pecasFiltradas.map(p => p.name || '').filter(Boolean)));
    
    // Only preserve selected category if user has selected a specific car
    if (carroSelecionadoId && selectedCategoria && !nomesUnicos.includes(selectedCategoria)) {
      nomesUnicos.push(selectedCategoria);
    }
    
    return nomesUnicos;
  };

  const getFilteredFabricantes = () => {
    if (!Array.isArray(todasPecas)) return [];
    let filtered = todasPecas;
    if (selectedGrupo) {
      filtered = filtered.filter(p => p && p.category === selectedGrupo);
    }
    if (selectedCategoria) {
      filtered = filtered.filter(p => p && p.name === selectedCategoria);
    }
    
    const fabricantesArray = Array.from(new Set(filtered.map(p => p && p.manufacturer).filter(Boolean)));
    
    // Only preserve selected manufacturer if user has selected a specific car
    if (carroSelecionadoId && selectedFabricante && !fabricantesArray.includes(selectedFabricante)) {
      fabricantesArray.push(selectedFabricante);
    }
    
    return fabricantesArray;
  };

  const getFilteredMarcas = () => {
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
    
    const marcasSet = new Set();
    filtered.forEach(peca => {
      if (peca && peca.applications && Array.isArray(peca.applications)) {
        peca.applications.forEach(app => {
          if (typeof app === 'string') {
            // Extract brand from application string (first word)
            const parts = app.trim().split(/\s+/);
            if (parts.length >= 1 && parts[0]) {
              marcasSet.add(parts[0]);
            }
          } else if (typeof app === 'object' && app.make) {
            marcasSet.add(app.make);
          }
        });
      }
    });
    
    const marcasArray = Array.from(marcasSet).sort();
    
    // Only preserve selected brand if user has selected a specific car
    if (carroSelecionadoId && selectedMarca && !marcasArray.includes(selectedMarca)) {
      marcasArray.push(selectedMarca);
    }
    
    return marcasArray;
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

    // Validar se pelo menos um campo foi preenchido
    const temAlgumCampo = selectedGrupo || selectedCategoria || selectedMarca ||
                          selectedModelo || selectedAno || selectedFabricante;

    if (validateNonEmpty && !temAlgumCampo) {
      setEmptyFieldsWarning('Por favor, preencha pelo menos um campo para realizar a busca.');
      // Limpar avisos de incompatibilidade quando mostrar aviso de campos vazios
      setWarningMarca('');
      setWarningModelo('');
      setWarningAno('');
      setWarningFabricante('');
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
      setPecas(Array.isArray(todasPecas) ? todasPecas : []);
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
    setSearchFormKey((k) => k + 1);
    // Voltar para o catálogo completo ao limpar
    setPecas(Array.isArray(todasPecas) ? todasPecas : []);
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
      />
    </>
  );
}
