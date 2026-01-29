import React, { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';

export default function ProfissionalDashboard() {
  const navigate = useNavigate();
  const { usuarioLogado } = useContext(AuthContext) || {};

  const isProfessional = useMemo(() => {
    const t = String(usuarioLogado?.accountType || usuarioLogado?.account_type || '').toLowerCase();
    return t === 'professional' || t === 'profissional' || !!usuarioLogado?.professional;
  }, [usuarioLogado]);

  const onboardingDone = !!(usuarioLogado?.professional && usuarioLogado?.professional.onboarding_completed);

  return (
    <>
      <Menu />
      <div className="page" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ marginTop: 12 }}>Painel Profissional</h2>
        <p style={{ color: '#666', marginTop: 6 }}>
          Uma área separada para profissionais (UX diferente do usuário normal).
        </p>

        {!isProfessional && (
          <div style={{ background: '#ffe6e6', border: '1px solid #ffb3b3', padding: 12, borderRadius: 8, marginTop: 14 }}>
            Sua conta não está marcada como profissional. Use “Login Profissional” para ativar.
          </div>
        )}

        {isProfessional && !onboardingDone && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', padding: 12, borderRadius: 8, marginTop: 14 }}>
            Falta concluir o onboarding. <button className="submit" style={{ width: 'auto', padding: '6px 10px', marginLeft: 8 }} onClick={() => navigate('/profissional/onboarding')}>Concluir agora</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Atalhos</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="submit" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => navigate('/buscar-pecas')}>Buscar peças</button>
              <button className="submit" style={{ width: 'auto', padding: '10px 14px', opacity: 0.85 }} onClick={() => navigate('/meus-carros')}>Meus carros</button>
              <button className="submit" style={{ width: 'auto', padding: '10px 14px', opacity: 0.85 }} onClick={() => navigate('/configuracoes')}>Configurações</button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Perfil profissional</h3>
            <div style={{ color: '#444', lineHeight: 1.5 }}>
              <div><strong>Empresa:</strong> {usuarioLogado?.professional?.company_name || '—'}</div>
              <div><strong>Status:</strong> {usuarioLogado?.professional?.status || (isProfessional ? 'active' : '—')}</div>
              <div><strong>Role:</strong> {usuarioLogado?.professional?.role || (isProfessional ? 'professional' : '—')}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="submit" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => navigate('/profissional/onboarding')}>Editar dados</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
