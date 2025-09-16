import React, { useState, useContext, useEffect } from 'react';
import Menu from './components/Menu';
import { AuthContext } from './App';
import CompatibilityModal from './CompatibilityModal';
import SearchForm from './components/SearchForm';
import PecasGrid from './components/PecasGrid';
import CompatibilityGrid from './components/CompatibilityGrid';
import './page-BuscarPeca.css';

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

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await fetch('/api/pecas/meta');
        if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
        const data = await res.json();
        setGrupos(data.grupos || []);
        setTodasPecas(data.pecas || []);
        setMarcas(data.marcas || []);
        setModelos(data.modelos || []);
        setAnos(data.anos || []);
        setFabricantes(data.fabricantes || []);
      } catch (err) {
        console.warn('Failed to load /api/pecas/meta:', err && err.message ? err.message : err);
        setError('Não foi possível carregar os dados iniciais. Tente recarregar a página.');
      }
    };

    loadMeta();

    const onRefresh = () => loadMeta();
    window.addEventListener('app-refresh', onRefresh);
    return () => window.removeEventListener('app-refresh', onRefresh);
  }, []);

  // Clear dependent selections when parent selections change
  useEffect(() => {
    // When grupo changes, clear categoria and fabricante
    setSelectedCategoria('');
    setSelectedFabricante('');
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAno('');
  }, [selectedGrupo]);

  useEffect(() => {
    // When categoria changes, clear fabricante
    setSelectedFabricante('');
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAno('');
  }, [selectedCategoria]);

  useEffect(() => {
    // When fabricante changes, clear marca, modelo, ano
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAno('');
  }, [selectedFabricante]);

  useEffect(() => {
    // When marca changes, clear modelo and ano
    setSelectedModelo('');
    setSelectedAno('');
  }, [selectedMarca]);

  useEffect(() => {
    // When modelo changes, clear ano
    setSelectedAno('');
  }, [selectedModelo]);

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
    return nomesUnicos;
  };

  const getFilteredFabricantes = () => {
    let filtered = todasPecas;
    if (selectedGrupo) {
      filtered = filtered.filter(p => p.category === selectedGrupo);
    }
    if (selectedCategoria) {
      filtered = filtered.filter(p => p.name === selectedCategoria);
    }
    return Array.from(new Set(filtered.map(p => p.manufacturer).filter(Boolean)));
  };

  const getFilteredMarcas = () => {
    let filtered = todasPecas;
    if (selectedGrupo) {
      filtered = filtered.filter(p => p.category === selectedGrupo);
    }
    if (selectedCategoria) {
      filtered = filtered.filter(p => p.name === selectedCategoria);
    }
    if (selectedFabricante) {
      filtered = filtered.filter(p => p.manufacturer === selectedFabricante);
    }
    
    const marcasSet = new Set();
    filtered.forEach(peca => {
      if (peca.applications) {
        peca.applications.forEach(app => {
          const appStr = String(app).toLowerCase();
          // Extract brand names from application strings
          const commonBrands = ['ford', 'chevrolet', 'volkswagen', 'fiat', 'honda', 'toyota', 'hyundai', 'nissan', 'renault', 'peugeot', 'citroën', 'bmw', 'mercedes', 'audi', 'volvo', 'mitsubishi', 'kia', 'suzuki', 'jeep', 'land rover', 'jaguar'];
          commonBrands.forEach(brand => {
            if (appStr.includes(brand)) {
              marcasSet.add(brand.charAt(0).toUpperCase() + brand.slice(1));
            }
          });
        });
      }
    });
    return Array.from(marcasSet);
  };

  const getFilteredModelos = () => {
    if (!selectedMarca) return modelos;
    
    let filtered = todasPecas;
    if (selectedGrupo) {
      filtered = filtered.filter(p => p.category === selectedGrupo);
    }
    if (selectedCategoria) {
      filtered = filtered.filter(p => p.name === selectedCategoria);
    }
    if (selectedFabricante) {
      filtered = filtered.filter(p => p.manufacturer === selectedFabricante);
    }
    
    const modelosSet = new Set();
    const marcaLower = selectedMarca.toLowerCase();
    
    filtered.forEach(peca => {
      if (peca.applications) {
        peca.applications.forEach(app => {
          const appStr = String(app).toLowerCase();
          if (appStr.includes(marcaLower)) {
            // Extract model from application string - this is a simplified approach
            const parts = appStr.split(' ');
            const marcaIndex = parts.findIndex(part => part.includes(marcaLower));
            if (marcaIndex >= 0 && marcaIndex < parts.length - 1) {
              const possibleModel = parts[marcaIndex + 1];
              if (possibleModel && possibleModel.length > 1) {
                modelosSet.add(possibleModel.charAt(0).toUpperCase() + possibleModel.slice(1));
              }
            }
          }
        });
      }
    });
    return Array.from(modelosSet);
  };

  const getFilteredAnos = () => {
    if (!selectedMarca && !selectedModelo) return anos;
    
    let filtered = todasPecas;
    if (selectedGrupo) {
      filtered = filtered.filter(p => p.category === selectedGrupo);
    }
    if (selectedCategoria) {
      filtered = filtered.filter(p => p.name === selectedCategoria);
    }
    if (selectedFabricante) {
      filtered = filtered.filter(p => p.manufacturer === selectedFabricante);
    }
    
    const anosSet = new Set();
    const marcaLower = selectedMarca?.toLowerCase();
    const modeloLower = selectedModelo?.toLowerCase();
    
    filtered.forEach(peca => {
      if (peca.applications) {
        peca.applications.forEach(app => {
          const appStr = String(app).toLowerCase();
          const matchesMarca = !marcaLower || appStr.includes(marcaLower);
          const matchesModelo = !modeloLower || appStr.includes(modeloLower);
          
          if (matchesMarca && matchesModelo) {
            // Extract years from application string
            const yearRegex = /\d{4}(?:-\d{4})?/g;
            const yearMatches = appStr.match(yearRegex) || [];
            yearMatches.forEach(yearStr => {
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
        <PecasGrid pecas={lista} onViewCompatibility={openModal} />
      </div>
    </div>
  );

  const openModal = (pecaOrId) => {
    const peca = typeof pecaOrId === 'object' && pecaOrId ? pecaOrId : pecas.find(p => p.id === pecaOrId);
    console.debug('[BuscarPeca] openModal called for', pecaOrId, 'resolved=', !!peca);
    setModalTitle('Compatibilidade');
    if (!peca || !peca.applications) {
      console.debug('[BuscarPeca] no applications for peca', peca);
      setModalContent(<div>Nenhuma aplicação encontrada.</div>);
      setShowModal(true);
      return;
    }

    const compatContent = (
      <div className="buscarpeca-compat-wrapper">
        <CompatibilityGrid applications={peca.applications} usuarioLogado={usuarioLogado} />
      </div>
    );

    setModalContent(compatContent);
    setShowModal(true);
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      const res = await fetch('/api/pecas/filtrar', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(filtros) 
      });
      const data = await res.json();
      const pecasFiltradas = data.pecas || [];
  console.debug('[BuscarPeca] search result count=', pecasFiltradas.length, 'sample=', pecasFiltradas.slice(0,5));
      setPecas(pecasFiltradas);
      if (pecasFiltradas.length === 0) {
        setError(data.mensagem || 'Nenhuma peça encontrada para os filtros selecionados.');
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
              todasPecas={getFilteredPecas()}
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
        titleIcon={modalTitle === 'Compatibilidade' ? '/check.png' : null}
      >
        {modalContent}
      </CompatibilityModal>
    </>
  );
}
