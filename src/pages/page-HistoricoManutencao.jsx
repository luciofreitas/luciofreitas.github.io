import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Menu, MenuLogin } from '../components';
import { getCars } from '../services/carService';
import { 
  getMaintenances, 
  addMaintenance, 
  updateMaintenance, 
  deleteMaintenance 
} from '../services/maintenanceService';
import { comparePtBr, sortByLabelPtBr } from '../utils/sortUtils';
import '../styles/pages/page-HistoricoManutencao.css';

export default function HistoricoManutencao() {
  const { usuarioLogado } = useContext(AuthContext) || {};

  const isProfessional = useMemo(() => {
    try {
      const role = String(usuarioLogado?.role || '').toLowerCase();
      const t = String(usuarioLogado?.accountType || usuarioLogado?.account_type || '').toLowerCase();
      return role === 'professional' || role === 'profissional' || t === 'professional' || t === 'profissional' || !!usuarioLogado?.professional;
    } catch (e) {
      return false;
    }
  }, [usuarioLogado]);
  
  // Debug: verificar estado do usuário
  useEffect(() => {
    console.log('[HistoricoManutencao] usuarioLogado:', usuarioLogado);
  }, [usuarioLogado]);
  
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
    codigoProduto: '',
    kmAtual: '',
    oficina: '',
    valor: '',
    observacoes: ''
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [prefillCodigo, setPrefillCodigo] = useState('');

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

    // read prefill codigo from sessionStorage (if any) but do not auto-open modal
    try {
      const pref = sessionStorage.getItem('pf_prefill_codigo');
      if (pref) setPrefillCodigo(pref);
    } catch (e) { /* ignore */ }
  }, [usuarioLogado]);

  // If navigation sent an openMaintenanceId via state, open the modal after maintenances load
  useEffect(() => {
    try {
      const openId = location && location.state && location.state.openMaintenanceId;
      const prefillDescricao = (location && location.state && location.state.prefillDescricao) || (() => {
        try { return sessionStorage.getItem('pf_prefill_descricao'); } catch (e) { return null; }
      })();
      if (openId && manutencoes && manutencoes.length > 0) {
        const target = manutencoes.find(m => String(m.id) === String(openId));
        if (target) {
          // If a prefillDescricao was passed and the saved maintenance has an empty
          // descricao, prefer the prefill (ensures the catalog choice appears).
          const targetToEdit = prefillDescricao && (!target.descricao || String(target.descricao).trim() === '')
            ? { ...target, descricao: prefillDescricao }
            : target;

          // open edit modal for the newly created/imported maintenance
          handleEdit(targetToEdit);
          // Clear the state in history so refresh doesn't reopen the modal
          try { navigate(location.pathname + (window.location.hash || ''), { replace: true }); } catch (e) { /* ignore */ }
        }
      } else if (prefillDescricao) {
        // If the navigation asked to prefill a description (saved from catalog),
        // open the 'new maintenance' modal with the description prefilled.
        resetForm();
        setFormData(prev => ({ ...prev, descricao: prefillDescricao }));
        setShowModal(true);
        try { navigate(location.pathname + (window.location.hash || ''), { replace: true }); } catch (e) { /* ignore */ }
        try { sessionStorage.removeItem('pf_prefill_descricao'); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  }, [location, manutencoes]);

  // Listen to programmatic open events (dispatched when we navigate while already
  // on the history page) so the modal opens without creating duplicate hash entries.
  useEffect(() => {
    const handler = (e) => {
      try {
        const detail = e && e.detail ? e.detail : null;
        const openId = detail && detail.openMaintenanceId;
        const prefill = detail && detail.prefillDescricao;
        if (openId && manutencoes && manutencoes.length > 0) {
          const target = manutencoes.find(m => String(m.id) === String(openId));
          if (target) {
            const targetToEdit = prefill && (!target.descricao || String(target.descricao).trim() === '')
              ? { ...target, descricao: prefill }
              : target;
            handleEdit(targetToEdit);
            // clear session fallback
            try { sessionStorage.removeItem('pf_prefill_descricao'); } catch (err) {}
            return;
          }
        }

        if (prefill) {
          resetForm();
          setFormData(prev => ({ ...prev, descricao: prefill }));
          setShowModal(true);
          try { sessionStorage.removeItem('pf_prefill_descricao'); } catch (err) {}
        }
      } catch (err) { /* ignore */ }
    };

    window.addEventListener('pf_open_maintenance', handler);
    return () => window.removeEventListener('pf_open_maintenance', handler);
  }, [manutencoes]);

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
    // Ensure the date is in yyyy-mm-dd format for <input type="date" />
    const rawDate = manutencao && (manutencao.data || manutencao.createdAt || new Date().toISOString());
    let dateForInput = '';
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateForInput = `${yyyy}-${mm}-${dd}`;
      }
    }

    setFormData({ ...manutencao, data: dateForInput });
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
      codigoProduto: '',
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
    // Compare IDs as strings to be tolerant to number/string mismatches
    const carro = carros.find(c => String(c.id) === String(veiculoId));
    return carro ? `${carro.marca} ${carro.modelo} (${carro.ano})` : 'Veículo não encontrado';
  };

  const formatManutencaoDate = (manutencao) => {
    // Prefer explicit data field, then createdAt, then fallback to now
    const raw = manutencao && (manutencao.data || manutencao.createdAt || manutencao.createdAt) || '';
    const d = raw ? new Date(raw) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('pt-BR');
    return d.toLocaleDateString('pt-BR');
  };

  const manutencoesFiltered = filtroVeiculo === 'todos' 
    ? manutencoes 
    : manutencoes.filter(m => m.veiculoId === filtroVeiculo);

  const manutencoesSorted = [...manutencoesFiltered].sort((a, b) => 
    new Date(b.data) - new Date(a.data)
  );

  const handlePrintComprovante = () => {
    try {
      const escapeHtml = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      const now = new Date();
      const issuedAt = now.toLocaleString('pt-BR');
      const companyName = usuarioLogado?.professional?.company_name || usuarioLogado?.company_name || '';
      const matricula = usuarioLogado?.professional?.matricula || usuarioLogado?.matricula || '';
      const userLabel = usuarioLogado?.nome || usuarioLogado?.name || usuarioLogado?.email || 'Usuário';

      const userIdForDoc = String(usuarioLogado?.id || usuarioLogado?.email || 'user');
      const userIdShort = userIdForDoc.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'USER';
      const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const docNumber = `GS-HM-${userIdShort.toUpperCase()}-${dateStamp}-${String(now.getTime()).slice(-5)}`;

      const parseMoney = (raw) => {
        const s = String(raw ?? '').trim();
        if (!s) return 0;
        // Accept formats like "1234.56", "1.234,56", "1234,56"
        const normalized = s
          .replace(/\s/g, '')
          .replace(/R\$/gi, '')
          .replace(/\./g, '')
          .replace(/,/g, '.');
        const n = Number(normalized);
        return Number.isFinite(n) ? n : 0;
      };

      const getRawDateForSort = (m) => (m && (m.data || m.createdAt || m.created_at)) || null;
      const dates = (manutencoesSorted || [])
        .map(getRawDateForSort)
        .map((d) => (d ? new Date(d) : null))
        .filter((d) => d && !isNaN(d.getTime()));
      const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
      const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
      const periodLabel = (minDate && maxDate)
        ? `${minDate.toLocaleDateString('pt-BR')} a ${maxDate.toLocaleDateString('pt-BR')}`
        : '—';

      const totalValue = (manutencoesSorted || []).reduce((sum, m) => sum + parseMoney(m?.valor), 0);
      const totalValueLabel = totalValue > 0
        ? `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : '—';

      const filterLabel = (String(filtroVeiculo) === 'todos')
        ? 'Todos os veículos'
        : getVeiculoNome(filtroVeiculo);

      const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
      const logoUrl = (() => {
        try {
          // Prefer the blue logo if available; fallback to the default logo
          return new URL(`${String(baseUrl || '/').replace(/^\//, '')}images/logo-azul.png`, window.location.origin + (String(baseUrl || '/').startsWith('/') ? '' : '/')).toString();
        } catch (e) {
          try { return new URL('images/logo-azul.png', window.location.href).toString(); } catch (err) { return ''; }
        }
      })();

      const rowsHtml = (manutencoesSorted || []).map((m) => {
        const tipo = m?.tipo === 'preventiva' ? 'Preventiva' : (m?.tipo === 'corretiva' ? 'Corretiva' : 'Outro');
        const valor = (m?.valor != null && String(m.valor).trim() !== '')
          ? `R$ ${Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '';
        const km = (m?.kmAtual != null && String(m.kmAtual).trim() !== '')
          ? `${parseInt(m.kmAtual, 10).toLocaleString('pt-BR')} km`
          : '';

        return `
          <tr>
            <td>${escapeHtml(formatManutencaoDate(m))}</td>
            <td>${escapeHtml(getVeiculoNome(m?.veiculoId))}</td>
            <td>${escapeHtml(tipo)}</td>
            <td>${escapeHtml(m?.descricao || '')}</td>
            <td>${escapeHtml(km)}</td>
            <td>${escapeHtml(m?.oficina || '')}</td>
            <td style="text-align:right">${escapeHtml(valor)}</td>
          </tr>
        `;
      }).join('');

      const emptyHtml = `
        <div style="margin-top:12px; padding:12px; border:1px solid #e5e7eb; border-radius:10px; background:#fafafa;">
          Nenhuma manutenção registrada para o filtro selecionado.
        </div>
      `;

      const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Comprovante - Histórico de Manutenção</title>
    <style>
      @page { size: A4; margin: 12mm; }
      html, body { height: 100%; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; }
      .wrap { padding: 12mm; }
      .topbar { display:flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
      .brand { display:flex; align-items: center; gap: 10px; }
      .brand img { width: 40px; height: 40px; object-fit: contain; }
      .brand .name { font-weight: 800; letter-spacing: 0.2px; }
      .brand .sub { color:#6b7280; font-size: 12px; margin-top: 2px; }
      .docbox { text-align: right; font-size: 12px; color:#374151; }
      .docbox .docno { font-weight: 800; color:#111827; }
      h1 { font-size: 16px; margin: 14px 0 0 0; }
      .rule { height: 1px; background: #e5e7eb; margin: 10px 0 12px 0; }
      .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; }
      .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; font-size: 12.5px; }
      .k { color:#6b7280; }
      .badge { display:inline-block; padding: 2px 8px; border-radius: 999px; background:#f3f4f6; color:#111827; font-size: 11px; }
      .summary { margin-top: 10px; display:flex; gap: 10px; flex-wrap: wrap; }
      .summary .item { flex: 1 1 180px; }
      table { width:100%; border-collapse: collapse; margin-top: 12px; font-size: 11.5px; }
      thead th { text-align:left; font-size: 11px; color:#374151; background:#f9fafb; border-bottom: 1px solid #e5e7eb; padding: 8px 6px; }
      tbody td { border-bottom: 1px solid #eef2f7; padding: 7px 6px; vertical-align: top; }
      tbody tr:nth-child(even) td { background: #fcfcfd; }
      .signatures { margin-top: 16px; display:grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .sig { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; }
      .sig .line { margin-top: 28px; border-top: 1px solid #9ca3af; }
      .sig .label { margin-top: 6px; font-size: 11.5px; color:#374151; }
      .footer { margin-top: 14px; font-size: 10.5px; color:#6b7280; line-height: 1.4; }
      .no-print { display:flex; gap: 8px; justify-content: flex-end; }
      .btn { padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; background:#fff; cursor:pointer; font-size: 12px; }
      .btn.primary { background:#111827; color:#fff; border-color:#111827; }
      @media print {
        .no-print { display:none !important; }
        .wrap { padding: 0; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="topbar">
        <div class="brand">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" />` : ''}
          <div>
            <div class="name">Garagem Smart</div>
            <div class="sub">Comprovante do histórico de manutenção</div>
          </div>
        </div>
        <div class="docbox">
          <div class="docno">Documento Nº ${escapeHtml(docNumber)}</div>
          <div>Emitido em: ${escapeHtml(issuedAt)}</div>
          <div class="no-print" style="margin-top: 8px;">
            <button class="btn" onclick="window.close()">Fechar</button>
            <button class="btn primary" onclick="window.print()">Imprimir</button>
          </div>
        </div>
      </div>

      <h1>Comprovante</h1>
      <div class="rule"></div>

      <div class="box">
        <div class="grid">
          <div><span class="k">Cliente:</span> ${escapeHtml(userLabel)}</div>
          <div><span class="k">Filtro:</span> <span class="badge">${escapeHtml(filterLabel)}</span></div>
          <div><span class="k">Empresa/Oficina:</span> ${escapeHtml(companyName || '—')}</div>
          <div><span class="k">Matrícula:</span> ${escapeHtml(matricula || '—')}</div>
        </div>

        <div class="summary">
          <div class="item"><span class="k">Período:</span> ${escapeHtml(periodLabel)}</div>
          <div class="item"><span class="k">Registros:</span> ${escapeHtml((manutencoesSorted || []).length)}</div>
          <div class="item"><span class="k">Total (informado):</span> ${escapeHtml(totalValueLabel)}</div>
        </div>
      </div>

      ${rowsHtml ? `
        <table>
          <thead>
            <tr>
              <th style="width:78px">Data</th>
              <th style="width:170px">Veículo</th>
              <th style="width:80px">Tipo</th>
              <th>Descrição</th>
              <th style="width:84px">KM</th>
              <th style="width:130px">Oficina</th>
              <th style="width:84px; text-align:right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      ` : emptyHtml}

      <div class="signatures">
        <div class="sig">
          <div><strong>Responsável</strong></div>
          <div class="line"></div>
          <div class="label">Assinatura / Carimbo</div>
        </div>
        <div class="sig">
          <div><strong>Cliente</strong></div>
          <div class="line"></div>
          <div class="label">Assinatura</div>
        </div>
      </div>

      <div class="footer">
        Documento gerado pelo Garagem Smart. As informações deste comprovante refletem os registros cadastrados no histórico de manutenção na data de emissão.
        Recomenda-se anexar notas fiscais e ordens de serviço quando aplicável.
      </div>

      <script>
        window.onload = function(){
          try { window.focus(); } catch(e) {}
          try { window.print(); } catch(e) {}
        };
      </script>
    </div>
  </body>
</html>`;

      const w = window.open('', '_blank', 'noopener,noreferrer,width=980,height=720');
      if (!w) {
        alert('Não foi possível abrir a janela de impressão. Verifique se o navegador bloqueou pop-ups.');
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      console.error('Erro ao gerar comprovante para impressão:', e);
      alert('Erro ao gerar o comprovante.');
    }
  };

  if (!usuarioLogado) {
    return (
      <>
        <MenuLogin />
        <div className="page-wrapper">
          <div className="page-content historico-section">
            <h2 className="page-title">Histórico de Manutenção</h2>
            <div className="historico-login-required">
              <p>Você precisa estar logado para acessar o histórico de manutenção.</p>
              <a href="/#/login" className="historico-login-btn">Fazer Login</a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Menu />
  <div className="page-wrapper menu-page historico-page">
        <div className="page-content historico-section">
          <h2 className="page-title">Histórico de Manutenção</h2>
          
          <p className="page-subtitle">
            Mantenha um registro completo de todas as manutenções, trocas de peças e serviços 
            realizados nos seus veículos. Esse histórico digital facilita o acompanhamento de 
            revisões periódicas e aumenta o valor de revenda.
          </p>

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
                    {sortByLabelPtBr(carros, (c) => `${c?.marca ?? ''} ${c?.modelo ?? ''} ${c?.ano ?? ''}`).map(carro => (
                      <option key={carro.id} value={carro.id}>
                        {carro.marca} {carro.modelo} ({carro.ano})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="historico-actions-right">
                  {isProfessional && (
                    <button
                      type="button"
                      className="historico-print-btn"
                      onClick={handlePrintComprovante}
                      title="Imprimir um comprovante do histórico de manutenção (somente conta profissional)"
                    >
                      🖨️ Imprimir comprovante
                    </button>
                  )}

                  <button 
                      className="historico-add-btn"
                      onClick={() => {
                        // Open new maintenance modal. If there is a prefetched product code
                        // (from catalog save), prefill it into the form, then clear sessionStorage.
                        resetForm();
                        try {
                          const pref = sessionStorage.getItem('pf_prefill_codigo');
                          if (pref) {
                            setFormData(prev => ({ ...prev, codigoProduto: pref }));
                            try { sessionStorage.removeItem('pf_prefill_codigo'); } catch (err) {}
                          }
                        } catch (e) { /* ignore */ }
                        setShowModal(true);
                      }}
                  >
                    + Nova Manutenção
                  </button>
                </div>
              </div>

              {isProfessional && (!usuarioLogado?.professional?.company_name || !usuarioLogado?.professional?.matricula) && (
                <div className="historico-professional-hint">
                  <strong>Dica:</strong> para o comprovante sair com <em>Empresa</em> e <em>Matrícula</em>, conclua seus dados em{' '}
                  <button type="button" className="historico-professional-link" onClick={() => navigate('/profissional/onboarding')}>
                    Dados Profissionais
                  </button>.
                </div>
              )}

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
                          {formatManutencaoDate(manutencao)}
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
                        {sortByLabelPtBr(carros, (c) => `${c?.marca ?? ''} ${c?.modelo ?? ''} ${c?.ano ?? ''}`).map(carro => (
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
                    <div className="historico-vehicle-year-row">
                      <div className="historico-vehicle-col">
                        <label className="historico-vehicle-label" htmlFor="veiculoId">Veículo *</label>
                        <select
                          id="veiculoId"
                          value={formData.veiculoId}
                          onChange={(e) => setFormData({...formData, veiculoId: e.target.value})}
                          required
                          className="historico-input historico-vehicle-select"
                        >
                          <option value="">Selecione um veículo</option>
                          {sortByLabelPtBr(carros, (c) => `${c?.marca ?? ''} ${c?.modelo ?? ''}`).map(carro => (
                            <option key={carro.id} value={carro.id}>
                              {carro.marca} {carro.modelo}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="historico-year-col">
                        <label htmlFor="veiculoAno" className="historico-vehicle-year-label">Ano do Veículo</label>
                        <input
                          id="veiculoAno"
                          type="text"
                          readOnly
                          className="historico-input historico-vehicle-year"
                          value={(carros.find(c => String(c.id) === String(formData.veiculoId)) || {}).ano || ''}
                          aria-label="Ano do veículo selecionado"
                          placeholder="Ano"
                        />
                      </div>
                    </div>
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
                        {(() => {
                          // Always move 'Outro' to the end
                          const opts = [
                            { value: 'corretiva', label: 'Corretiva' },
                            { value: 'outro', label: 'Outro' },
                            { value: 'preventiva', label: 'Preventiva' }
                          ];
                          const sorted = opts.sort((a, b) => comparePtBr(a.label, b.label));
                          const outros = sorted.filter(opt => (opt.value || '').toLowerCase() === 'outro' || (opt.label || '').toLowerCase() === 'outro');
                          const rest = sorted.filter(opt => (opt.value || '').toLowerCase() !== 'outro' && (opt.label || '').toLowerCase() !== 'outro');
                          return [...rest, ...outros].map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  <div className="historico-form-row">
                    <div className="historico-form-group">
                      <label htmlFor="descricao">Descrição *</label>
                      <input
                        type="text"
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                        placeholder="Ex: Troca de óleo e filtro"
                        required
                        className="historico-input historico-descricao-input"
                      />
                    </div>

                    <div className="historico-form-group">
                      <label htmlFor="codigoProduto">Codigo do produto</label>
                      <input
                        type="text"
                        id="codigoProduto"
                        value={formData.codigoProduto}
                        onChange={(e) => setFormData({...formData, codigoProduto: e.target.value})}
                        placeholder="Ex: 12345"
                        className="historico-input codigo-produto-input"
                      />
                    </div>
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
