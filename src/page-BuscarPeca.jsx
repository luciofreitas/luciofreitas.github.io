import React, { useState, useContext, use-effect } from 'react';
import Menu from './components/Menu';
import { AuthContext } from './App';
import { apiService } from './utils/apiService';
import CompatibilityModal from './CompatibilityModal';
import ProductDetailModal from './components/ProductDetailModal';
import SearchForm from './components/SearchForm';
import PecasGrid from './components/PecasGrid';
import CompatibilityGrid from './components/CompatibilityGrid';
import './page-BuscarPeca.css';

export default function BuscarPeca() {
  const { usuario-logado } = useContext(AuthContext) || {};
  
  // filters and data
  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedModelo, setSelectedModelo] = useState('');
  const [selectedAno, setSelectedAno] = useState('');
  const [selectedFabricante, setSelectedFabricante] = useState('');

  const [grupos, setGrupos] = useState([]);
  const [todas-pecas, setTodasPecas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  
  // modal de detalhes da peça
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  use-effect(() => {
    const loadMeta = async () => {
      try {
        const data = await apiService.get-pecas-meta();
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
    window.add-event-listener('app-refresh', onRefresh);
    return () => window.remove-event-listener('app-refresh', onRefresh);
  }, []);

  // Clear dependent selections when parent selections change
  use-effect(() => {
    // When grupo changes, clear categoria and fabricante
    setSelectedCategoria('');
    setSelectedFabricante('');
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAno('');
  }, [selectedGrupo]);

  use-effect(() => {
    // When categoria changes, clear fabricante
    setSelectedFabricante('');
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAno('');
  }, [selectedCategoria]);

  use-effect(() => {
    // When fabricante changes, clear marca, modelo, ano
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAno('');
  }, [selectedFabricante]);

  use-effect(() => {
    // When marca changes, clear modelo and ano
    setSelectedModelo('');
    setSelectedAno('');
  }, [selectedMarca]);

  use-effect(() => {
    // When modelo changes, clear ano
    setSelectedAno('');
  }, [selectedModelo]);

  // Filtrar opções de dropdown baseado nas seleções atuais
  const getFilteredPecas = () => {
    // Verificação de segurança - retorna vazio se dados não carregaram
    if (!todas-pecas || todas-pecas.length === 0) {
      return [];
    }
    
    if (!selectedGrupo || selectedGrupo === '') {
      const todasPecasNomes = Array.from(new Set(todas-pecas.map(p => p.name || '').filter(Boolean)));
      return todasPecasNomes;
    }
    
    // Filtrar peças pelo grupo selecionado
    const pecasFiltradas = todas-pecas.filter(p => {
      if (!p.category) return false;
      const match = p.category.to-lower-case().trim() === selectedGrupo.to-lower-case().trim();
      return match;
    });
    
    const nomesUnicos = Array.from(new Set(pecasFiltradas.map(p => p.name || '').filter(Boolean)));
    return nomesUnicos;
  };

  const getFilteredFabricantes = () => {
    if (!Array.is-array(todas-pecas)) return [];
    let filtered = todas-pecas;
    if (selectedGrupo) {
      filtered = filtered.filter(p => p && p.category === selectedGrupo);
    }
    if (selectedCategoria) {
      filtered = filtered.filter(p => p && p.name === selectedCategoria);
    }
    return Array.from(new Set(filtered.map(p => p && p.manufacturer).filter(Boolean)));
  };

  const getFilteredMarcas = () => {
    if (!Array.is-array(todas-pecas)) return [];
    let filtered = todas-pecas;
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
    filtered.for-each(peca => {
      if (peca && peca.applications && Array.is-array(peca.applications)) {
        peca.applications.for-each(app => {
          const appStr = String(app).to-lower-case();
          // Extract brand names from application strings
          const commonBrands = ['ford', 'chevrolet', 'volkswagen', 'fiat', 'honda', 'toyota', 'hyundai', 'nissan', 'renault', 'peugeot', 'citroën', 'bmw', 'mercedes', 'audi', 'volvo', 'mitsubishi', 'kia', 'suzuki', 'jeep', 'land rover', 'jaguar'];
          commonBrands.for-each(brand => {
            if (appStr.includes(brand)) {
              marcasSet.add(brand.char-at(0).to-upper-case() + brand.slice(1));
            }
          });
        });
      }
    });
    return Array.from(marcasSet);
  };

  const getFilteredModelos = () => {
    if (!selectedMarca) return Array.is-array(modelos) ? modelos : [];
    if (!Array.is-array(todas-pecas)) return [];
    
    let filtered = todas-pecas;
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
    const marcaLower = selectedMarca.to-lower-case();
    
    filtered.for-each(peca => {
      if (peca && peca.applications && Array.is-array(peca.applications)) {
        peca.applications.for-each(app => {
          const appStr = String(app).to-lower-case();
          if (appStr.includes(marcaLower)) {
            // Extract model from application string - this is a simplified approach
            const parts = appStr.split(' ');
            const marcaIndex = parts.find-index(part => part.includes(marcaLower));
            if (marcaIndex >= 0 && marcaIndex < parts.length - 1) {
              const possibleModel = parts[marcaIndex + 1];
              if (possibleModel && possibleModel.length > 1) {
                modelosSet.add(possibleModel.char-at(0).to-upper-case() + possibleModel.slice(1));
              }
            }
          }
        });
      }
    });
    return Array.from(modelosSet);
  };

  const getFilteredAnos = () => {
    if (!selectedMarca && !selectedModelo) return Array.is-array(anos) ? anos : [];
    if (!Array.is-array(todas-pecas)) return [];
    
    let filtered = todas-pecas;
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
    const marcaLower = selectedMarca?.to-lower-case();
    const modeloLower = selectedModelo?.to-lower-case();
    
    filtered.for-each(peca => {
      if (peca && peca.applications && Array.is-array(peca.applications)) {
        peca.applications.for-each(app => {
          const appStr = String(app).to-lower-case();
          const matchesMarca = !marcaLower || appStr.includes(marcaLower);
          const matchesModelo = !modeloLower || appStr.includes(modeloLower);
          
          if (matchesMarca && matchesModelo) {
            // Extract years from application string
            const yearRegex = /\d{4}(?:-\d{4})?/g;
            const yearMatches = appStr.match(yearRegex) || [];
            yearMatches.for-each(yearStr => {
              if (yearStr.includes('-')) {
                const [start, end] = yearStr.split('-').map(Number);
                for (let y = start; y <= end; y++) {
                  anosSet.add(String(y));
                }
              } else {
                anosSet.add(yearStr);
              }
            });
          }
        });
      }
    });
    return Array.from(anosSet).sort();
  };

  const renderPecasModal = (lista) => (
    <div className="buscarpeca-modal-pecas">
      <div className="compat-results-grid">
        <PecasGrid 
          pecas={lista} 
          onViewCompatibility={openModal}
          onViewDetails={openProductDetailModal}
        />
      </div>
    </div>
  );

  const openProductDetailModal = (productId) => {
    setSelectedProductId(productId);
    setShowProductDetailModal(true);
  };

  const closeProductDetailModal = () => {
    setShowProductDetailModal(false);
    setSelectedProductId(null);
  };

  const openModal = (pecaOrId) => {
  const peca = typeof pecaOrId === 'object' && pecaOrId ? pecaOrId : pecas.find(p => p.id === pecaOrId);
    setModalTitle('Compatibilidade');
    if (!peca || !peca.applications) {
      console.debug('[BuscarPeca] no applications for peca', peca);
      setModalContent(<div>Nenhuma aplicação encontrada.</div>);
      setShowModal(true);
      return;
    }

    const compatContent = (
      <div className="buscarpeca-compat-wrapper">
        <CompatibilityGrid applications={peca.applications} usuario-logado={usuario-logado} />
      </div>
    );

    setModalContent(compatContent);
    setShowModal(true);
  };

  const handleSearch = async (e) => {
    if (e && e.prevent-default) e.prevent-default();
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
    const data = await apiService.filtrar-pecas(filtros);
    const pecasFiltradas = data.results || [];
      setPecas(pecasFiltradas);
      if (pecasFiltradas.length === 0) {
        setError('Nenhuma peça encontrada para os filtros selecionados.');
      } else {
        setModalTitle(`Encontradas ${pecasFiltradas.length} peça(s)`);
        setModalContent(renderPecasModal(pecasFiltradas));
        setShowModal(true);
      }
    } catch (err) {
      setError(err.message || 'Erro ao buscar peças');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedGrupo('');
    setSelectedCategoria('');
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAno('');
    setSelectedFabricante('');
    setPecas([]);
    setError('');
  };

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page">
  <div className="page-content buscarpeca-section">
              <h2 className="page-title">Catálogo de Peças</h2>
              
              <div className="buscarpeca-intro">
                <p>
                  Encontre peças automotivas compatíveis com seu veículo. Busque por marca, modelo e ano.
                </p>
              </div>

            <SearchForm
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
              todas-pecas={getFilteredPecas()}
              marcas={getFilteredMarcas()}
              modelos={getFilteredModelos()}
              anos={getFilteredAnos()}
              fabricantes={getFilteredFabricantes()}
              onSearch={handleSearch}
              onClear={handleClear}
              loading={loading}
              error={error}
            />
        </div>
      </div>

      <CompatibilityModal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        title={modalTitle}
        titleIcon={modalTitle === 'Compatibilidade' ? './check.png' : null}
      >
        {modalContent}
      </CompatibilityModal>

      <ProductDetailModal
        isOpen={showProductDetailModal}
        onClose={closeProductDetailModal}
        productId={selectedProductId}
      />
    </>
  );
}
