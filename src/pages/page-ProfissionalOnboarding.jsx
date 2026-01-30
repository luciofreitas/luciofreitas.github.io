import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';

function getApiBase() {
  try {
    if (typeof window === 'undefined') return '';
    if (window.__API_BASE) return String(window.__API_BASE);
    // dev fallback handled elsewhere in the app; keep empty here
    return '';
  } catch (e) {
    return '';
  }
}

export default function ProfissionalOnboarding() {
  const navigate = useNavigate();
  const { usuarioLogado, setUsuarioLogado } = useContext(AuthContext) || {};

  const [companyName, setCompanyName] = useState(() => (usuarioLogado?.professional?.company_name || ''));
  const [matricula, setMatricula] = useState(() => (usuarioLogado?.professional?.matricula || ''));
  const [companyId, setCompanyId] = useState(() => (usuarioLogado?.professional?.company_id || ''));
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isProfessional = useMemo(() => {
    const t = String(usuarioLogado?.accountType || usuarioLogado?.account_type || '').toLowerCase();
    return t === 'professional' || t === 'profissional' || !!usuarioLogado?.professional;
  }, [usuarioLogado]);

  const apiBase = useMemo(() => getApiBase(), []);
  const usingCompaniesDropdown = useMemo(() => {
    return !!apiBase;
  }, [apiBase]);

  const selectedCompany = useMemo(() => {
    const id = String(companyId || '').trim();
    if (!id) return null;
    const list = Array.isArray(companies) ? companies : [];
    return list.find(c => String(c.id) === id) || null;
  }, [companyId, companies]);

  useEffect(() => {
    if (!usingCompaniesDropdown) return;
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
  }, [usingCompaniesDropdown, apiBase]);

  async function handleSave(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError('');

    if (!usuarioLogado) {
      navigate('/login', { replace: true });
      return;
    }

    const apiBase = getApiBase();
    if (!apiBase) {
      setError('Backend não detectado. Para concluir o onboarding profissional, inicie o backend (Render/dev).');
      return;
    }

    if (usingCompaniesDropdown && (!companyId || !String(companyId).trim())) {
      setError('Selecione uma empresa para concluir o onboarding.');
      return;
    }

    setLoading(true);
    try {
      const accessToken = usuarioLogado?.access_token || null;
      const resp = await fetch(`${apiBase}/api/professional/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          ...(usingCompaniesDropdown
            ? { company_id: String(companyId || '').trim() || null }
            : { company_name: String(companyName || '').trim() || null, matricula: String(matricula || '').trim() || null }
          ),
          onboarding_completed: true
        })
      });

      const body = await resp.json().catch(() => ({}));
      if (!resp.ok || !body || body.error) {
        setError(body && body.error ? String(body.error) : 'Não foi possível salvar o onboarding.');
        return;
      }

      const professional = body.professional || body.data || null;
      const updatedUser = {
        ...(usuarioLogado || {}),
        accountType: 'professional',
        role: 'professional',
        professional: professional ? {
          ...(usuarioLogado?.professional || {}),
          ...professional,
          onboarding_completed: true
        } : {
          ...(usuarioLogado?.professional || {}),
          company_name: usingCompaniesDropdown ? (selectedCompany ? (selectedCompany.trade_name || selectedCompany.legal_name || selectedCompany.company_code || null) : null) : (String(companyName || '').trim() || null),
          matricula: usingCompaniesDropdown ? null : (String(matricula || '').trim() || null),
          company_id: usingCompaniesDropdown ? (String(companyId || '').trim() || null) : null,
          onboarding_completed: true
        }
      };

      try {
        if (setUsuarioLogado) setUsuarioLogado(updatedUser);
        localStorage.setItem('usuario-logado', JSON.stringify(updatedUser));
      } catch (e) {
        // ignore
      }

      if (window.showToast) window.showToast('Onboarding profissional concluído!', 'success', 2500);
      navigate('/historico-manutencao', { replace: true });
    } catch (err) {
      setError(err && err.message ? String(err.message) : 'Erro inesperado ao salvar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Menu />
      <div className="page" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ marginTop: 12 }}>Onboarding Profissional</h2>
        <p style={{ color: '#666', marginTop: 6 }}>
          Complete seus dados para acessar o painel profissional.
        </p>

        {!isProfessional && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', padding: 12, borderRadius: 8, marginTop: 14 }}>
            Sua conta não está cadastrada como profissional. Para acessar o painel profissional, crie uma conta profissional na tela de cadastro.
          </div>
        )}

        {error && (
          <div style={{ background: '#ffe6e6', border: '1px solid #ffb3b3', padding: 12, borderRadius: 8, marginTop: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ marginTop: 16, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {usingCompaniesDropdown ? (
              <>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#444' }}>Empresa/Oficina</span>
                  <select className="input" value={companyId} onChange={e => setCompanyId(e.target.value)} disabled={loading || companiesLoading}>
                    <option value="">{companiesLoading ? 'Carregando empresas...' : 'Selecione a empresa'}</option>
                    {(Array.isArray(companies) ? companies : []).map(c => (
                      <option key={c.id} value={c.id}>{String(c.trade_name || c.legal_name || c.company_code || 'Empresa')}</option>
                    ))}
                  </select>
                  {companiesError && <div style={{ color: '#b91c1c', fontSize: 13 }}>{companiesError}</div>}
                </label>

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#444' }}>Matrícula</span>
                  <input className="input" value={matricula || (selectedCompany && (selectedCompany.company_registration_code || selectedCompany.matricula_prefix) ? `${(selectedCompany.company_registration_code || selectedCompany.matricula_prefix)}XXXXXXX` : 'Será gerada automaticamente')} readOnly />
                </label>
              </>
            ) : (
              <>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#444' }}>Nome da oficina/empresa</span>
                  <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex.: Auto Center Silva" />
                </label>

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#444' }}>Matrícula</span>
                  <input className="input" value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="Ex.: 12345" />
                </label>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="submit" type="submit" disabled={loading}>
              {loading ? 'Salvando…' : 'Concluir e ir para o histórico'}
            </button>
            <button
              className="submit"
              type="button"
              style={{ width: 'auto', padding: '10px 14px', opacity: 0.8 }}
              onClick={() => navigate('/buscar-pecas')}
            >
              Voltar para o app
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
