import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../App';
import Menu from '../components/Menu';
import CustomDropdown from '../components/CustomDropdown';
import '../styles/pages/page-AdminCompanies.css';

function normalizeForCompare(value) {
  try {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  } catch (e) {
    return String(value || '').trim().toLowerCase();
  }
}

function canonicalizeBrandFromOptions(rawBrand, options) {
  const typed = String(rawBrand || '').trim();
  if (!typed) return '';
  const key = normalizeForCompare(typed);
  const list = Array.isArray(options) ? options : [];
  const match = list.find((opt) => normalizeForCompare(opt) === key);
  return match ? String(match) : typed;
}

function apiBase() {
  return (typeof window !== 'undefined' && window.__API_BASE) ? String(window.__API_BASE) : '';
}

function formatDateTimePtBr(value) {
  try {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR');
  } catch (e) {
    return '—';
  }
}

function formatAuditAction(action) {
  const a = String(action || '').trim().toLowerCase();
  if (a === 'professional_request_approved') return 'Aprovação de conta profissional';
  if (a === 'professional_request_rejected') return 'Rejeição de conta profissional';
  if (a === 'company_created') return 'Empresa criada';
  if (a === 'company_updated') return 'Empresa editada';
  if (a === 'company_deleted') return 'Empresa excluída';
  return action ? String(action) : '—';
}

function summarizeAuditDetails(details) {
  try {
    if (!details || typeof details !== 'object') return '';
    const approvedCompany = details.approved_company_name ? String(details.approved_company_name).trim() : '';
    const matricula = details.allocated_matricula ? String(details.allocated_matricula).trim() : '';
    const reason = details.reason ? String(details.reason).trim() : '';

    const companyName = (() => {
      const after = details.after && typeof details.after === 'object' ? details.after : null;
      const before = details.before && typeof details.before === 'object' ? details.before : null;
      const row = details.company && typeof details.company === 'object' ? details.company : null;
      const name =
        (after && (after.trade_name || after.legal_name || after.company_code || after.company_registration_code)) ||
        (before && (before.trade_name || before.legal_name || before.company_code || before.company_registration_code)) ||
        (row && (row.trade_name || row.legal_name || row.company_code || row.company_registration_code)) ||
        '';
      return String(name || '').trim();
    })();

    const updatedFields = Array.isArray(details.updated_fields) ? details.updated_fields.map(String).filter(Boolean) : [];

    const parts = [];
    if (approvedCompany) parts.push(`Empresa: ${approvedCompany}`);
    if (matricula) parts.push(`Matrícula: ${matricula}`);
    if (reason) parts.push(`Motivo: ${reason}`);

    if (companyName) parts.push(`Empresa: ${companyName}`);
    if (updatedFields.length) parts.push(`Campos: ${updatedFields.join(', ')}`);

    return parts.join(' • ');
  } catch (e) {
    return '';
  }
}

function getTokenBestEffort(usuarioLogado) {
  try {
    const direct = usuarioLogado && (usuarioLogado.access_token || usuarioLogado.accessToken || usuarioLogado.legacy_token);
    if (direct) return String(direct);
  } catch (e) {}

  // Fallback: persisted session
  try {
    const raw = localStorage.getItem('usuario-logado');
    if (!raw) return '';
    const u = JSON.parse(raw);
    const t = u && (u.access_token || u.accessToken || u.legacy_token || u.legacyToken);
    return t ? String(t) : '';
  } catch (e) {
    return '';
  }
}



