import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Menu, MenuLogin, CustomDropdown } from '../components';
import { getCars } from '../services/carService';
import { 
  getMaintenances, 
  addMaintenance, 
  updateMaintenance, 
  deleteMaintenance,
  getOfficeMaintenances
} from '../services/maintenanceService';
import { comparePtBr, sortByLabelPtBr } from '../utils/sortUtils';
import apiService from '../utils/apiService';
import '../styles/pages/page-HistoricoManutencao.css';

export default function HistoricoManutencao() {
  const { usuarioLogado } = useContext(AuthContext) || {};

  const isProfessional = useMemo(() => {
    try {
      const role = String(usuarioLogado?.role || '').toLowerCase().trim();
      // IMPORTANT: Do not treat a user as professional just because `usuarioLogado.professional`
      // is a truthy object; some flows may leave it as `{}` in storage.
      if (role === 'companies_admin' || role === 'admin') return false;

      // Prefer role when available.
      if (role === 'professional' || role === 'profissional') return true;

      // Fallback: older sessions (or partial logins) may not have `role` populated yet,
      // but do have `accountType`/`account_type`. Backend endpoints still enforce role,
      // so this only affects UI visibility.
      const acct = String(usuarioLogado?.accountType || usuarioLogado?.account_type || '').toLowerCase().trim();
      return acct === 'professional' || acct === 'profissional';
    } catch (e) {
      return false;
    }
  }, [usuarioLogado]);
  
  // Debug: verificar estado do usuário
  useEffect(() => {
    console.log('[HistoricoManutencao] usuarioLogado:', usuarioLogado);
  }, [usuarioLogado]);

  const apiBase = useMemo(() => {
    try {
      return window.__API_BASE ? String(window.__API_BASE) : '';
    } catch (e) {
      return '';
    }
  }, []);

  const [viewMode, setViewMode] = useState('mine'); // 'mine' | 'office'
  const [officeMaintenances, setOfficeMaintenances] = useState([]);
  const [officeLoading, setOfficeLoading] = useState(false);
  const [officeError, setOfficeError] = useState('');
  const [officeClientFilter, setOfficeClientFilter] = useState('all');

  const officeErrorLabel = useMemo(() => {
    const s = String(officeError || '').trim();
    if (!s) return '';
    const low = s.toLowerCase();
    if (low === 'not authenticated' || low.includes('not authenticated') || low.includes('não autentic')) {
      return 'Sessão expirada para o histórico da oficina. Faça login novamente.';
    }
    if (low.includes('token') && low.includes('missing')) {
      return 'Sessão não autenticada. Faça login novamente para ver o histórico da oficina.';
    }
    return s;
  }, [officeError]);

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState('');
  
  const [manutencoes, setManutencoes] = useState([]);
  const [carros, setCarros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsMaintenance, setDetailsMaintenance] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filtroVeiculo, setFiltroVeiculo] = useState('todos');
  const [carroSelecionadoHelper, setCarroSelecionadoHelper] = useState('');
  const [pecasMeta, setPecasMeta] = useState(null);
  const [pecasMetaLoading, setPecasMetaLoading] = useState(false);
  const [pecasMetaError, setPecasMetaError] = useState('');
  const [formData, setFormData] = useState({
    veiculoId: '',
    veiculoMarca: '',
    veiculoModelo: '',
    veiculoAno: '',
    data: '',
    tipo: 'preventiva',
    descricao: '',
    codigoProduto: '',
    kmAtual: '',
    company_id: '',
    oficina: '',
    valor: '',
    observacoes: ''
  });

  const normalizeCompanyLabel = (value) => String(value || '').trim();
  const getCompanyDisplayName = (c) => normalizeCompanyLabel(c?.trade_name || c?.legal_name || c?.company_code || '');

  const oficinaOptions = useMemo(() => {
    const list = Array.isArray(companies) ? companies : [];
    const unique = new Map();
    for (const c of list) {
      const label = getCompanyDisplayName(c);
      if (!label) continue;
      unique.set(label, true);
    }
    return [{ value: '', label: '' }, ...Array.from(unique.keys()).sort(comparePtBr).map(v => ({ value: v, label: v }))];
  }, [companies]);
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

  useEffect(() => {
    if (!isProfessional) return;
    if (String(viewMode) !== 'office') return;

    let cancelled = false;
    (async () => {
      setOfficeError('');
      setOfficeLoading(true);
      try {
        const list = await getOfficeMaintenances();
        if (!cancelled) {
          setOfficeMaintenances(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (!cancelled) setOfficeError(e && e.message ? String(e.message) : 'Erro ao carregar histórico da oficina.');
      } finally {
        if (!cancelled) setOfficeLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isProfessional, viewMode]);

  useEffect(() => {
    if (!apiBase) return;
    let cancelled = false;
    (async () => {
      setCompaniesError('');
      setCompaniesLoading(true);
      try {
        const resp = await fetch(`${apiBase}/api/companies`);
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok || !body || body.error) {
          const msg = body && body.error ? String(body.error) : 'Não foi possível carregar empresas.';
          if (!cancelled) setCompaniesError(msg);
          return;
        }
        const list = Array.isArray(body.companies) ? body.companies : [];
        if (!cancelled) setCompanies(list);
      } catch (e) {
        if (!cancelled) setCompaniesError(e && e.message ? String(e.message) : 'Erro ao carregar empresas.');
      } finally {
        if (!cancelled) setCompaniesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiBase]);

  // Carregar metadados de veículos (mesmo universo do Buscar Peças) quando o modal abrir
  useEffect(() => {
    if (!showModal) return;
    if (pecasMeta || pecasMetaLoading) return;

    let cancelled = false;
    (async () => {
      setPecasMetaError('');
      setPecasMetaLoading(true);
      try {
        const meta = await apiService.getPecasMeta();
        if (!cancelled) setPecasMeta(meta || null);
      } catch (e) {
        if (!cancelled) setPecasMetaError(e && e.message ? String(e.message) : 'Não foi possível carregar veículos possíveis.');
      } finally {
        if (!cancelled) setPecasMetaLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [showModal, pecasMeta, pecasMetaLoading]);

  const marcaSuggestions = useMemo(() => {
    const marcas = Array.isArray(pecasMeta?.marcas) ? pecasMeta.marcas : [];
    const current = String(formData?.veiculoMarca || '').trim();
    const extra = current && !marcas.some(m => String(m).toLowerCase() === current.toLowerCase()) ? [current] : [];
    return Array.from(new Set([...(marcas || []), ...(extra || [])]))
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .sort(comparePtBr);
  }, [pecasMeta, formData?.veiculoMarca]);

  const modeloSuggestions = useMemo(() => {
    const marca = String(formData?.veiculoMarca || '').trim();
    const rel = pecasMeta && pecasMeta.relationships && pecasMeta.relationships.modelsByBrand
      ? pecasMeta.relationships.modelsByBrand
      : {};

    const tryGetByKey = (obj, key) => {
      if (!obj || !key) return null;
      if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
      const kLower = String(key).toLowerCase();
      const foundKey = Object.keys(obj).find(k => String(k).toLowerCase() === kLower);
      return foundKey ? obj[foundKey] : null;
    };

    const list = marca ? (tryGetByKey(rel, marca) || []) : [];
    const current = String(formData?.veiculoModelo || '').trim();
    const extra = current && !list.some(m => String(m).toLowerCase() === current.toLowerCase()) ? [current] : [];

    return Array.from(new Set([...(Array.isArray(list) ? list : []), ...(extra || [])]))
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .sort(comparePtBr);
  }, [pecasMeta, formData?.veiculoMarca, formData?.veiculoModelo]);

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

    // CustomDropdown doesn't support native `required` validation.
    const hasCarId = formData.veiculoId && String(formData.veiculoId).trim();
    const hasMarca = formData.veiculoMarca && String(formData.veiculoMarca).trim();
    const hasModelo = formData.veiculoModelo && String(formData.veiculoModelo).trim();
    if (!hasCarId && !(hasMarca && hasModelo)) {
      alert('Informe Marca e Modelo (ou selecione um veículo cadastrado).');
      return;
    }

    const userId = usuarioLogado.id || usuarioLogado.email;

    const veiculoLabelSnapshot = (() => {
      try {
        const carro = carros.find(c => String(c.id) === String(formData.veiculoId));
        if (carro) return `${carro.marca} ${carro.modelo} (${carro.ano})`;
      } catch (err) { /* ignore */ }

      const marca = formData && formData.veiculoMarca ? String(formData.veiculoMarca).trim() : '';
      const modelo = formData && formData.veiculoModelo ? String(formData.veiculoModelo).trim() : '';
      const base = [marca, modelo].filter(Boolean).join(' ').trim();
      const ano = formData && formData.veiculoAno ? String(formData.veiculoAno).trim() : '';
      if (!base) return '';
      if (!ano) return base;
      if (/\((19|20)\d{2}\)\s*$/.test(base)) return base;
      return `${base} (${ano})`;
    })();

    const payload = { ...formData, veiculoLabel: veiculoLabelSnapshot };
    
    try {
      if (editingId) {
        // Editar manutenção existente
        await updateMaintenance(userId, editingId, payload);
        const updated = await getMaintenances(userId);
        setManutencoes(updated);
      } else {
        // Adicionar nova manutenção
        await addMaintenance(userId, payload);
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

    const veiculoId = manutencao && (manutencao.veiculoId || manutencao.car_id || manutencao.carId) ? String(manutencao.veiculoId || manutencao.car_id || manutencao.carId) : '';
    const veiculoLabel = manutencao && (manutencao.veiculoLabel || manutencao.vehicle_label) ? String(manutencao.veiculoLabel || manutencao.vehicle_label) : '';
    let veiculoAno = '';
    let veiculoMarca = '';
    let veiculoModelo = '';
    try {
      if (veiculoId) {
        const carro = carros.find(c => String(c.id) === String(veiculoId));
        if (carro) {
          if (carro.ano != null) veiculoAno = String(carro.ano);
          if (carro.marca) veiculoMarca = String(carro.marca);
          if (carro.modelo) veiculoModelo = String(carro.modelo);
        }
      }
    } catch (e) { /* ignore */ }

    // If not linked to a registered car, best-effort parse from saved label.
    if (!veiculoId && veiculoLabel) {
      try {
        const raw = String(veiculoLabel).trim();
        let labelNoYear = raw;
        const mYear = raw.match(/\((19|20)\d{2}\)\s*$/);
        if (mYear && mYear[0]) {
          const y = mYear[0].match(/(19|20)\d{2}/);
          if (y && y[0] && !veiculoAno) veiculoAno = y[0];
          labelNoYear = raw.replace(/\((19|20)\d{2}\)\s*$/, '').trim();
        }

        const marcas = Array.isArray(pecasMeta?.marcas) ? pecasMeta.marcas : [];
        const lower = labelNoYear.toLowerCase();
        let best = '';
        for (const mk of marcas) {
          const candidate = String(mk || '').trim();
          if (!candidate) continue;
          const candLower = candidate.toLowerCase();
          if (lower === candLower || lower.startsWith(candLower + ' ')) {
            if (candidate.length > best.length) best = candidate;
          }
        }

        if (best) {
          veiculoMarca = veiculoMarca || best;
          veiculoModelo = veiculoModelo || labelNoYear.slice(best.length).trim();
        } else {
          // Fallback: first token as brand
          const parts = labelNoYear.split(/\s+/).filter(Boolean);
          if (parts.length >= 2) {
            veiculoMarca = veiculoMarca || parts[0];
            veiculoModelo = veiculoModelo || parts.slice(1).join(' ');
          } else {
            veiculoModelo = veiculoModelo || labelNoYear;
          }
        }
      } catch (e) { /* ignore */ }
    }

    setFormData({ ...manutencao, veiculoId, veiculoMarca, veiculoModelo, veiculoAno, data: dateForInput });
    setEditingId(manutencao.id);
    setCarroSelecionadoHelper(veiculoId || '');
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
      veiculoMarca: '',
      veiculoModelo: '',
      veiculoAno: '',
      data: '',
      tipo: 'preventiva',
      descricao: '',
      codigoProduto: '',
      kmAtual: '',
      company_id: '',
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
      const carro = carros.find(c => String(c.id) === String(carroId));
      const marca = carro && carro.marca != null ? String(carro.marca) : '';
      const modelo = carro && carro.modelo != null ? String(carro.modelo) : '';
      const ano = carro && carro.ano != null ? String(carro.ano) : '';

      // Preenche os campos com base no veículo cadastrado
      setFormData(prev => ({
        ...prev,
        veiculoId: carroId,
        veiculoMarca: marca || prev.veiculoMarca,
        veiculoModelo: modelo || prev.veiculoModelo,
        veiculoAno: ano || prev.veiculoAno,
      }));
    } else {
      // Remove vínculo com veículo cadastrado (mantém label digitado)
      setFormData(prev => ({ ...prev, veiculoId: '' }));
    }
  };

  const getVeiculoNome = (veiculoId) => {
    // Compare IDs as strings to be tolerant to number/string mismatches
    const carro = carros.find(c => String(c.id) === String(veiculoId));
    return carro ? `${carro.marca} ${carro.modelo} (${carro.ano})` : 'Veículo não encontrado';
  };

  const getMaintenanceVehicleLabel = (m) => {
    try {
      const id = m?.veiculoId || m?.car_id || m?.carId;
      if (id != null && String(id).trim() !== '') {
        const byCars = getVeiculoNome(id);
        if (byCars && byCars !== 'Veículo não encontrado') return byCars;
      }
    } catch (e) { /* ignore */ }

    const snap = m?.veiculoLabel || m?.vehicle_label;
    return snap ? String(snap) : '—';
  };

  const formatManutencaoDate = (manutencao) => {
    // Prefer explicit data field, then createdAt, then fallback to now
    const raw = manutencao && (manutencao.data || manutencao.createdAt || manutencao.created_at) || '';
    const d = raw ? new Date(raw) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('pt-BR');
    return d.toLocaleDateString('pt-BR');
  };

  const openDetails = (m) => {
    setDetailsMaintenance(m || null);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setDetailsMaintenance(null);
  };

  const manutencoesFiltered = filtroVeiculo === 'todos' 
    ? manutencoes 
    : manutencoes.filter(m => m.veiculoId === filtroVeiculo);

  const manutencoesSorted = [...manutencoesFiltered].sort((a, b) => {
    const da = a?.data || a?.createdAt || a?.created_at || 0;
    const db = b?.data || b?.createdAt || b?.created_at || 0;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  const officeClients = useMemo(() => {
    const map = new Map();
    (Array.isArray(officeMaintenances) ? officeMaintenances : []).forEach((m) => {
      const email = String(m?.user_email || '').trim();
      if (!email) return;
      const name = String(m?.user_name || '').trim();
      const label = name ? `${name} (${email})` : email;
      if (!map.has(email)) map.set(email, label);
    });
    return Array.from(map.entries())
      .map(([email, label]) => ({ email, label }))
      .sort((a, b) => comparePtBr(a.label, b.label));
  }, [officeMaintenances]);

  const officeMaintenancesFilteredSorted = useMemo(() => {
    const list = Array.isArray(officeMaintenances) ? officeMaintenances : [];
    const filtered = (String(officeClientFilter) === 'all')
      ? list
      : list.filter(m => String(m?.user_email || '') === String(officeClientFilter));
    return [...filtered].sort((a, b) => {
      const da = a?.data || a?.createdAt || a?.created_at || 0;
      const db = b?.data || b?.createdAt || b?.created_at || 0;
      return new Date(db).getTime() - new Date(da).getTime();
    });
  }, [officeMaintenances, officeClientFilter]);

  const selectedOfficeClientLabel = useMemo(() => {
    if (String(officeClientFilter) === 'all') return 'Clientes da oficina';
    const found = officeClients.find(c => String(c.email) === String(officeClientFilter));
    return found ? found.label : String(officeClientFilter);
  }, [officeClientFilter, officeClients]);

  const handlePrintComprovante = (opts = {}) => {
    try {
      const list = Array.isArray(opts.maintenances) ? opts.maintenances : manutencoesSorted;
      const isDetailedSingle = !!(opts && opts.detailed) && Array.isArray(list) && list.length === 1;

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
      const userLabel = (opts && opts.userLabelOverride)
        ? String(opts.userLabelOverride)
        : (usuarioLogado?.nome || usuarioLogado?.name || usuarioLogado?.email || 'Usuário');

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

      const formatMoneyLabel = (raw) => {
        const n = parseMoney(raw);
        if (!n) return '';
        return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      };

      const getRawDateForSort = (m) => (m && (m.data || m.createdAt || m.created_at)) || null;
      const dates = (list || [])
        .map(getRawDateForSort)
        .map((d) => (d ? new Date(d) : null))
        .filter((d) => d && !isNaN(d.getTime()));
      const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
      const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
      const periodLabel = (minDate && maxDate)
        ? `${minDate.toLocaleDateString('pt-BR')} a ${maxDate.toLocaleDateString('pt-BR')}`
        : '—';

      const totalValue = (list || []).reduce((sum, m) => sum + parseMoney(m?.valor), 0);
      const totalValueLabel = totalValue > 0
        ? `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : '—';

      const filterLabel = (opts && opts.filterLabelOverride)
        ? String(opts.filterLabelOverride)
        : ((String(filtroVeiculo) === 'todos')
          ? 'Todos os veículos'
          : getVeiculoNome(filtroVeiculo));

      const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
      const logoUrl = (() => {
        try {
          // Prefer the blue logo if available; fallback to the default logo
          return new URL(`${String(baseUrl || '/').replace(/^\//, '')}images/logo-azul.png`, window.location.origin + (String(baseUrl || '/').startsWith('/') ? '' : '/')).toString();
        } catch (e) {
          try { return new URL('images/logo-azul.png', window.location.href).toString(); } catch (err) { return ''; }
        }
      })();

      const rowsHtml = (list || []).map((m) => {
        const tipo = m?.tipo === 'preventiva' ? 'Preventiva' : (m?.tipo === 'corretiva' ? 'Corretiva' : 'Outro');
        const valor = formatMoneyLabel(m?.valor);
        const km = (m?.kmAtual != null && String(m.kmAtual).trim() !== '')
          ? `${parseInt(m.kmAtual, 10).toLocaleString('pt-BR')} km`
          : '';

        return `
          <tr>
            <td>${escapeHtml(formatManutencaoDate(m))}</td>
            <td>${escapeHtml(getMaintenanceVehicleLabel(m))}</td>
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

      const detailsHtml = (() => {
        if (!isDetailedSingle) return '';
        const m = list[0] || {};

        const tipo = m?.tipo === 'preventiva' ? 'Preventiva'
          : (m?.tipo === 'corretiva' ? 'Corretiva'
            : (m?.tipo ? String(m.tipo) : '—'));

        const codigo = m?.codigoProduto || m?.codigo_produto || '';
        const km = m?.kmAtual || m?.km_atual || '';
        const valor = formatMoneyLabel(m?.valor) || '—';
        const obs = m?.observacoes || '';

        const clientLabel = (() => {
          // Office view prints may include user_email/user_name
          const name = String(m?.user_name || '').trim();
          const email = String(m?.user_email || '').trim();
          if (name && email) return `${name} (${email})`;
          if (email) return email;
          return userLabel;
        })();

        return `
          <div class="box" style="margin-top: 12px;">
            <div class="grid">
              <div><span class="k">Cliente:</span> ${escapeHtml(clientLabel || '—')}</div>
              <div><span class="k">Data:</span> ${escapeHtml(formatManutencaoDate(m))}</div>
              <div><span class="k">Veículo:</span> ${escapeHtml(getMaintenanceVehicleLabel(m))}</div>
              <div><span class="k">Tipo:</span> ${escapeHtml(tipo)}</div>
              <div style="grid-column: 1 / -1;"><span class="k">Descrição:</span> ${escapeHtml(m?.descricao || '—')}</div>
              <div><span class="k">Código do produto:</span> ${escapeHtml(codigo || '—')}</div>
              <div><span class="k">Quilometragem:</span> ${escapeHtml(km || '—')}</div>
              <div><span class="k">Oficina:</span> ${escapeHtml(m?.oficina || '—')}</div>
              <div><span class="k">Valor:</span> ${escapeHtml(valor)}</div>
              <div style="grid-column: 1 / -1;"><span class="k">Observações:</span> ${escapeHtml(obs || '—')}</div>
            </div>
          </div>
        `;
      })();

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
          <div class="item"><span class="k">Registros:</span> ${escapeHtml((list || []).length)}</div>
          <div class="item"><span class="k">Total (informado):</span> ${escapeHtml(totalValueLabel)}</div>
        </div>
      </div>

      ${isDetailedSingle
        ? detailsHtml
        : (rowsHtml ? `
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
        ` : emptyHtml)}

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
    </div>
  </body>
</html>`;

      // IMPORTANT: avoid noopener/noreferrer here. Some Chrome setups return a Window
      // reference that cannot be written to, resulting in a blank popup.
      const w = window.open('about:blank', '_blank', 'width=980,height=720');
      if (!w) {
        alert('Não foi possível abrir a janela de impressão. Verifique se o navegador bloqueou pop-ups.');
        return;
      }

      let wroteOk = false;
      try {
        w.document.open('text/html', 'replace');
        w.document.write(html);
        w.document.close();
        wroteOk = true;
      } catch (err) {
        console.error('Falha ao escrever HTML no popup de impressão:', err);
      }

      // Fallback: if some browser/extension prevents document.write, load the HTML
      // through a blob URL.
      if (!wroteOk) {
        try {
          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);
          try { w.location.replace(blobUrl); } catch (e) { w.location.href = blobUrl; }
          setTimeout(() => {
            try { URL.revokeObjectURL(blobUrl); } catch (e) {}
          }, 120000);
        } catch (e) {
          // ignore
        }
      }

      // Try to auto-open the print dialog shortly after the document is ready.
      // If the browser blocks it, the user can still print via Ctrl+P.
      try {
        const tryPrint = () => {
          try { w.focus(); } catch (e) {}
          try { w.print(); } catch (e) {}
        };
        // onload is best-effort; also call with a short delay as a fallback.
        try { w.onload = tryPrint; } catch (e) {}
        setTimeout(tryPrint, 450);
      } catch (e) {
        // ignore
      }
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

          {isProfessional && (
            <div className="historico-actions" style={{ marginBottom: 10 }}>
              <div className="historico-filters" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="historico-add-btn"
                  style={{ width: 'auto', opacity: String(viewMode) === 'mine' ? 1 : 0.8 }}
                  onClick={() => setViewMode('mine')}
                >
                  Meu histórico
                </button>
                <button
                  type="button"
                  className="historico-add-btn"
                  style={{ width: 'auto', opacity: String(viewMode) === 'office' ? 1 : 0.8 }}
                  onClick={() => setViewMode('office')}
                  title="Ver manutenções registradas por clientes que informaram sua empresa/oficina"
                >
                  Histórico da oficina
                </button>
              </div>
              <div className="historico-actions-right" />
            </div>
          )}

          {String(viewMode) === 'office' && isProfessional ? (
            <>
              <div className="historico-actions">
                <div className="historico-filters">
                  <label htmlFor="office-client">Cliente:</label>
                  <select
                    id="office-client"
                    value={officeClientFilter}
                    onChange={(e) => setOfficeClientFilter(e.target.value)}
                    className="historico-select"
                    disabled={officeLoading}
                  >
                    <option value="all">Todos os clientes</option>
                    {officeClients.map(c => (
                      <option key={c.email} value={c.email}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="historico-actions-right">
                </div>
              </div>

              {officeLoading ? (
                <div className="historico-loading"><p>Carregando histórico da oficina...</p></div>
              ) : officeError ? (
                <div className="historico-empty"><p>{officeErrorLabel}</p></div>
              ) : officeMaintenancesFilteredSorted.length === 0 ? (
                <div className="historico-empty">
                  <p>Nenhuma manutenção encontrada para sua oficina.</p>
                  <p>Para aparecer aqui, o cliente precisa registrar a manutenção informando sua empresa/oficina.</p>
                  {!apiBase && <p><strong>Dica:</strong> em desenvolvimento, as chamadas usam <code>/api</code> via proxy do Vite; confirme que o backend está rodando em <code>http://127.0.0.1:3001</code>.</p>}
                </div>
              ) : (
                <div className="historico-list">
                  {officeMaintenancesFilteredSorted.map(m => (
                    <div key={m.id} className="historico-card">
                      <div className="historico-card-header">
                        <div className="historico-card-veiculo">
                          {getMaintenanceVehicleLabel(m)}
                        </div>
                        <div className="historico-card-data">
                          {formatManutencaoDate(m)}
                        </div>
                      </div>

                      <div className="historico-card-body">
                        <div className="historico-card-descricao" style={{ marginBottom: 6 }}>
                          <strong>Cliente:</strong> {String(m.user_name || '').trim() ? `${m.user_name} (${m.user_email || ''})` : (m.user_email || '—')}
                        </div>

                        <div className="historico-card-tipo">
                          <span className={`historico-tipo-badge ${m.tipo}`}>
                            {m.tipo === 'preventiva' ? 'Preventiva' : m.tipo === 'corretiva' ? 'Corretiva' : 'Outro'}
                          </span>
                        </div>

                        <div className="historico-card-descricao">
                          <strong>Descrição:</strong> {m.descricao}
                        </div>

                        {m.kmAtual && (
                          <div className="historico-card-km">
                            <strong>Quilometragem:</strong> {parseInt(m.kmAtual).toLocaleString('pt-BR')} km
                          </div>
                        )}

                        {m.oficina && (
                          <div className="historico-card-oficina">
                            <strong>Oficina:</strong> {m.oficina}
                          </div>
                        )}

                        {m.valor && (
                          <div className="historico-card-valor">
                            <strong>Valor:</strong> R$ {Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}

                        {m.observacoes && (
                          <div className="historico-card-observacoes">
                            <strong>Observações:</strong> {m.observacoes}
                          </div>
                        )}
                      </div>

                      <div className="historico-card-actions">
                        <button
                          type="button"
                          className="historico-view-btn"
                          onClick={() => openDetails(m)}
                          title="Abrir registro completo (somente leitura)"
                        >
                          Ver completo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (

          loading ? (
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
                          {getMaintenanceVehicleLabel(manutencao)}
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
          )
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
                    <div className="historico-vehicle-bmy-row">
                      <div className="historico-bmy-col">
                        <label className="historico-vehicle-label">Marca *</label>
                        <input
                          type="text"
                          className="historico-input"
                          value={String(formData.veiculoMarca || '')}
                          onChange={(e) => {
                            const next = e && e.target ? String(e.target.value || '') : '';
                            setFormData(prev => ({
                              ...prev,
                              veiculoMarca: next,
                              // edição manual desvincula do carro cadastrado
                              veiculoId: ''
                            }));
                            setCarroSelecionadoHelper('');
                          }}
                          placeholder="Ex: Volkswagen"
                          list="pf-veiculo-marcas"
                          autoComplete="off"
                        />
                        <datalist id="pf-veiculo-marcas">
                          {marcaSuggestions.map((v) => (
                            <option key={v} value={v} />
                          ))}
                        </datalist>
                      </div>

                      <div className="historico-bmy-col">
                        <label className="historico-vehicle-label">Modelo *</label>
                        <input
                          type="text"
                          className="historico-input"
                          value={String(formData.veiculoModelo || '')}
                          onChange={(e) => {
                            const next = e && e.target ? String(e.target.value || '') : '';
                            setFormData(prev => ({
                              ...prev,
                              veiculoModelo: next,
                              // edição manual desvincula do carro cadastrado
                              veiculoId: ''
                            }));
                            setCarroSelecionadoHelper('');
                          }}
                          placeholder="Ex: Gol"
                          list="pf-veiculo-modelos"
                          autoComplete="off"
                        />
                        <datalist id="pf-veiculo-modelos">
                          {modeloSuggestions.map((v) => (
                            <option key={v} value={v} />
                          ))}
                        </datalist>
                      </div>

                      <div className="historico-bmy-year-col">
                        <label htmlFor="veiculoAno" className="historico-vehicle-year-label">Ano</label>
                        <input
                          id="veiculoAno"
                          type="text"
                          readOnly={!!(formData.veiculoId && String(formData.veiculoId).trim())}
                          className="historico-input historico-vehicle-year"
                          value={formData.veiculoId
                            ? ((carros.find(c => String(c.id) === String(formData.veiculoId)) || {}).ano || '')
                            : (formData.veiculoAno || '')
                          }
                          onChange={(e) => setFormData(prev => ({ ...prev, veiculoAno: e.target.value }))}
                          aria-label="Ano do veículo"
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
                        className="historico-input"
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
                    <label>Oficina/Local</label>

                    <CustomDropdown
                      options={oficinaOptions}
                      value={String(formData.oficina || '')}
                      onChange={(val) => {
                        const value = String(val || '');
                        const normalized = value.trim().toLowerCase();
                        const found = normalized
                          ? (Array.isArray(companies) ? companies : []).find(c => {
                              const label = getCompanyDisplayName(c).trim().toLowerCase();
                              return !!label && label === normalized;
                            })
                          : null;

                        setFormData(prev => ({
                          ...prev,
                          oficina: value,
                          company_id: found ? String(found.id) : ''
                        }));
                      }}
                      placeholder={companiesLoading ? 'Carregando empresas...' : 'Selecione a Oficina/Local'}
                      searchable
                      allowCustomValue
                      disabled={companiesLoading}
                    />

                    {companiesError && <div className="error" style={{ marginTop: 8 }}>{companiesError}</div>}
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

          {showDetailsModal && (
            <div className="historico-modal-overlay" onClick={closeDetails}>
              <div className="historico-modal" onClick={(e) => e.stopPropagation()}>
                <div className="historico-modal-header">
                  <h3>Registro completo (somente leitura)</h3>
                  <button
                    className="historico-modal-close"
                    onClick={closeDetails}
                    aria-label="Fechar"
                  >
                    ×
                  </button>
                </div>

                <div className="historico-details">
                  {detailsMaintenance ? (
                    <div className="historico-details-grid">
                      <div className="historico-details-item">
                        <div className="k">Cliente</div>
                        <div className="v">
                          {String(detailsMaintenance.user_name || '').trim()
                            ? `${detailsMaintenance.user_name} (${detailsMaintenance.user_email || ''})`
                            : (detailsMaintenance.user_email || '—')}
                        </div>
                      </div>
                      <div className="historico-details-item">
                        <div className="k">Data</div>
                        <div className="v">{formatManutencaoDate(detailsMaintenance)}</div>
                      </div>
                      <div className="historico-details-item">
                        <div className="k">Veículo</div>
                        <div className="v">{getMaintenanceVehicleLabel(detailsMaintenance)}</div>
                      </div>
                      <div className="historico-details-item">
                        <div className="k">Tipo</div>
                        <div className="v">
                          {detailsMaintenance.tipo === 'preventiva' ? 'Preventiva'
                            : detailsMaintenance.tipo === 'corretiva' ? 'Corretiva'
                              : (detailsMaintenance.tipo ? String(detailsMaintenance.tipo) : '—')}
                        </div>
                      </div>
                      <div className="historico-details-item historico-details-item-full">
                        <div className="k">Descrição</div>
                        <div className="v">{detailsMaintenance.descricao || '—'}</div>
                      </div>
                      <div className="historico-details-item">
                        <div className="k">Código do produto</div>
                        <div className="v">{detailsMaintenance.codigoProduto || detailsMaintenance.codigo_produto || '—'}</div>
                      </div>
                      <div className="historico-details-item">
                        <div className="k">Quilometragem</div>
                        <div className="v">{detailsMaintenance.kmAtual || detailsMaintenance.km_atual || '—'}</div>
                      </div>
                      <div className="historico-details-item">
                        <div className="k">Oficina</div>
                        <div className="v">{detailsMaintenance.oficina || '—'}</div>
                      </div>
                      <div className="historico-details-item">
                        <div className="k">Valor</div>
                        <div className="v">{detailsMaintenance.valor != null && String(detailsMaintenance.valor).trim() !== '' ? `R$ ${Number(detailsMaintenance.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</div>
                      </div>
                      <div className="historico-details-item historico-details-item-full">
                        <div className="k">Observações</div>
                        <div className="v">{detailsMaintenance.observacoes || '—'}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1.25rem' }}>Registro não encontrado.</div>
                  )}

                  <div className="historico-details-actions">
                    <button type="button" className="historico-print-btn" onClick={() => handlePrintComprovante({
                      maintenances: detailsMaintenance ? [detailsMaintenance] : [],
                      userLabelOverride: selectedOfficeClientLabel,
                      filterLabelOverride: 'Registro individual (oficina)',
                      detailed: true
                    })}>
                      🖨️ Imprimir este registro
                    </button>
                    <button type="button" className="historico-view-btn" onClick={closeDetails}>Fechar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
