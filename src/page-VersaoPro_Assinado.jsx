import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from './components/Menu';
import { AuthContext } from './App';
import './page-VersaoPro_Assinado.css';

export default function VersaoPro_Assinado() {
  const navigate = useNavigate();
  const { usuarioLogado } = useContext(AuthContext);
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  const btnPrimary = {
    padding: '10px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer'
  };

  const btnSecondary = {
    padding: '10px 16px',
    background: '#f3f4f6',
    color: '#111827',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer'
  };

  return (
    <>
  <Menu />
  <div className="page-wrapper menu-page">
  <div className="page-content versaoPro_Assinado-section">
        <div className="versaoPro_Assinado-container">
          <h2 className="page-title">Assinatura Pro ativada</h2>
          <p className="versaoPro_Assinado-intro">
            Obrigado{usuarioLogado && usuarioLogado.nome ? `, ${usuarioLogado.nome}` : ''} — sua assinatura Pro foi ativada com sucesso (simulada).
          </p>

          <div className="versaoPro_Assinado-actions">
            <button className="versaoPro_Assinado-btnPrimary" onClick={() => navigate('/')}>Ir para a página inicial</button>
            <button className="versaoPro_Assinado-btnSecondary" onClick={() => navigate('/perfil')}>Ver meu perfil</button>
          </div>

          <div className="versaoPro_Assinado-benefits">
            <h3 className="versaoPro_Assinado-benefits-title">Benefícios ativos</h3>
            {isPro ? (
              <ul className="versaoPro_Assinado-benefits-list">
                <li>✓ Acesso ao endereço das lojas que vendem as peças.</li>
                <li>✓ Contato direto via WhatsApp dentro das compatibilidades.</li>
                <li>✓ Suporte prioritário por e-mail e WhatsApp.</li>
                <li>✓ Acesso à comunidade exclusiva (Discord).</li>
              </ul>
            ) : (
              <p className="versaoPro_Assinado-empty">Nenhuma assinatura ativa encontrada. Se você acabou de pagar, recarregue a página ou faça login novamente para sincronizar o status.</p>
            )}

            <div className="versaoPro_Assinado-note">
              Nota: este é um ambiente de simulação. Para integração com gateway real (Stripe, PayPal etc.), implemente a comunicação do servidor e verificação das transações.
            </div>
          </div>
        </div>
  </div>
  </div>
    </>
  );
}
