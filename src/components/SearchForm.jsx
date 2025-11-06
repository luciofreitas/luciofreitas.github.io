import React, { useState, useEffect, useContext } from 'react';
import './SearchForm.css';
import CustomDropdown from './CustomDropdown';
import LoadingSpinner from './LoadingSpinner';
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
  emptyFieldsWarning
}) {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const [carros, setCarros] = useState([]);
  const [carroSelecionado, setCarroSelecionado] = useState('');

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
      }
    };
    loadUserCars();
  }, [usuarioLogado]);

  // Quando seleciona um carro, preenche os campos
  const handleCarroChange = (carId) => {
    setCarroSelecionado(carId);
    
    if (!carId) {
      // Se desmarcou, não faz nada (permite busca geral)
      return;
    }

    const carro = carros.find(c => c.id === carId);
    if (carro) {
      setSelectedMarca(carro.marca);
      // Set only the model name (without brand) to match getFilteredModelos format
      setSelectedModelo(carro.modelo);
      // Converte ano para string, pois pode estar como número
      setSelectedAno(String(carro.ano));
    }
  };

  return (
  <form className="search-form" onSubmit={onSearch} aria-label="Formulário de busca de peças">
      {/* Dropdown de carros - só aparece se usuário logado e tiver carros */}
      {usuarioLogado && carros.length > 0 && (
        <div className="search-form-car-selector">
          <label htmlFor="carro-selecionado">Buscar por um carro específico (opcional)</label>
          <CustomDropdown
            options={[
              { value: '', label: '-- Busca geral (deixar em branco) --' },
              ...carros.map(c => ({
                value: c.id,
                label: `${c.marca} ${c.modelo} ${c.ano}${c.isDefault ? ' ⭐' : ''}`
              }))
            ]}
            value={carroSelecionado}
            onChange={handleCarroChange}
            placeholder="Selecione um carro cadastrado"
          />
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
          />
        </div>
      </div>

      <div className="search-form-row">
        <div className="search-form-field">
          <label htmlFor="marca">Marca</label>
          <CustomDropdown
            options={[{ value: '', label: '' }, ...marcas.map(m => ({ value: m, label: m }))]}
            value={selectedMarca}
            onChange={setSelectedMarca}
            placeholder=""
          />
        </div>
        <div className="search-form-field">
          <label htmlFor="modelo">Modelo</label>
          <CustomDropdown
            options={[{ value: '', label: '' }, ...modelos.map(m => ({ value: m, label: m }))]}
            value={selectedModelo}
            onChange={setSelectedModelo}
            placeholder=""
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
          />
        </div>
        <div className="search-form-field">
          <label htmlFor="fabricante">Fabricante</label>
          <CustomDropdown
            options={[{ value: '', label: '' }, ...fabricantes.map(f => ({ value: f, label: f }))]}
            value={selectedFabricante}
            onChange={setSelectedFabricante}
            placeholder=""
          />
        </div>
      </div>

      <div className="search-form-actions">
        <div className="search-form-buttons-row">
          <div className="search-form-buttons">
            <button className="search-form-btn search-form-btn-primary" type="submit" disabled={loading}>
              {loading ? (
                <span className="loading-inline">
                  <LoadingSpinner size="small" color="primary" />
                  Buscando...
                </span>
              ) : (
                'Buscar'
              )}
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
    </form>
  );
}

export default SearchForm;
