import React, { useContext, useMemo, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isProfessional = useMemo(() => {
    const t = String(usuarioLogado?.accountType || usuarioLogado?.account_type || '').toLowerCase();
    return t === 'professional' || t === 'profissional' || !!usuarioLogado?.professional;
  }, [usuarioLogado]);

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
          company_name: String(companyName || '').trim() || null,
          matricula: String(matricula || '').trim() || null,
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
          company_name: String(companyName || '').trim() || null,
          matricula: String(matricula || '').trim() || null,
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
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#444' }}>Nome da oficina/empresa</span>
              <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex.: Auto Center Silva" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#444' }}>Matrícula</span>
              <input className="input" value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="Ex.: 12345" />
            </label>
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
