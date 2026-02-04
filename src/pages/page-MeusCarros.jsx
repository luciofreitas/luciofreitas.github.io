import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { getCars, addCar, removeCar, updateCar } from '../services/carService';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Formulário
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [modeloCustom, setModeloCustom] = useState(''); // Para quando selecionar "Outro"
  const [modelosDisponiveis, setModelosDisponiveis] = useState([]);
  const [ano, setAno] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [chassi, setChassi] = useState('');
  const [cor, setCor] = useState('');
  const [motor, setMotor] = useState('');
  const [motorCodigo, setMotorCodigo] = useState('');
  const [cilindrada, setCilindrada] = useState('');
  const [potenciaCv, setPotenciaCv] = useState('');
  const [combustivel, setCombustivel] = useState('');
  const [cambio, setCambio] = useState('');
  const [versao, setVersao] = useState('');
  const [km, setKm] = useState('');
  const [tracao, setTracao] = useState('');
  const [carroceria, setCarroceria] = useState('');
  const [uf, setUf] = useState('');
  const [renavam, setRenavam] = useState('');
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
    setAnoModelo('');
    setPlaca('');
    setChassi('');
    setCor('');
    setMotor('');
    setMotorCodigo('');
    setCilindrada('');
    setPotenciaCv('');
    setCombustivel('');
    setCambio('');
    setVersao('');
    setKm('');
    setTracao('');
    setCarroceria('');
    setUf('');
    setRenavam('');
    setObservacoes('');
    setIsEditing(false);
    setEditingCarId(null);
    setShowForm(false);
    setShowAdvanced(false);
  };

  const normalizeVin = (value) => {
    try {
      return String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .trim();
    } catch (e) {
      return '';
    }
  };

  const isValidVin = (vin) => {
    const v = normalizeVin(vin);
    // VIN padrão: 17 caracteres, sem I/O/Q
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
  };

  const getApiBase = () => {
    try {
      if (typeof window !== 'undefined' && window.__API_BASE) return window.__API_BASE;
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return `${window.location.protocol}//${window.location.hostname}:3001`;
      }
    } catch (e) {
      // ignore
    }
    return '';
  };

  const findBrandInList = (make) => {
    if (!make) return '';
    const wanted = String(make).trim().toLowerCase();
    if (!wanted) return '';
    const found = (Array.isArray(brandList) ? brandList : []).find(b => String(b).trim().toLowerCase() === wanted);
    return found || '';
  };

  const handleAutoFillByVin = async () => {
    const vin = normalizeVin(chassi);
    if (!vin) {
      if (window.showToast) window.showToast('Digite o chassi (VIN) para buscar', 'error', 3000);
      return;
    }
    if (!isValidVin(vin)) {
      if (window.showToast) window.showToast('Chassi (VIN) inválido. Use 17 caracteres (sem I/O/Q).', 'error', 4000);
      return;
    }

    try {
      const baseUrl = getApiBase();
      const url = `${baseUrl}/api/vin/decode/${encodeURIComponent(vin)}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${txt}`);
      }
      const data = await resp.json();
      if (!data || !data.ok) {
        throw new Error(data && data.error ? data.error : 'Falha ao decodificar chassi');
      }

      const decoded = data.decoded || {};
      const make = decoded.make || '';
      const model = decoded.model || '';
      const year = decoded.year || '';
      const engine = decoded.engine || '';

      const fuelPrimary = decoded.fuelPrimary || '';
      const bodyClass = decoded.bodyClass || '';
      const driveType = decoded.driveType || '';
      const transmissionStyle = decoded.transmissionStyle || '';
      const displacementL = decoded.displacementL || '';
      const enginePowerKw = decoded.enginePowerKw || '';
      const enginePowerHp = decoded.enginePowerHp || '';
      const trim = decoded.trim || '';
      const series = decoded.series || '';

      const mapFuelToPtBr = (fuel) => {
        const f = String(fuel || '').toLowerCase();
        if (!f) return '';
        if (f.includes('flex')) return 'Flex';
        if (f.includes('flexible fuel')) return 'Flex';
        if (f.includes('ethanol')) return 'Etanol';
        if (f.includes('gasoline') || f.includes('petrol')) return 'Gasolina';
        if (f.includes('diesel')) return 'Diesel';
        if (f.includes('hybrid')) return 'Híbrido';
        if (f.includes('electric')) return 'Elétrico';
        if (f.includes('cng') || f.includes('natural gas')) return 'GNV';
        return 'Outro';
      };

      const mapBodyClass = (bc) => {
        const b = String(bc || '').toLowerCase();
        if (!b) return '';
        if (b.includes('sport utility') || b.includes('suv') || b.includes('multi-purpose')) return 'SUV';
        if (b.includes('hatch')) return 'Hatch';
        if (b.includes('sedan') || b.includes('saloon')) return 'Sedã';
        if (b.includes('pickup') || b.includes('pick-up')) return 'Picape';
        if (b.includes('station wagon') || b.includes('wagon')) return 'Perua';
        if (b.includes('minivan')) return 'Minivan';
        if (b.includes('van')) return 'Van';
        return 'Outro';
      };

      const mapTransmission = (ts) => {
        const t = String(ts || '').toLowerCase();
        if (!t) return '';
        if (t.includes('cvt')) return 'CVT';
        if (t.includes('manual')) return 'Manual';
        if (t.includes('automated manual') || t.includes('amt')) return 'Automatizado';
        if (t.includes('automatic')) return 'Automático';
        return 'Outro';
      };

      const mapDriveType = (dt) => {
        const d = String(dt || '').toLowerCase();
        if (!d) return '';
        if (d.includes('all-wheel') || d.includes('awd')) return 'AWD';
        if (d.includes('front-wheel') || d.includes('fwd')) return 'FWD';
        if (d.includes('rear-wheel') || d.includes('rwd')) return 'RWD';
        if (d.includes('4wd') || d.includes('4x4') || d.includes('four-wheel')) return '4x4';
        return 'Outro';
      };

      const maybeSet = (setter, currentValue, nextValue) => {
        if (currentValue) return;
        if (!nextValue) return;
        setter(nextValue);
      };

      // Marca/modelo: tentar casar com lista; se não, usar "Outro" e preencher manualmente.
      const brandInList = findBrandInList(make);
      if (brandInList) {
        setMarca(brandInList);
        // tenta setar modelo direto; se não existir na lista, usuário ajusta
        if (model) setModelo(model);
      } else if (make || model) {
        setMarca('Outro');
        setModelo('Outro');
        setModeloCustom(model ? String(model) : '');
      }

      if (year) setAno(String(year));
      if (engine) setMotor(String(engine));

      // Advanced fields (best-effort). Only fill if empty.
      maybeSet(setCombustivel, combustivel, mapFuelToPtBr(fuelPrimary));
      maybeSet(setCarroceria, carroceria, mapBodyClass(bodyClass));
      maybeSet(setCambio, cambio, mapTransmission(transmissionStyle));
      maybeSet(setTracao, tracao, mapDriveType(driveType));
      maybeSet(setCilindrada, cilindrada, displacementL ? String(displacementL) : '');

      const powerKw = Number(String(enginePowerKw || '').replace(',', '.'));
      const powerHp = Number(String(enginePowerHp || '').replace(',', '.'));
      if (!potenciaCv) {
        if (Number.isFinite(powerKw) && powerKw > 0) {
          const cv = Math.round(powerKw * 1.35962);
          setPotenciaCv(String(cv));
        } else if (Number.isFinite(powerHp) && powerHp > 0) {
          setPotenciaCv(String(Math.round(powerHp)));
        }
      }

      if (!versao) {
        const v = String(trim || series || '').trim();
        if (v) setVersao(v);
      }

      if (window.showToast) window.showToast('Dados preenchidos pelo chassi (quando disponível).', 'success', 3000);
    } catch (err) {
      console.warn('VIN decode failed:', err);
      if (window.showToast) window.showToast('Não foi possível buscar dados pelo chassi agora.', 'error', 3500);
    }
  };

  const normalizeRenavam = (value) => {
    try {
      return String(value || '').replace(/\D/g, '').slice(0, 11);
    } catch (e) {
      return '';
    }
  };

  const maskSensitive = (value, { keepLast = 3 } = {}) => {
    const s = String(value || '');
    if (!s) return '';
    const last = s.slice(-keepLast);
    const masked = '•'.repeat(Math.max(0, s.length - keepLast));
    return `${masked}${last}`;
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
    const chassiNorm = normalizeVin(chassi);
    if (chassiNorm && !isValidVin(chassiNorm)) {
      if (window.showToast) {
        window.showToast('Chassi (VIN) inválido. Use 17 caracteres (sem I/O/Q).', 'error', 4000);
      }
      return;
    }

    const renavamNorm = normalizeRenavam(renavam);
    if (renavamNorm && renavamNorm.length !== 11) {
      if (window.showToast) {
        window.showToast('Renavam inválido. Deve ter 11 dígitos.', 'error', 4000);
      }
      return;
    }

    const carData = {
      marca: marca.trim(),
      modelo: modeloFinal.trim(),
      ano: ano.trim(),
      anoModelo: anoModelo.trim(),
      placa: placa.trim().toUpperCase(),
      chassi: chassiNorm,
      cor: cor.trim(),
      motor: motor.trim(),
      motorCodigo: motorCodigo.trim(),
      cilindrada: cilindrada.trim(),
      potenciaCv: potenciaCv.trim(),
      combustivel: combustivel.trim(),
      cambio: cambio.trim(),
      versao: versao.trim(),
      km: km.toString().trim(),
      tracao: tracao.trim(),
      carroceria: carroceria.trim(),
      uf: uf.trim(),
      renavam: renavamNorm,
      observacoes: observacoes.trim()
    };

    try {
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
    } catch (err) {
      console.warn('Car save failed:', err);
      const msg = (err && err.message) ? String(err.message) : 'Falha ao salvar o carro.';
      if (window.showToast) window.showToast(msg, 'error', 4500);
    }
  };

  const handleEdit = (car) => {
    setMarca(car.marca);
    setModelo(car.modelo);
    setAno(car.ano);
    setAnoModelo(car.anoModelo || '');
    setPlaca(car.placa || '');
    setChassi(car.chassi || '');
    setCor(car.cor || '');
    setMotor(car.motor || '');
    setMotorCodigo(car.motorCodigo || '');
    setCilindrada(car.cilindrada || '');
    setPotenciaCv(car.potenciaCv || '');
    setCombustivel(car.combustivel || '');
    setCambio(car.cambio || '');
    setVersao(car.versao || '');
    setKm(car.km || '');
    setTracao(car.tracao || '');
    setCarroceria(car.carroceria || '');
    setUf(car.uf || '');
    setRenavam(car.renavam || '');
    setObservacoes(car.observacoes || '');
    setIsEditing(true);
    setEditingCarId(car.id);
    setShowForm(true);
    setShowAdvanced(Boolean(
      car.chassi || car.motor || car.versao || car.combustivel || car.cambio || car.km || car.anoModelo || car.uf || car.renavam || car.tracao || car.carroceria || car.motorCodigo || car.cilindrada || car.potenciaCv
    ));
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
                      {(() => {
                        // Always move 'Outro' to the end
                        const sorted = [...brandList].sort(comparePtBr);
                        const outros = sorted.filter(b => b.toLowerCase() === 'outro');
                        const rest = sorted.filter(b => b.toLowerCase() !== 'outro');
                        return [...rest, ...outros].map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ));
                      })()}
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
                      {(() => {
                        // Always move 'Outro' to the end
                        const sorted = [...modelosDisponiveis].sort(comparePtBr);
                        const outros = sorted.filter(m => m && m.toLowerCase() === 'outro');
                        const rest = sorted.filter(m => !m || m.toLowerCase() !== 'outro');
                        return [
                          ...rest.map(model => (
                            <option key={model} value={model}>{model}</option>
                          )),
                          <option key="Outro" value="Outro">Outro (digitar manualmente)</option>
                        ];
                      })()}
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
                    <label htmlFor="anoModelo">Ano/Modelo</label>
                    <input
                      type="text"
                      id="anoModelo"
                      value={anoModelo}
                      onChange={(e) => setAnoModelo(e.target.value)}
                      placeholder="Ex: 2021"
                      maxLength="4"
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

                <div className="search-form-advanced-row" style={{ marginTop: 8, marginBottom: 8 }}>
                  <button
                    type="button"
                    className="search-form-advanced-btn"
                    onClick={() => setShowAdvanced(v => !v)}
                    aria-expanded={showAdvanced}
                  >
                    {showAdvanced ? 'Ocultar informações avançadas' : 'Informações avançadas'}
                  </button>
                </div>

                {showAdvanced && (
                  <>
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="versao">Versão/Trim</label>
                        <input
                          type="text"
                          id="versao"
                          value={versao}
                          onChange={(e) => setVersao(e.target.value)}
                          placeholder="Ex: LTZ, Comfortline"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="carroceria">Carroceria</label>
                        <select
                          id="carroceria"
                          value={carroceria}
                          onChange={(e) => setCarroceria(e.target.value)}
                        >
                          <option value="">Selecionar</option>
                          <option value="Hatch">Hatch</option>
                          <option value="Sedã">Sedã</option>
                          <option value="SUV">SUV</option>
                          <option value="Picape">Picape</option>
                          <option value="Perua">Perua</option>
                          <option value="Minivan">Minivan</option>
                          <option value="Van">Van</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="combustivel">Combustível</label>
                        <select
                          id="combustivel"
                          value={combustivel}
                          onChange={(e) => setCombustivel(e.target.value)}
                        >
                          <option value="">Selecionar</option>
                          <option value="Flex">Flex</option>
                          <option value="Gasolina">Gasolina</option>
                          <option value="Etanol">Etanol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="GNV">GNV</option>
                          <option value="Híbrido">Híbrido</option>
                          <option value="Elétrico">Elétrico</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor="cambio">Câmbio</label>
                        <select
                          id="cambio"
                          value={cambio}
                          onChange={(e) => setCambio(e.target.value)}
                        >
                          <option value="">Selecionar</option>
                          <option value="Manual">Manual</option>
                          <option value="Automático">Automático</option>
                          <option value="CVT">CVT</option>
                          <option value="Automatizado">Automatizado</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="motor">Motor</label>
                        <input
                          type="text"
                          id="motor"
                          value={motor}
                          onChange={(e) => setMotor(e.target.value)}
                          placeholder="Ex: 2.0 Flex"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="motorCodigo">Código do motor</label>
                        <input
                          type="text"
                          id="motorCodigo"
                          value={motorCodigo}
                          onChange={(e) => setMotorCodigo(e.target.value)}
                          placeholder="Ex: EA111"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="cilindrada">Cilindrada</label>
                        <input
                          type="text"
                          id="cilindrada"
                          value={cilindrada}
                          onChange={(e) => setCilindrada(e.target.value)}
                          placeholder="Ex: 1.0, 1.6, 2.0"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="potenciaCv">Potência (cv)</label>
                        <input
                          type="text"
                          id="potenciaCv"
                          value={potenciaCv}
                          onChange={(e) => setPotenciaCv(e.target.value)}
                          placeholder="Ex: 116"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="km">Quilometragem</label>
                        <input
                          type="text"
                          id="km"
                          value={km}
                          onChange={(e) => setKm(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 85000"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="tracao">Tração</label>
                        <select
                          id="tracao"
                          value={tracao}
                          onChange={(e) => setTracao(e.target.value)}
                        >
                          <option value="">Selecionar</option>
                          <option value="4x2">4x2</option>
                          <option value="4x4">4x4</option>
                          <option value="AWD">AWD</option>
                          <option value="FWD">FWD</option>
                          <option value="RWD">RWD</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="uf">UF</label>
                        <select id="uf" value={uf} onChange={(e) => setUf(e.target.value)}>
                          <option value="">Selecionar</option>
                          {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor="renavam">Renavam</label>
                        <input
                          type="text"
                          id="renavam"
                          value={renavam}
                          onChange={(e) => setRenavam(normalizeRenavam(e.target.value))}
                          placeholder="11 dígitos"
                          maxLength="11"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="chassi">Chassi (VIN)</label>
                        <input
                          type="text"
                          id="chassi"
                          value={chassi}
                          onChange={(e) => setChassi(normalizeVin(e.target.value))}
                          placeholder="17 caracteres"
                          maxLength="17"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                      </div>
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

                    <div className="form-actions" style={{ marginTop: 0 }}>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleAutoFillByVin}
                        disabled={!chassi}
                        title="Preenche marca/modelo/ano/motor quando disponível (beta)"
                      >
                        Preencher pelo chassi (beta)
                      </button>
                    </div>
                  </>
                )}

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
                  <div key={car.id} className="car-card">
                    <div className="car-header">
                      <h4 className="car-title">{car.marca} {car.modelo}{car.versao ? ` ${car.versao}` : ''}</h4>
                      <span className="car-year">{car.ano}{car.anoModelo ? `/${car.anoModelo}` : ''}</span>
                    </div>
                    <div className="car-details">
                      {car.placa && <p className="car-info"><strong>Placa:</strong> {car.placa}</p>}
                      {car.chassi && <p className="car-info"><strong>Chassi:</strong> {car.chassi}</p>}
                      {car.combustivel && <p className="car-info"><strong>Combustível:</strong> {car.combustivel}</p>}
                      {car.cambio && <p className="car-info"><strong>Câmbio:</strong> {car.cambio}</p>}
                      {car.cor && <p className="car-info"><strong>Cor:</strong> {car.cor}</p>}
                      {car.motor && <p className="car-info"><strong>Motor:</strong> {car.motor}</p>}
                      {car.motorCodigo && <p className="car-info"><strong>Cód. motor:</strong> {car.motorCodigo}</p>}
                      {car.cilindrada && <p className="car-info"><strong>Cilindrada:</strong> {car.cilindrada}</p>}
                      {car.potenciaCv && <p className="car-info"><strong>Potência:</strong> {car.potenciaCv} cv</p>}
                      {car.km && <p className="car-info"><strong>KM:</strong> {car.km}</p>}
                      {car.tracao && <p className="car-info"><strong>Tração:</strong> {car.tracao}</p>}
                      {car.carroceria && <p className="car-info"><strong>Carroceria:</strong> {car.carroceria}</p>}
                      {car.uf && <p className="car-info"><strong>UF:</strong> {car.uf}</p>}
                      {car.renavam && <p className="car-info"><strong>Renavam:</strong> {maskSensitive(car.renavam, { keepLast: 3 })}</p>}
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