async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
  if (!res.ok) {
    const msg = (json && (json.error || json.message)) ? String(json.error || json.message) : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export default function AdminCompanies() {
  const { usuarioLogado } = useContext(AuthContext) || {};

  const token = useMemo(() => {
    return getTokenBestEffort(usuarioLogado);
  }, [usuarioLogado]);

  const role = String((usuarioLogado && usuarioLogado.role) || '').toLowerCase();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);

  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [professionalRequests, setProfessionalRequests] = useState([]);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLimit, setAuditLimit] = useState(100);

  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [brand, setBrand] = useState('');
  const [companyType, setCompanyType] = useState('oficina');
  const [cnpj, setCnpj] = useState('');
  const [companyRegistrationCode, setCompanyRegistrationCode] = useState('');
  const [status, setStatus] = useState('active');

  // Optional partners/location fields (requires backend migration 0021)
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [publicNotes, setPublicNotes] = useState('');

  const [cepLoading, setCepLoading] = useState(false);
  const [geoCodeLoading, setGeoCodeLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [editCompanyId, setEditCompanyId] = useState(null);
  const [editLegalName, setEditLegalName] = useState('');
  const [editTradeName, setEditTradeName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCompanyType, setEditCompanyType] = useState('oficina');
  const [editCnpj, setEditCnpj] = useState('');
  const [editCompanyRegistrationCode, setEditCompanyRegistrationCode] = useState('');
  const [editStatus, setEditStatus] = useState('active');

  const [editCep, setEditCep] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editStateUf, setEditStateUf] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editStreetNumber, setEditStreetNumber] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editPublicNotes, setEditPublicNotes] = useState('');

  const [editCepLoading, setEditCepLoading] = useState(false);
  const [editGeoCodeLoading, setEditGeoCodeLoading] = useState(false);

  function sanitizeCep(raw) {
    return String(raw || '').replace(/\D/g, '').slice(0, 8);
  }

  async function fetchViaCep(cepDigits) {
    const c = sanitizeCep(cepDigits);
    if (c.length !== 8) throw new Error('CEP inválido');
    const url = `https://viacep.com.br/ws/${encodeURIComponent(c)}/json/`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`ViaCEP HTTP ${resp.status}`);
    if (body && body.erro) throw new Error('CEP não encontrado');
    return body;
  }

  function buildGeocodeQuery({ street, number, neighborhood, city, state }) {
    const parts = [
      [street, number].filter(Boolean).join(' '),
      neighborhood,
      [city, state].filter(Boolean).join(' - '),
      'Brasil'
    ].map(v => String(v || '').trim()).filter(Boolean);
    return parts.join(', ');
  }

  async function fetchNominatimLatLng(query) {
    const q = String(query || '').trim();
    if (!q) throw new Error('Endereço vazio');
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
        // Nominatim recommends a valid user-agent
        'User-Agent': 'GaragemSmart/1.0 (admin geocode)',
      },
    });
    const body = await resp.json().catch(() => ([]));
    if (!resp.ok) throw new Error(`Geocoding HTTP ${resp.status}`);
    const first = Array.isArray(body) ? body[0] : null;
    if (!first || first.lat == null || first.lon == null) throw new Error('Não encontrei coordenadas para este endereço');
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Coordenadas inválidas retornadas');
    return { lat, lng };
  }

  async function handleAutoFillFromCep(mode) {
    const isEdit = mode === 'edit';
    const setBusy = isEdit ? setEditCepLoading : setCepLoading;
    const setErr = isEdit ? setEditError : setError;
    const currentCep = isEdit ? editCep : cep;
    const c = sanitizeCep(currentCep);

    setErr('');
    if (c.length !== 8) {
      setErr('Informe um CEP válido (8 dígitos).');
      return;
    }

    setBusy(true);
    try {
      const data = await fetchViaCep(c);
      const nextStreet = String(data.logradouro || '').trim();
      const nextNeighborhood = String(data.bairro || '').trim();
      const nextCity = String(data.localidade || '').trim();
      const nextUf = String(data.uf || '').trim();

      if (isEdit) {
        setEditCep(c);
        if (nextStreet) setEditStreet(nextStreet);
        if (nextNeighborhood) setEditNeighborhood(nextNeighborhood);
        if (nextCity) setEditCity(nextCity);
        if (nextUf) setEditStateUf(nextUf);
      } else {
        setCep(c);
        if (nextStreet) setStreet(nextStreet);
        if (nextNeighborhood) setNeighborhood(nextNeighborhood);
        if (nextCity) setCity(nextCity);
        if (nextUf) setStateUf(nextUf);
      }
    } catch (e) {
      setErr(e && e.message ? String(e.message) : 'Erro ao buscar CEP.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGeocodeFromAddress(mode) {
    const isEdit = mode === 'edit';
    const setBusy = isEdit ? setEditGeoCodeLoading : setGeoCodeLoading;
    const setErr = isEdit ? setEditError : setError;

    const query = isEdit
      ? buildGeocodeQuery({ street: editStreet, number: editStreetNumber, neighborhood: editNeighborhood, city: editCity, state: editStateUf })
      : buildGeocodeQuery({ street, number: streetNumber, neighborhood, city, state: stateUf });

    setErr('');
    if (!query) {
      setErr('Preencha rua/cidade/UF para gerar coordenadas.');
      return;
    }

    setBusy(true);
    try {
      const { lat: outLat, lng: outLng } = await fetchNominatimLatLng(query);
      if (isEdit) {
        setEditLat(String(outLat));
        setEditLng(String(outLng));
      } else {
        setLat(String(outLat));
        setLng(String(outLng));
      }
    } catch (e) {
      setErr(e && e.message ? String(e.message) : 'Erro ao gerar coordenadas.');
    } finally {
      setBusy(false);
    }
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditError('');
    setEditSaving(false);
    setEditCompanyId(null);
    setEditLegalName('');
    setEditTradeName('');
    setEditBrand('');
    setEditCompanyType('oficina');
    setEditCnpj('');
    setEditCompanyRegistrationCode('');
    setEditStatus('active');

    setEditCep('');
    setEditCity('');
    setEditStateUf('');
    setEditStreet('');
    setEditStreetNumber('');
    setEditNeighborhood('');
    setEditLat('');
    setEditLng('');
    setEditPhone('');
    setEditWhatsapp('');
    setEditWebsite('');
    setEditInstagram('');
    setEditPublicNotes('');
  }

  function openEditModal(company) {
    try {
      if (!company || company.id == null) return;
      setEditError('');
      setEditSaving(false);
      setEditCompanyId(company.id);
      setEditLegalName(String(company.legal_name || company.legalName || '').trim());
      setEditTradeName(String(company.trade_name || company.tradeName || '').trim());

      const rawBrand = (company.brand || company.marca || company.group || company.grupo) != null ? String(company.brand || company.marca || company.group || company.grupo) : '';
      setEditBrand(canonicalizeBrandFromOptions(rawBrand, brandOptions));

      setEditCompanyType(String(company.company_type || company.companyType || 'oficina'));
      setEditCnpj(String(company.cnpj || '').trim());
      setEditCompanyRegistrationCode(String(company.company_registration_code || company.matricula_prefix || '').trim());
      setEditStatus(String(company.status || 'active'));

      setEditCep(String(company.cep || '').trim());
      setEditCity(String(company.city || '').trim());
      setEditStateUf(String(company.state || '').trim());
      setEditStreet(String(company.address_street || '').trim());
      setEditStreetNumber(String(company.address_number || '').trim());
      setEditNeighborhood(String(company.neighborhood || '').trim());
      setEditLat(company.lat != null ? String(company.lat) : '');
      setEditLng(company.lng != null ? String(company.lng) : '');
      setEditPhone(String(company.phone || '').trim());
      setEditWhatsapp(String(company.whatsapp || '').trim());
      setEditWebsite(String(company.website || '').trim());
      setEditInstagram(String(company.instagram || '').trim());
      setEditPublicNotes(String(company.public_notes || '').trim());

      setEditOpen(true);
    } catch (e) {
      // no-op
    }
  }

  useEffect(() => {
    if (!editOpen) return;
    function onKeyDown(e) {
      if (e && e.key === 'Escape') closeEditModal();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen]);

  const companyTypeLabel = useMemo(() => {
    const map = {
      concessionaria: 'Concessionária',
      oficina: 'Oficina',
      autopecas: 'Autopeças',
      centro_automotivo: 'Centro automotivo',
    };
    return (value) => map[String(value || '').toLowerCase()] || (value ? String(value) : '—');
  }, []);

  const brandOptions = useMemo(() => {
    try {
      const seen = new Set();
      const opts = [];
      for (const c of (companies || [])) {
        const raw = (c && (c.brand || c.marca || c.group || c.grupo)) != null ? String(c.brand || c.marca || c.group || c.grupo) : '';
        const v = raw.trim();
        if (!v) continue;
        const k = v.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        opts.push(v);
      }
      opts.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
      return opts;
    } catch (e) {
      return [];
    }
  }, [companies]);

  const brandDropdownOptions = useMemo(() => {
    return (brandOptions || []).map((b) => ({ value: b, label: b }));
  }, [brandOptions]);

  async function loadCompanies() {
    setLoading(true);
    setError('');
    try {
      if (!token) {
        setCompanies([]);
        setError('not authenticated');
        return;
      }
      const url = `${apiBase()}/api/admin/companies`;
      const json = await fetchJson(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setCompanies(Array.isArray(json.companies) ? json.companies : []);
    } catch (e) {
      setError(e && e.message ? String(e.message) : 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadProfessionalRequests() {
    setRequestsLoading(true);
    setRequestsError('');
    try {
      if (!token) {
        setProfessionalRequests([]);
        setRequestsError('not authenticated');
        return;
      }
      const url = `${apiBase()}/api/admin/professional-requests`;
      const json = await fetchJson(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const list = json && Array.isArray(json.requests) ? json.requests : (Array.isArray(json) ? json : []);
      setProfessionalRequests(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg = e && e.message ? String(e.message) : 'Erro ao carregar solicitações';
      const low = msg.toLowerCase();
      if ((e && e.status === 404) || low === 'not found' || low.includes('not found')) {
        setRequestsError('Endpoint não encontrado no backend: /api/admin/professional-requests. Isso normalmente significa que o backend ainda não foi reiniciado/redeployado com as últimas mudanças.');
      } else {
        setRequestsError(msg);
      }
      setProfessionalRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }

  useEffect(() => {
    loadProfessionalRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadAuditLogs(nextLimit) {
    setAuditLoading(true);
    setAuditError('');
    try {
      if (!token) {
        setAuditLogs([]);
        setAuditError('not authenticated');
        return;
      }
      const limitValue = Number.isFinite(Number(nextLimit)) ? Number(nextLimit) : Number(auditLimit);
      const safeLimit = (!Number.isFinite(limitValue) || limitValue <= 0) ? 100 : Math.min(500, Math.floor(limitValue));
      const url = `${apiBase()}/api/admin/audit-logs?limit=${encodeURIComponent(String(safeLimit))}`;
      const json = await fetchJson(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const list = json && Array.isArray(json.logs) ? json.logs : (Array.isArray(json) ? json : []);
      setAuditLogs(Array.isArray(list) ? list : []);
    } catch (e) {
      setAuditError(e && e.message ? String(e.message) : 'Erro ao carregar auditoria');
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function approveRequest(userId) {
    if (!userId) return;
    const ok = window.confirm('Aprovar esta solicitação profissional?');
    if (!ok) return;
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const url = `${apiBase()}/api/admin/professional-requests/${encodeURIComponent(String(userId))}/approve`;
      await fetchJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      await loadProfessionalRequests();
      loadAuditLogs();
    } catch (e) {
      setRequestsError(e && e.message ? String(e.message) : 'Erro ao aprovar solicitação');
    } finally {
      setRequestsLoading(false);
    }
  }

  async function rejectRequest(userId) {
    if (!userId) return;
    const ok = window.confirm('Rejeitar esta solicitação profissional?');
    if (!ok) return;
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const url = `${apiBase()}/api/admin/professional-requests/${encodeURIComponent(String(userId))}/reject`;
      await fetchJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      await loadProfessionalRequests();
      loadAuditLogs();
    } catch (e) {
      setRequestsError(e && e.message ? String(e.message) : 'Erro ao rejeitar solicitação');
    } finally {
      setRequestsLoading(false);
    }
  }

  async function createCompany(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError('');
    if (!String(tradeName || '').trim()) {
      setError('Nome fantasia é obrigatório (ex.: FIAT Niterói).');
      return;
    }
    setLoading(true);
    try {
      const url = `${apiBase()}/api/admin/companies`;
      const canonicalBrand = canonicalizeBrandFromOptions(brand, brandOptions);
      const payload = {
        legal_name: legalName || null,
        trade_name: tradeName || null,
        brand: canonicalBrand || null,
        company_type: companyType || 'oficina',
        cnpj: cnpj || null,
        status: status || 'active',
        company_registration_code: companyRegistrationCode || '',
        // Backward-compat with older backend versions
        matricula_prefix: companyRegistrationCode || '',

        // Partners/location fields (optional)
        cep: cep || null,
        city: city || null,
        state: stateUf || null,
        address_street: street || null,
        address_number: streetNumber || null,
        neighborhood: neighborhood || null,
        lat: lat === '' ? null : lat,
        lng: lng === '' ? null : lng,
        phone: phone || null,
        whatsapp: whatsapp || null,
        website: website || null,
        instagram: instagram || null,
        public_notes: publicNotes || null,
      };
      await fetchJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      setLegalName('');
      setTradeName('');
      setBrand('');
      setCompanyType('oficina');
      setCnpj('');
      setCompanyRegistrationCode('');
      setStatus('active');

      setCep('');
      setCity('');
      setStateUf('');
      setStreet('');
      setStreetNumber('');
      setNeighborhood('');
      setLat('');
      setLng('');
      setPhone('');
      setWhatsapp('');
      setWebsite('');
      setInstagram('');
      setPublicNotes('');
      await loadCompanies();
      loadAuditLogs();
    } catch (e2) {
      setError(e2 && e2.message ? String(e2.message) : 'Erro ao cadastrar empresa');
    } finally {
      setLoading(false);
    }
  }

  async function saveEditCompany(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (editCompanyId == null) return;

    if (!String(editTradeName || '').trim()) {
      setEditError('Nome fantasia é obrigatório (ex.: FIAT Niterói).');
      return;
    }

    setEditSaving(true);
    setEditError('');
    try {
      const url = `${apiBase()}/api/admin/companies/${encodeURIComponent(String(editCompanyId))}`;
      const canonicalBrand = canonicalizeBrandFromOptions(editBrand, brandOptions);
      const payload = {
        legal_name: editLegalName || null,
        trade_name: editTradeName || null,
        brand: canonicalBrand || null,
        company_type: editCompanyType || 'oficina',
        cnpj: editCnpj || null,
        status: editStatus || 'active',
        company_registration_code: editCompanyRegistrationCode || '',
        // Backward-compat with older backend versions
        matricula_prefix: editCompanyRegistrationCode || '',

        // Partners/location fields (optional)
        cep: editCep || null,
        city: editCity || null,
        state: editStateUf || null,
        address_street: editStreet || null,
        address_number: editStreetNumber || null,
        neighborhood: editNeighborhood || null,
        lat: editLat === '' ? '' : editLat,
        lng: editLng === '' ? '' : editLng,
        phone: editPhone || null,
        whatsapp: editWhatsapp || null,
        website: editWebsite || null,
        instagram: editInstagram || null,
        public_notes: editPublicNotes || null,
      };

      await fetchJson(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      await loadCompanies();
      loadAuditLogs();
      closeEditModal();
    } catch (e2) {
      setEditError(e2 && e2.message ? String(e2.message) : 'Erro ao salvar alterações');
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteEditCompany() {
    if (editCompanyId == null) return;
    const ok = window.confirm('Excluir empresa/oficina? Essa ação é permanente.');
    if (!ok) return;

    setEditSaving(true);
    setEditError('');
    try {
      const url = `${apiBase()}/api/admin/companies/${encodeURIComponent(String(editCompanyId))}`;
      await fetchJson(url, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      await loadCompanies();
      loadAuditLogs();
      closeEditModal();
    } catch (e2) {
      setEditError(e2 && e2.message ? String(e2.message) : 'Erro ao excluir empresa');
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteCompany(id) {
    if (!id) return;
    const ok = window.confirm('Excluir empresa/oficina? Essa ação é permanente.');
    if (!ok) return;

    setLoading(true);
    setError('');
    try {
      const url = `${apiBase()}/api/admin/companies/${encodeURIComponent(String(id))}`;
      await fetchJson(url, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (String(id) === String(editingCompanyId)) {
        resetCompanyForm();
      }
      await loadCompanies();
      loadAuditLogs();
    } catch (e) {
      setError(e && e.message ? String(e.message) : 'Erro ao excluir empresa');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Menu />
      <div className="page-wrapper">
        <div className="page-content">
          <div className="admin-companies-container">
            <div className="admin-companies-header">
              <h1 className="page-title">Cadastro de Empresa/Oficina</h1>
            </div>

            {!token && (
              <div className="admin-alert admin-alert-warn">
                Não foi encontrado token de sessão. Faça login novamente.
              </div>
            )}

            {error && (
              <div className="admin-alert admin-alert-error">
                {error}
              </div>
            )}

            <form onSubmit={createCompany} className="admin-companies-card">
              <div className="admin-companies-grid">
                <div className="admin-field">
                  <label className="admin-label">Razão social</label>
                  <input className="input" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Ex.: FIAT Niterói LTDA" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Nome fantasia</label>
                  <input className="input" value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Ex.: FIAT Niterói" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Marca / Grupo</label>
                  <CustomDropdown
                    options={brandDropdownOptions}
                    value={brand}
                    onChange={(next) => {
                      const canonical = canonicalizeBrandFromOptions(next, brandOptions);
                      setBrand(canonical);
                    }}
                    placeholder="Ex.: FIAT"
                    searchable
                    allowCustomValue
                  />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Tipo de empresa</label>
                  <select className="input" value={companyType} onChange={(e) => setCompanyType(e.target.value)}>
                    <option value="concessionaria">Concessionária</option>
                    <option value="oficina">Oficina</option>
                    <option value="autopecas">Autopeças</option>
                    <option value="centro_automotivo">Centro automotivo</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label className="admin-label">CNPJ</label>
                  <input className="input" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="Somente números (opcional)" inputMode="numeric" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Código da empresa</label>
                  <input
                    className="input admin-uppercase"
                    value={companyRegistrationCode}
                    onChange={(e) => setCompanyRegistrationCode(e.target.value)}
                    placeholder="Ex.: FTNIT"
                    autoCapitalize="characters"
                  />
                  <div className="admin-help">Esse código será usado para gerar as matrículas automaticamente.</div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Status</label>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">Ativa</option>
                    <option value="pending">Pendente</option>
                    <option value="suspended">Suspensa</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label className="admin-label">CEP</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="Ex.: 01001-000" inputMode="numeric" />
                    <button className="btn btn-secondary" type="button" onClick={() => handleAutoFillFromCep('create')} disabled={cepLoading || !token}>
                      {cepLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  <div className="admin-help">Preenche rua, bairro, cidade e UF automaticamente.</div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Cidade</label>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: São Paulo" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">UF</label>
                  <input className="input admin-uppercase" value={stateUf} onChange={(e) => setStateUf(e.target.value)} placeholder="Ex.: SP" maxLength={2} />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Rua</label>
                  <input className="input" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ex.: Av. Paulista" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Número</label>
                  <input className="input" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} placeholder="Ex.: 1000" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Bairro</label>
                  <input className="input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Ex.: Bela Vista" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Latitude</label>
                  <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Ex.: -23.561684" inputMode="decimal" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Longitude</label>
                  <input className="input" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Ex.: -46.655981" inputMode="decimal" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Coordenadas</label>
                  <button className="btn btn-secondary" type="button" onClick={() => handleGeocodeFromAddress('create')} disabled={geoCodeLoading || !token}>
                    {geoCodeLoading ? 'Gerando...' : 'Gerar por endereço'}
                  </button>
                  <div className="admin-help">Usa o endereço para sugerir lat/lng (pode ajustar manualmente).</div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Telefone</label>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(opcional)" inputMode="tel" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">WhatsApp</label>
                  <input className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(opcional)" inputMode="tel" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Website</label>
                  <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://... (opcional)" />
                </div>

                <div className="admin-field">
                  <label className="admin-label">Instagram</label>
                  <input className="input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@... (opcional)" />
                </div>

                <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Notas públicas</label>
                  <textarea className="input" value={publicNotes} onChange={(e) => setPublicNotes(e.target.value)} placeholder="Ex.: Especialista em freios, alinhamento e suspensão." rows={3} />
                  <div className="admin-help">Essas informações podem aparecer na página de Parceiros.</div>
                </div>
              </div>

              <div className="admin-actions">
                <button className="btn btn-primary" type="submit" disabled={loading || !token}>
                  {loading ? 'Salvando...' : 'Cadastrar'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={loadCompanies} disabled={loading || !token}>
                  Atualizar lista
                </button>
              </div>
            </form>

            <div className="admin-companies-list-header">
              <h2 className="admin-section-title admin-section-title--sm">Solicitações de conta profissional</h2>
              {requestsLoading && <span className="admin-muted">Carregando...</span>}
            </div>

            {requestsError && (
              <div className="admin-alert admin-alert-error">
                {requestsError}
                <div className="admin-help" style={{ marginTop: 6 }}>
                  Dica: abra <a href={`${apiBase()}/api/health`} target="_blank" rel="noreferrer">{`${apiBase()}/api/health`}</a> para conferir se você está apontando para o backend correto.
                </div>
              </div>
            )}

            <div className="admin-table card card-flat">
              <div className="admin-table-scroll">
                <table className="admin-table-el">
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>E-mail</th>
                      <th>Empresa solicitada</th>
                      <th>Status</th>
                      <th className="admin-actions-col admin-actions-col-wide">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(professionalRequests || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="admin-empty">Nenhuma solicitação pendente.</td>
                      </tr>
                    ) : (
                      (professionalRequests || []).map((r) => {
                        const userId = r.user_id || r.userId || r.id;
                        const userName = (r.user_name || r.userName || '').trim();
                        const userEmail = (r.user_email || r.email || '').trim();
                        const companyLabel = String(r.company_trade_name || r.company_legal_name || r.requested_company_name || r.company_code || '').trim() || '—';
                        const st = String(r.status || 'pending');
                        return (
                          <tr key={String(userId)}>
                            <td>{userName || '—'}</td>
                            <td>{userEmail || '—'}</td>
                            <td>{companyLabel}</td>
                            <td>
                              <span className={`admin-badge admin-badge-${st.toLowerCase()}`}>{st}</span>
                            </td>
                            <td className="admin-actions-col admin-actions-col-wide">
                              <button className="btn btn-primary" type="button" onClick={() => approveRequest(userId)} disabled={requestsLoading || !token}>
                                Aprovar
                              </button>
                              <button className="btn btn-secondary admin-danger" type="button" onClick={() => rejectRequest(userId)} disabled={requestsLoading || !token} style={{ marginLeft: 8 }}>
                                Rejeitar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-companies-list-header">
              <h2 className="admin-section-title admin-section-title--sm">Auditoria (aprovações e empresas)</h2>
              <div className="admin-audit-controls">
                <label className="admin-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Limite
                  <select
                    className="input"
                    value={auditLimit}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setAuditLimit(next);
                      loadAuditLogs(next);
                    }}
                    style={{ width: 120, paddingTop: 6, paddingBottom: 6 }}
                    disabled={!token || auditLoading}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                </label>
                <button className="btn btn-secondary" type="button" onClick={() => loadAuditLogs()} disabled={!token || auditLoading}>
                  {auditLoading ? 'Atualizando...' : 'Atualizar auditoria'}
                </button>
              </div>
            </div>

            {auditError && (
              <div className="admin-alert admin-alert-error">
                {auditError}
              </div>
            )}

            <div className="admin-table card card-flat">
              <div className="admin-table-scroll">
                <table className="admin-table-el">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Ação</th>
                      <th>Ator</th>
                      <th>Alvo</th>
                      <th>IP</th>
                      <th>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(auditLogs || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="admin-empty">Nenhum log ainda.</td>
                      </tr>
                    ) : (
                      (auditLogs || []).map((l) => {
                        const id = l.id != null ? String(l.id) : `${l.created_at || ''}-${l.action || ''}`;
                        const actorName = l.details && typeof l.details === 'object' ? String(l.details.actor_name || '').trim() : '';
                        const actorEmail = l.details && typeof l.details === 'object' ? String(l.details.actor_email || '').trim() : '';
                        const actorIdentity = actorName || actorEmail ? [actorName, actorEmail].filter(Boolean).join(' <') + (actorName && actorEmail ? '>' : '') : '';
                        const actor = [actorIdentity, l.actor_role ? String(l.actor_role) : '', l.actor_user_id ? String(l.actor_user_id) : '']
                          .filter(Boolean)
                          .join(' • ') || '—';

                        const targetCompanyId = l.target_company_id != null ? String(l.target_company_id) : '';
                        const targetUserId = l.target_user_id != null ? String(l.target_user_id) : '';
                        const targetCompanyName = (() => {
                          if (!l.details || typeof l.details !== 'object') return '';
                          const d = l.details;
                          const after = d.after && typeof d.after === 'object' ? d.after : null;
                          const before = d.before && typeof d.before === 'object' ? d.before : null;
                          const row = d.company && typeof d.company === 'object' ? d.company : null;
                          const name =
                            (after && (after.trade_name || after.legal_name || after.company_code)) ||
                            (before && (before.trade_name || before.legal_name || before.company_code)) ||
                            (row && (row.trade_name || row.legal_name || row.company_code)) ||
                            '';
                          return String(name || '').trim();
                        })();
                        const target = [targetUserId, targetCompanyName ? `Empresa: ${targetCompanyName}` : '', targetCompanyId ? `ID: ${targetCompanyId}` : '']
                          .filter(Boolean)
                          .join(' • ') || '—';
                        const detailsText = summarizeAuditDetails(l.details);
                        return (
                          <tr key={id}>
                            <td className="admin-mono">{formatDateTimePtBr(l.created_at)}</td>
                            <td>{formatAuditAction(l.action)}</td>
                            <td className="admin-mono">{actor}</td>
                            <td className="admin-mono">{target}</td>
                            <td className="admin-mono">{l.ip ? String(l.ip) : '—'}</td>
                            <td className="admin-audit-details">{detailsText || '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-companies-list-header">
              <h2 className="admin-section-title">Empresas cadastradas</h2>
              {loading && companies.length === 0 && <span className="admin-muted">Carregando...</span>}
            </div>

            <div className="admin-table card card-flat">
              <div className="admin-table-scroll">
                <table className="admin-table-el">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Código</th>
                      <th>Código da empresa</th>
                      <th>Status</th>
                      <th className="admin-actions-col">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(companies || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="admin-empty">Nenhuma empresa cadastrada ainda.</td>
                      </tr>
                    ) : (
                      (companies || []).map((c) => {
                        const name = (c.trade_name || c.legal_name || c.company_code || '').trim();
                        return (
                          <tr key={c.id}>
                            <td>{name || '—'}</td>
                            <td>{companyTypeLabel(c.company_type || c.companyType || c.tipo || c.type || c.company_tipo)}</td>
                            <td className="admin-mono">{c.company_code || '—'}</td>
                            <td className="admin-mono">{c.company_registration_code || c.matricula_prefix || '—'}</td>
                            <td>
                              <span className={`admin-badge admin-badge-${String(c.status || 'unknown').toLowerCase()}`}>{c.status || '—'}</span>
                            </td>
                            <td className="admin-actions-col">
                              <button
                                className="admin-icon-btn"
                                type="button"
                                onClick={() => openEditModal(c)}
                                disabled={loading || !token}
                                title="Editar"
                                aria-label="Editar empresa"
                              >
                                <span className="admin-icon admin-icon-pencil" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {editOpen && (
              <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-label="Editar empresa" onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeEditModal();
              }}>
                <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="admin-modal-header">
                    <h3 className="admin-modal-title">Editar empresa</h3>
                    <button className="admin-modal-close" type="button" onClick={closeEditModal} aria-label="Fechar" disabled={editSaving}>
                      <span className="admin-icon admin-icon-close" aria-hidden="true" />
                    </button>
                  </div>

                  {editError && (
                    <div className="admin-alert admin-alert-error" style={{ marginTop: 0 }}>
                      {editError}
                    </div>
                  )}

                  <form onSubmit={saveEditCompany} className="admin-modal-body">
                    <div className="admin-companies-grid">
                      <div className="admin-field">
                        <label className="admin-label">Razão social</label>
                        <input className="input" value={editLegalName} onChange={(e) => setEditLegalName(e.target.value)} placeholder="Ex.: FIAT Niterói LTDA" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Nome fantasia</label>
                        <input className="input" value={editTradeName} onChange={(e) => setEditTradeName(e.target.value)} placeholder="Ex.: FIAT Niterói" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Marca / Grupo</label>
                        <CustomDropdown
                          options={brandDropdownOptions}
                          value={editBrand}
                          onChange={(next) => {
                            const canonical = canonicalizeBrandFromOptions(next, brandOptions);
                            setEditBrand(canonical);
                          }}
                          placeholder="Ex.: FIAT"
                          searchable
                          allowCustomValue
                        />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Tipo de empresa</label>
                        <select className="input" value={editCompanyType} onChange={(e) => setEditCompanyType(e.target.value)}>
                          <option value="concessionaria">Concessionária</option>
                          <option value="oficina">Oficina</option>
                          <option value="autopecas">Autopeças</option>
                          <option value="centro_automotivo">Centro automotivo</option>
                        </select>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">CNPJ</label>
                        <input className="input" value={editCnpj} onChange={(e) => setEditCnpj(e.target.value)} placeholder="Somente números (opcional)" inputMode="numeric" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Código da empresa</label>
                        <input
                          className="input admin-uppercase"
                          value={editCompanyRegistrationCode}
                          onChange={(e) => setEditCompanyRegistrationCode(e.target.value)}
                          placeholder="Ex.: FTNIT"
                          autoCapitalize="characters"
                        />
                        <div className="admin-help">Esse código será usado para gerar as matrículas automaticamente.</div>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Status</label>
                        <select className="input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                          <option value="active">Ativa</option>
                          <option value="pending">Pendente</option>
                          <option value="suspended">Suspensa</option>
                        </select>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">CEP</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input className="input" value={editCep} onChange={(e) => setEditCep(e.target.value)} placeholder="Ex.: 01001-000" inputMode="numeric" />
                          <button className="btn btn-secondary" type="button" onClick={() => handleAutoFillFromCep('edit')} disabled={editCepLoading || !token || editSaving}>
                            {editCepLoading ? 'Buscando...' : 'Buscar'}
                          </button>
                        </div>
                        <div className="admin-help">Preenche rua, bairro, cidade e UF automaticamente.</div>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Cidade</label>
                        <input className="input" value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="Ex.: São Paulo" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">UF</label>
                        <input className="input admin-uppercase" value={editStateUf} onChange={(e) => setEditStateUf(e.target.value)} placeholder="Ex.: SP" maxLength={2} />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Rua</label>
                        <input className="input" value={editStreet} onChange={(e) => setEditStreet(e.target.value)} placeholder="Ex.: Av. Paulista" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Número</label>
                        <input className="input" value={editStreetNumber} onChange={(e) => setEditStreetNumber(e.target.value)} placeholder="Ex.: 1000" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Bairro</label>
                        <input className="input" value={editNeighborhood} onChange={(e) => setEditNeighborhood(e.target.value)} placeholder="Ex.: Bela Vista" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Latitude</label>
                        <input className="input" value={editLat} onChange={(e) => setEditLat(e.target.value)} placeholder="Ex.: -23.561684" inputMode="decimal" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Longitude</label>
                        <input className="input" value={editLng} onChange={(e) => setEditLng(e.target.value)} placeholder="Ex.: -46.655981" inputMode="decimal" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Coordenadas</label>
                        <button className="btn btn-secondary" type="button" onClick={() => handleGeocodeFromAddress('edit')} disabled={editGeoCodeLoading || !token || editSaving}>
                          {editGeoCodeLoading ? 'Gerando...' : 'Gerar por endereço'}
                        </button>
                        <div className="admin-help">Usa o endereço para sugerir lat/lng (pode ajustar manualmente).</div>
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Telefone</label>
                        <input className="input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="(opcional)" inputMode="tel" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">WhatsApp</label>
                        <input className="input" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} placeholder="(opcional)" inputMode="tel" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Website</label>
                        <input className="input" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://... (opcional)" />
                      </div>

                      <div className="admin-field">
                        <label className="admin-label">Instagram</label>
                        <input className="input" value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} placeholder="@... (opcional)" />
                      </div>

                      <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
                        <label className="admin-label">Notas públicas</label>
                        <textarea className="input" value={editPublicNotes} onChange={(e) => setEditPublicNotes(e.target.value)} placeholder="Ex.: Especialista em freios, alinhamento e suspensão." rows={3} />
                      </div>
                    </div>

                    <div className="admin-modal-actions">
                      <div className="admin-modal-actions-left">
                        <button className="btn btn-primary" type="submit" disabled={!token || editSaving}>
                          {editSaving ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={closeEditModal} disabled={editSaving}>
                          Cancelar
                        </button>
                      </div>
                      <div className="admin-modal-actions-right">
                        <button className="btn btn-secondary admin-danger" type="button" onClick={deleteEditCompany} disabled={!token || editSaving}>
                          Excluir empresa
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
