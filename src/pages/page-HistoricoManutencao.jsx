import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Menu, MenuLogin } from '../components';
import { getCars } from '../services/carService';
import { 
  getMaintenances, 
  addMaintenance, 
  updateMaintenance, 
  deleteMaintenance 
} from '../services/maintenanceService';
import '../styles/pages/page-HistoricoManutencao.css';

export default function HistoricoManutencao() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [manutencoes, setManutencoes] = useState([]);
  const [carros, setCarros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtroVeiculo, setFiltroVeiculo] = useState('todos');
  const [carroSelecionadoHelper, setCarroSelecionadoHelper] = useState('');
  const [formData, setFormData] = useState({
    veiculoId: '',
    data: '',
    tipo: 'preventiva',
    descricao: '',
    kmAtual: '',
    oficina: '',
    valor: '',
    observacoes: ''
  });

  // Carregar carros e manutenções do sistema integrado
  useEffect(() => {
    const loadData = async () => {
      if (usuarioLogado) {
        setLoading(true);
        try {
          const userId = usuarioLogado.id || usuarioLogado.email;
          
          // Carrega carros do sistema "Meus Carros"
          const userCars = await getCars(userId);
          setCarros(userCars);
          
          // Carrega manutenções
          const userMaintenances = await getMaintenances(userId);
          setManutencoes(userMaintenances);
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [usuarioLogado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuarioLogado) return;
    const userId = usuarioLogado.id || usuarioLogado.email;
    
    try {
      if (editingId) {
        // Editar manutenção existente
        await updateMaintenance(userId, editingId, formData);
        const updated = await getMaintenances(userId);
        setManutencoes(updated);
      } else {
        // Adicionar nova manutenção
        await addMaintenance(userId, formData);
        const updated = await getMaintenances(userId);
        setManutencoes(updated);
      }
      
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error);
      alert('Erro ao salvar manutenção. Tente novamente.');
    }
  };

  const handleEdit = (manutencao) => {
    setFormData(manutencao);
    setEditingId(manutencao.id);
    setCarroSelecionadoHelper(manutencao.veiculoId);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    
    if (!usuarioLogado) return;
    const userId = usuarioLogado.id || usuarioLogado.email;
    
    try {
      await deleteMaintenance(userId, id);
      const updated = await getMaintenances(userId);
      setManutencoes(updated);
    } catch (error) {
      console.error('Erro ao deletar manutenção:', error);
      alert('Erro ao deletar manutenção. Tente novamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      veiculoId: '',
      data: '',
      tipo: 'preventiva',
      descricao: '',
      kmAtual: '',
      oficina: '',
      valor: '',
      observacoes: ''
    });
    setEditingId(null);
    setCarroSelecionadoHelper('');
  };

  const handleCarroHelperChange = (carroId) => {
    setCarroSelecionadoHelper(carroId);
    
    if (carroId) {
      // Preenche o veiculoId no formData
      setFormData({...formData, veiculoId: carroId});
    }
  };

  const getVeiculoNome = (veiculoId) => {
    const carro = carros.find(c => c.id === veiculoId);
    return carro ? `${carro.marca} ${carro.modelo} (${carro.ano})` : 'Veículo não encontrado';
  };

  const manutencoesFiltered = filtroVeiculo === 'todos' 
    ? manutencoes 
    : manutencoes.filter(m => m.veiculoId === filtroVeiculo);

  const manutencoesSorted = [...manutencoesFiltered].sort((a, b) => 
    new Date(b.data) - new Date(a.data)
  );

  if (!usuarioLogado) {
    return (
      <>
        <MenuLogin />
        <div className="page-wrapper">
          <div className="page-content historico-section">
            <h2 className="page-title">Histórico de Manutenção</h2>
            <div className="historico-login-required">
              <p>Você precisa estar logado para acessar o histórico de manutenção.</p>
              <a href="/login" className="historico-login-btn">Fazer Login</a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Menu />
      <div className="site-header-spacer"></div>
      <div className="page-wrapper menu-page">
        <div className="page-content historico-section">
          <h2 className="page-title">Histórico de Manutenção</h2>
          
          <div className="historico-intro">
            <p>
              Mantenha um registro completo de todas as manutenções, trocas de peças e serviços 
              realizados nos seus veículos. Esse histórico digital facilita o acompanhamento de 
              revisões periódicas e aumenta o valor de revenda.
            </p>
          </div>

          {loading ? (
            <div className="historico-loading">
              <p>Carregando dados...</p>
            </div>
          ) : carros.length === 0 ? (
            <div className="historico-no-cars">
              <p>Você ainda não possui veículos cadastrados.</p>
              <p>Cadastre seu primeiro veículo para começar a registrar manutenções.</p>
              <button 
                onClick={() => navigate('/meus-carros')} 
                className="historico-add-car-btn"
              >
                📝 Ir para Meus Carros
              </button>
            </div>
          ) : (
            <>
              <div className="historico-actions">
                <div className="historico-filters">
                  <label htmlFor="filtro-veiculo">Filtrar por veículo:</label>
                  <select 
                    id="filtro-veiculo"
                    value={filtroVeiculo} 
                    onChange={(e) => setFiltroVeiculo(e.target.value)}
                    className="historico-select"
                  >
                    <option value="todos">Todos os veículos</option>
                    {carros.map(carro => (
                      <option key={carro.id} value={carro.id}>
                        {carro.marca} {carro.modelo} ({carro.ano})
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  className="historico-add-btn"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  + Nova Manutenção
                </button>
              </div>

              {manutencoesSorted.length === 0 ? (
                <div className="historico-empty">
                  <p>Nenhuma manutenção registrada ainda.</p>
                  <p>Clique em "Nova Manutenção" para começar.</p>
                </div>
              ) : (
                <div className="historico-list">
                  {manutencoesSorted.map(manutencao => (
                    <div key={manutencao.id} className="historico-card">
                      <div className="historico-card-header">
                        <div className="historico-card-veiculo">
                          {getVeiculoNome(manutencao.veiculoId)}
                        </div>
                        <div className="historico-card-data">
                          {new Date(manutencao.data).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      <div className="historico-card-body">
                        <div className="historico-card-tipo">
                          <span className={`historico-tipo-badge ${manutencao.tipo}`}>
                            {manutencao.tipo === 'preventiva' ? 'Preventiva' : 
                             manutencao.tipo === 'corretiva' ? 'Corretiva' : 'Outro'}
                          </span>
                        </div>
                        
                        <div className="historico-card-descricao">
                          <strong>Descrição:</strong> {manutencao.descricao}
                        </div>
                        
                        {manutencao.kmAtual && (
                          <div className="historico-card-km">
                            <strong>Quilometragem:</strong> {parseInt(manutencao.kmAtual).toLocaleString('pt-BR')} km
                          </div>
                        )}
                        
                        {manutencao.oficina && (
                          <div className="historico-card-oficina">
                            <strong>Oficina:</strong> {manutencao.oficina}
                          </div>
                        )}
                        
                        {manutencao.valor && (
                          <div className="historico-card-valor">
                            <strong>Valor:</strong> R$ {parseFloat(manutencao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                        
                        {manutencao.observacoes && (
                          <div className="historico-card-obs">
                            <strong>Observações:</strong> {manutencao.observacoes}
                          </div>
                        )}
                      </div>
                      
                      <div className="historico-card-actions">
                        <button 
                          className="historico-edit-btn"
                          onClick={() => handleEdit(manutencao)}
                        >
                          Editar
                        </button>
                        <button 
                          className="historico-delete-btn"
                          onClick={() => handleDelete(manutencao.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {showModal && (
            <div className="historico-modal-overlay" onClick={() => setShowModal(false)}>
              <div className="historico-modal" onClick={(e) => e.stopPropagation()}>
                <div className="historico-modal-header">
                  <h3>{editingId ? 'Editar Manutenção' : 'Nova Manutenção'}</h3>
                  <button 
                    className="historico-modal-close"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="historico-form">
                  {/* Seletor de carro - facilita preenchimento */}
                  {!editingId && carros.length > 0 && (
                    <div className="historico-form-group historico-car-helper">
                      <label htmlFor="carroHelper">
                        🚗 Selecione um veículo cadastrado (facilita o preenchimento)
                      </label>
                      <select
                        id="carroHelper"
                        value={carroSelecionadoHelper}
                        onChange={(e) => handleCarroHelperChange(e.target.value)}
                        className="historico-input historico-car-selector"
                      >
                        <option value="">-- Selecione um carro cadastrado --</option>
                        {carros.map(carro => (
                          <option key={carro.id} value={carro.id}>
                            {carro.marca} {carro.modelo} ({carro.ano}){carro.isDefault ? ' ⭐' : ''}
                          </option>
                        ))}
                      </select>
                      <small className="historico-helper-text">
                        Ao selecionar um veículo, o campo "Veículo" será preenchido automaticamente
                      </small>
                    </div>
                  )}

                  <div className="historico-form-group">
                    <label htmlFor="veiculoId">Veículo *</label>
                    <select
                      id="veiculoId"
                      value={formData.veiculoId}
                      onChange={(e) => setFormData({...formData, veiculoId: e.target.value})}
                      required
                      className="historico-input"
                    >
                      <option value="">Selecione um veículo</option>
                      {carros.map(carro => (
                        <option key={carro.id} value={carro.id}>
                          {carro.marca} {carro.modelo} ({carro.ano})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="historico-form-row">
                    <div className="historico-form-group">
                      <label htmlFor="data">Data *</label>
                      <input
                        type="date"
                        id="data"
                        value={formData.data}
                        onChange={(e) => setFormData({...formData, data: e.target.value})}
                        required
                        className="historico-input"
                      />
                    </div>

                    <div className="historico-form-group">
                      <label htmlFor="tipo">Tipo *</label>
                      <select
                        id="tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        required
                        className="historico-input"
                      >
                        <option value="preventiva">Preventiva</option>
                        <option value="corretiva">Corretiva</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="historico-form-group">
                    <label htmlFor="descricao">Descrição *</label>
                    <input
                      type="text"
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      placeholder="Ex: Troca de óleo e filtro"
                      required
                      className="historico-input"
                    />
                  </div>

                  <div className="historico-form-row">
                    <div className="historico-form-group">
                      <label htmlFor="kmAtual">Quilometragem</label>
                      <input
                        type="number"
                        id="kmAtual"
                        value={formData.kmAtual}
                        onChange={(e) => setFormData({...formData, kmAtual: e.target.value})}
                        placeholder="Ex: 50000"
                        className="historico-input"
                      />
                    </div>

                    <div className="historico-form-group">
                      <label htmlFor="valor">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        id="valor"
                        value={formData.valor}
                        onChange={(e) => setFormData({...formData, valor: e.target.value})}
                        placeholder="Ex: 150.00"
                        className="historico-input"
                      />
                    </div>
                  </div>

                  <div className="historico-form-group">
                    <label htmlFor="oficina">Oficina/Local</label>
                    <input
                      type="text"
                      id="oficina"
                      value={formData.oficina}
                      onChange={(e) => setFormData({...formData, oficina: e.target.value})}
                      placeholder="Ex: Auto Center XYZ"
                      className="historico-input"
                    />
                  </div>

                  <div className="historico-form-group">
                    <label htmlFor="observacoes">Observações</label>
                    <textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      placeholder="Informações adicionais sobre a manutenção"
                      rows="3"
                      className="historico-textarea"
                    />
                  </div>

                  <div className="historico-form-actions">
                    <button 
                      type="button" 
                      className="historico-cancel-btn"
                      onClick={() => {
                        resetForm();
                        setShowModal(false);
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="historico-save-btn">
                      {editingId ? 'Salvar Alterações' : 'Adicionar Manutenção'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
