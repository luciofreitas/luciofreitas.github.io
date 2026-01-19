import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { getCars, addCar, removeCar, updateCar, setDefaultCar } from '../services/carService';
import { brandList, getModelsByBrand } from '../data/carBrands';
import { comparePtBr } from '../utils/sortUtils';
import '../styles/pages/page-MeusCarros.css';

export default function MeusCarros() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  
  const [cars, setCars] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCarId, setEditingCarId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Formulário
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [modeloCustom, setModeloCustom] = useState(''); // Para quando selecionar "Outro"
  const [modelosDisponiveis, setModelosDisponiveis] = useState([]);
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [cor, setCor] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!usuarioLogado) {
      navigate('/login');
      return;
    }
    loadCars();
  }, [usuarioLogado, navigate]);

  // Atualiza modelos disponíveis quando a marca muda
  useEffect(() => {
    if (marca && marca !== 'Outro') {
      const modelos = getModelsByBrand(marca);
      setModelosDisponiveis([...(modelos || [])].sort(comparePtBr));
      // Limpa o modelo selecionado se não estiver editando
      if (!isEditing) {
        setModelo('');
        setModeloCustom('');
      }
    } else {
      setModelosDisponiveis([]);
    }
  }, [marca, isEditing]);

  const loadCars = async () => {
    if (usuarioLogado) {
      const userCars = await getCars(usuarioLogado.id || usuarioLogado.email);
      setCars(userCars);
    }
  };

  const resetForm = () => {
    setMarca('');
    setModelo('');
    setModeloCustom('');
    setModelosDisponiveis([]);
    setAno('');
    setPlaca('');
    setCor('');
    setObservacoes('');
    setIsEditing(false);
    setEditingCarId(null);
    setShowForm(false);
  };

  // Handler para mudança de marca
  const handleMarcaChange = (e) => {
    const novaMarca = e.target.value;
    setMarca(novaMarca);
    setModelo('');
    setModeloCustom('');
  };

  // Handler para mudança de modelo
  const handleModeloChange = (e) => {
    setModelo(e.target.value);
    if (e.target.value !== 'Outro') {
      setModeloCustom('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Se selecionou "Outro" no modelo, precisa preencher o campo custom
    const modeloFinal = modelo === 'Outro' ? modeloCustom : modelo;
    
    if (!marca || !modeloFinal || !ano) {
      if (window.showToast) {
        window.showToast('Preencha marca, modelo e ano', 'error', 3000);
      }
      return;
    }

    const userId = usuarioLogado.id || usuarioLogado.email;
    const carData = {
      marca: marca.trim(),
      modelo: modeloFinal.trim(),
      ano: ano.trim(),
      placa: placa.trim().toUpperCase(),
      cor: cor.trim(),
      observacoes: observacoes.trim()
    };

    if (isEditing && editingCarId) {
      await updateCar(userId, editingCarId, carData);
      if (window.showToast) {
        window.showToast('Carro atualizado com sucesso!', 'success', 3000);
      }
    } else {
      await addCar(userId, carData);
      if (window.showToast) {
        window.showToast('Carro cadastrado com sucesso!', 'success', 3000);
      }
    }

    await loadCars();
    resetForm();
  };

  const handleEdit = (car) => {
    setMarca(car.marca);
    setModelo(car.modelo);
    setAno(car.ano);
    setPlaca(car.placa || '');
    setCor(car.cor || '');
    setObservacoes(car.observacoes || '');
    setIsEditing(true);
    setEditingCarId(car.id);
    setShowForm(true);
  };

  const handleDelete = async (carId) => {
    if (window.confirm('Tem certeza que deseja excluir este carro?')) {
      const userId = usuarioLogado.id || usuarioLogado.email;
      await removeCar(userId, carId);
      await loadCars();
      if (window.showToast) {
        window.showToast('Carro removido com sucesso!', 'success', 3000);
      }
    }
  };

  const handleSetDefault = async (carId) => {
    const userId = usuarioLogado.id || usuarioLogado.email;
    await setDefaultCar(userId, carId);
    await loadCars();
    if (window.showToast) {
      window.showToast('Carro definido como padrão!', 'success', 2000);
    }
  };

  if (!usuarioLogado) {
    return null;
  }

  return (
    <>
      <Menu />
      <div className="site-header-spacer"></div>
      <div className="page-wrapper menu-page">
        <div className="page-content">
          <h2 className="page-title">Meus Carros</h2>
          
          <p className="page-subtitle">
            Cadastre seus veículos para facilitar as buscas por peças, recalls e informações específicas.
            Você pode marcar um carro como padrão para pesquisas rápidas.
          </p>

          {/* Botão adicionar */}
          {!showForm && (
            <div className="add-car-section">
              <button 
                className="btn-add-car"
                onClick={() => setShowForm(true)}
              >
                + Adicionar Carro
              </button>
            </div>
          )}

          {/* Formulário */}
          {showForm && (
            <div className="car-form-container">
              <h3 className="form-title">{isEditing ? 'Editar Carro' : 'Cadastrar Novo Carro'}</h3>
              <form onSubmit={handleSubmit} className="car-form">
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="marca">Marca *</label>
                    <select
                      id="marca"
                      value={marca}
                      onChange={handleMarcaChange}
                      required
                    >
                      <option value="">Selecione a marca</option>
                      {[...brandList].sort(comparePtBr).map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="modelo">Modelo *</label>
                    <select
                      id="modelo"
                      value={modelo}
                      onChange={handleModeloChange}
                      disabled={!marca}
                      required
                    >
                      <option value="">Selecione o modelo</option>
                      {[...modelosDisponiveis].sort(comparePtBr).map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                      <option value="Outro">Outro (digitar manualmente)</option>
                    </select>
                  </div>
                </div>

                {/* Campo de texto para modelo customizado */}
                {modelo === 'Outro' && (
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="modeloCustom">Digite o modelo *</label>
                      <input
                        type="text"
                        id="modeloCustom"
                        value={modeloCustom}
                        onChange={(e) => setModeloCustom(e.target.value)}
                        placeholder="Ex: Onix"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="ano">Ano *</label>
                    <input
                      type="text"
                      id="ano"
                      value={ano}
                      onChange={(e) => setAno(e.target.value)}
                      placeholder="Ex: 2020"
                      maxLength="4"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="placa">Placa</label>
                    <input
                      type="text"
                      id="placa"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      placeholder="Ex: ABC-1234"
                      maxLength="8"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="cor">Cor</label>
                    <input
                      type="text"
                      id="cor"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      placeholder="Ex: Prata"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="observacoes">Observações</label>
                  <textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Informações adicionais sobre o veículo..."
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    {isEditing ? 'Salvar Alterações' : 'Cadastrar Carro'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={resetForm}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de carros */}
          {cars.length > 0 ? (
            <div className="cars-list">
              <h3 className="list-title">Carros Cadastrados ({cars.length})</h3>
              <div className="cars-grid">
                {cars.map(car => (
                  <div key={car.id} className={`car-card ${car.isDefault ? 'car-card-default' : ''}`}>
                    {car.isDefault && (
                      <div className="default-badge">⭐ Padrão</div>
                    )}
                    <div className="car-header">
                      <h4 className="car-title">{car.marca} {car.modelo}</h4>
                      <span className="car-year">{car.ano}</span>
                    </div>
                    <div className="car-details">
                      {car.placa && <p className="car-info"><strong>Placa:</strong> {car.placa}</p>}
                      {car.cor && <p className="car-info"><strong>Cor:</strong> {car.cor}</p>}
                      {car.observacoes && <p className="car-info"><strong>Obs:</strong> {car.observacoes}</p>}
                    </div>
                    <div className="car-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(car)}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(car.id)}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !showForm && (
              <div className="empty-state">
                <p>🚗 Você ainda não cadastrou nenhum carro.</p>
                <p>Clique em "Adicionar Carro" para começar!</p>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
