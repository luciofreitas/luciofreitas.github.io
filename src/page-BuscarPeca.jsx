import React, { useState, useContext, useEffect } from 'react';
import Menu from './components/Menu';
import MenuLogin from './components/MenuLogin';
import { AuthContext } from './App';
import { apiService } from './utils/apiService';
import CompatibilityModal from './CompatibilityModal';
import ProductDetailModal from './components/ProductDetailModal';
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

  // Estados para mensagens de incompatibilidade
  const [warningMarca, setWarningMarca] = useState('');
  const [warningModelo, setWarningModelo] = useState('');
  const [warningAno, setWarningAno] = useState('');
  const [warningFabricante, setWarningFabricante] = useState('');
  const [emptyFieldsWarning, setEmptyFieldsWarning] = useState('');

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  
  // modal de detalhes da peça
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

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
    return Array.from(new Set(filtered.map(p => p && p.manufacturer).filter(Boolean)));
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
        <CompatibilityGrid applications={peca.applications} usuarioLogado={usuarioLogado} />
      </div>
    );

    setModalContent(compatContent);
    setShowModal(true);
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Limpar mensagem de campos vazios ao tentar buscar
    setEmptyFieldsWarning('');
    
    // Validar se pelo menos um campo foi preenchido
    const temAlgumCampo = selectedGrupo || selectedCategoria || selectedMarca || 
                          selectedModelo || selectedAno || selectedFabricante;
    
    if (!temAlgumCampo) {
      setEmptyFieldsWarning('Por favor, preencha pelo menos um campo para realizar a busca.');
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
    console.log('🔍 Buscando com filtros:', filtros);
    const data = await apiService.filtrarPecas(filtros);
    console.log('📦 Resposta da API:', data);
    console.log('📦 data.results:', data.results);
    console.log('📦 typeof data:', typeof data);
    console.log('📦 Array.isArray(data):', Array.isArray(data));
    console.log('📦 Array.isArray(data.results):', Array.isArray(data.results));
    const pecasFiltradas = data.results || [];
    console.log('✅ Peças filtradas:', pecasFiltradas.length, pecasFiltradas);
      setPecas(pecasFiltradas);
      if (pecasFiltradas.length === 0) {
        setError('Nenhuma peça encontrada para os filtros selecionados.');
      } else {
        setModalTitle(`Encontradas ${pecasFiltradas.length} peça(s)`);
        setModalContent(renderPecasModal(pecasFiltradas));
        setShowModal(true);
      }
    } catch (err) {
      console.error('❌ Erro na busca:', err);
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
              todasPecas={getFilteredPecas()}
              marcas={getFilteredMarcas()}
              modelos={getFilteredModelos()}
              anos={getFilteredAnos()}
              fabricantes={getFilteredFabricantes()}
              onSearch={handleSearch}
              onClear={handleClear}
              loading={loading}
              error={error}
              warningMarca={warningMarca}
              warningModelo={warningModelo}
              warningAno={warningAno}
              warningFabricante={warningFabricante}
              emptyFieldsWarning={emptyFieldsWarning}
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
