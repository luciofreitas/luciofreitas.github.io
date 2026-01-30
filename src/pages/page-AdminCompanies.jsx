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
    const t = usuarioLogado && (usuarioLogado.access_token || usuarioLogado.accessToken);
    return t ? String(t) : '';
  }, [usuarioLogado]);

  const role = String((usuarioLogado && usuarioLogado.role) || '').toLowerCase();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);

  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [brand, setBrand] = useState('');
  const [companyType, setCompanyType] = useState('oficina');
  const [cnpj, setCnpj] = useState('');
  const [companyRegistrationCode, setCompanyRegistrationCode] = useState('');
  const [status, setStatus] = useState('active');

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

  async function createCompany(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setLoading(true);
    setError('');
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

      await loadCompanies();
    } catch (e2) {
      setError(e2 && e2.message ? String(e2.message) : 'Erro ao cadastrar empresa');
    } finally {
      setLoading(false);
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
      await loadCompanies();
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
                              <button className="btn btn-secondary admin-danger" type="button" onClick={() => deleteCompany(c.id)} disabled={loading || !token}>
                                Excluir
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
          </div>
        </div>
      </div>
    </>
  );
}
