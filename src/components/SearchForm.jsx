import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchForm.css';
import CustomDropdown from './CustomDropdown';
import SmallLoadingModal from './SmallLoadingModal';
import { AuthContext } from '../App';
import { getCars } from '../services/carService';

function SearchForm({
  selectedGrupo,
  setSelectedGrupo,
  selectedCategoria,
  setSelectedCategoria,
  selectedMarca,
  setSelectedMarca,
  selectedModelo,
  setSelectedModelo,
  selectedAno,
  setSelectedAno,
  selectedFabricante,
  setSelectedFabricante,
  grupos,
  todasPecas,
  marcas,
  modelos,
  anos,
  fabricantes,
  onSearch,
  onClear,
  loading,
  error,
  warningMarca,
  warningModelo,
  warningAno,
  warningFabricante,
  emptyFieldsWarning,
  onCarroChange, // callback to notify parent when car is selected
  onCarroLabelChange // callback to notify parent with car label (marca/modelo/ano)
}) {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [carros, setCarros] = useState([]);
  const [carroSelecionado, setCarroSelecionado] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Carrega carros do usuário quando logado
  useEffect(() => {
    const loadUserCars = async () => {
      if (usuarioLogado) {
        const userId = usuarioLogado.id || usuarioLogado.email;
        const userCars = await getCars(userId);
        setCarros(userCars);
      } else {
        setCarros([]);
        setCarroSelecionado('');

        if (onCarroChange) onCarroChange('');
        if (onCarroLabelChange) onCarroLabelChange('');
      }
    };
    loadUserCars();
  }, [usuarioLogado, onCarroChange, onCarroLabelChange]);

  const carroAtivo = useMemo(() => {
    if (!Array.isArray(carros) || carros.length === 0) return null;
    if (!carroSelecionado) return null;
    return carros.find(c => c && c.id === carroSelecionado) || null;
  }, [carros, carroSelecionado]);

  // Quando seleciona um carro, preenche os campos
  const handleCarroChange = (carId) => {
    setCarroSelecionado(carId);

    // Hide advanced filters when a car context is chosen; users can still open them.
    if (carId) setShowAdvanced(false);
    
    if (!carId) {
      // Se desmarcou, não faz nada (permite busca geral)
      setShowAdvanced(true);

      // Notify parent after local state adjustments
      if (onCarroChange) {
        onCarroChange(carId);
      }
      if (onCarroLabelChange) {
        onCarroLabelChange('');
      }
      return;
    }

    const carro = carros.find(c => c.id === carId);
    if (carro) {
      setSelectedMarca(carro.marca);
      // Set only the model name (without brand) to match getFilteredModelos format
      setSelectedModelo(carro.modelo);
      // Converte ano para string, pois pode estar como número
      setSelectedAno(String(carro.ano));

      if (onCarroLabelChange) {
        onCarroLabelChange(`${carro.marca} ${carro.modelo} ${carro.ano}`);
      }
    } else if (onCarroLabelChange) {
      onCarroLabelChange('');
    }

    // Notify parent component about car selection change *after* filters are set
    if (onCarroChange) {
      onCarroChange(carId);
    }
  };

  return (
  <form className="search-form" onSubmit={onSearch} aria-label="Formulário de busca de peças">
      {/* Carro ativo (contexto principal) */}
      {usuarioLogado && (
        <div className="search-form-car-selector">
          <div className="search-form-car-header">
            <div>
              <div className="search-form-car-title">Carro ativo</div>
              <div className="search-form-car-subtitle">
                {carroAtivo
                  ? `${carroAtivo.marca} ${carroAtivo.modelo} ${carroAtivo.ano}`
                  : (Array.isArray(carros) && carros.length > 0
                    ? 'Busca geral (sem carro). Selecione um carro para preencher Marca/Modelo/Ano'
                    : 'Você ainda não cadastrou nenhum carro')}
              </div>
            </div>
            <button
              type="button"
              className="search-form-manage-cars"
              onClick={() => navigate('/meus-carros')}
            >
              Meus carros
            </button>
          </div>

          {Array.isArray(carros) && carros.length > 0 ? (
            <CustomDropdown
              options={[
                { value: '', label: '-- Busca geral (sem carro) --' },
                ...carros.map(c => ({
                  value: c.id,
                  label: `${c.marca} ${c.modelo} ${c.ano}${c.isDefault ? ' ⭐' : ''}`
                }))
              ]}
              value={carroSelecionado}
              onChange={handleCarroChange}
              placeholder="Selecionar carro"
              searchable
            />
          ) : (
            <div className="search-form-car-empty">
              Cadastre um carro para deixar a busca mais rápida e precisa.
            </div>
          )}
        </div>
      )}

      <div className="search-form-row">
        <div className="search-form-field">
          <label htmlFor="grupo">Grupo</label>
          <CustomDropdown
            options={[{ value: '', label: '' }, ...grupos.map(g => ({ value: g, label: g }))]}
            value={selectedGrupo}
            onChange={setSelectedGrupo}
            placeholder=""
            searchable
          />
        </div>
        <div className="search-form-field">
          <label htmlFor="categoria">Peça</label>
          {/* CustomDropdown abre sempre para baixo e substitui o select nativo */}
          <CustomDropdown
            options={[{ value: '', label: '' }, ...todasPecas.map(n => ({ value: n, label: n }))]}
            value={selectedCategoria}
            onChange={setSelectedCategoria}
            placeholder=""
            searchable
          />
        </div>
      </div>

      <div className="search-form-advanced-row">
        <button
          type="button"
          className="search-form-advanced-btn"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced || !carroSelecionado}
        >
          {showAdvanced || !carroSelecionado ? 'Ocultar filtros avançados' : 'Filtros avançados'}
        </button>
      </div>

      {(showAdvanced || !carroSelecionado) && (
        <>
          <div className="search-form-row">
            <div className="search-form-field">
              <label htmlFor="marca">Marca</label>
              <CustomDropdown
                options={[{ value: '', label: '' }, ...marcas.map(m => ({ value: m, label: m }))]}
                value={selectedMarca}
                onChange={setSelectedMarca}
                placeholder=""
                searchable
                allowCustomValue
              />
            </div>
            <div className="search-form-field">
              <label htmlFor="modelo">Modelo</label>
              <CustomDropdown
                options={[{ value: '', label: '' }, ...modelos.map(m => ({ value: m, label: m }))]}
                value={selectedModelo}
                onChange={setSelectedModelo}
                placeholder=""
                searchable
                allowCustomValue
              />
            </div>
          </div>

          <div className="search-form-row">
            <div className="search-form-field">
              <label htmlFor="ano">Ano</label>
              <CustomDropdown
                options={[{ value: '', label: '' }, ...anos.map(a => ({ value: a, label: a }))]}
                value={selectedAno}
                onChange={setSelectedAno}
                placeholder=""
                searchable
                allowCustomValue
              />
            </div>
            <div className="search-form-field">
              <label htmlFor="fabricante">Fabricante</label>
              <CustomDropdown
                options={[{ value: '', label: 'Todos' }, ...fabricantes.map(f => ({ value: f, label: f }))]}
                value={selectedFabricante}
                onChange={setSelectedFabricante}
                placeholder=""
                searchable
              />
            </div>
          </div>
        </>
      )}

      <div className="search-form-actions">
        <div className="search-form-buttons-row">
          <div className="search-form-buttons">
            <button className="search-form-btn search-form-btn-primary" type="submit" disabled={loading}>
              Buscar
            </button>
            <button type="button" className="search-form-btn search-form-btn-secondary" onClick={onClear}>
              Limpar
            </button>
          </div>
          <div className="search-form-warnings-container">
            {emptyFieldsWarning ? (
              <div className="search-form-inline-warning" role="alert">
                ⚠️ {emptyFieldsWarning}
              </div>
            ) : warningMarca ? (
              <div className="search-form-inline-warning" role="alert">
                ⚠️ {warningMarca}
              </div>
            ) : warningModelo ? (
              <div className="search-form-inline-warning" role="alert">
                ⚠️ {warningModelo}
              </div>
            ) : warningAno ? (
              <div className="search-form-inline-warning" role="alert">
                ⚠️ {warningAno}
              </div>
            ) : warningFabricante ? (
              <div className="search-form-inline-warning" role="alert">
                ⚠️ {warningFabricante}
              </div>
            ) : null}
          </div>
        </div>
        {error && <div className="search-form-error" role="status" aria-live="polite">{error}</div>}
      </div>
      <SmallLoadingModal show={loading} text="Buscando..." />
    </form>
  );
}

export default SearchForm;
