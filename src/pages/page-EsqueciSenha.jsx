import React, { useContext, useMemo, useState } from 'react';
import { Menu, MenuLogin } from '../components';
import { Link } from 'react-router-dom';
import EmailService from '../services/emailService';
import { AuthContext } from '../App';
import { requestPasswordReset } from '../services/resetPasswordService';
// Lazy-import supabase only when needed to avoid increasing initial bundle size
import '../styles/pages/page-EsqueciSenha.css';

export default function EsqueciSenha() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [debugResetLink, setDebugResetLink] = useState('');

  const isLocalhost = useMemo(() => {
    try {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    } catch (e) {
      return false;
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const emailTrimmed = email.toLowerCase().trim();
      // Solicita token ao backend
      const result = await requestPasswordReset(emailTrimmed);
      if (!result.ok) {
        setError(result.error || 'Email não encontrado. Verifique e tente novamente.');
        setLoading(false);
        return;
      }
      // Monta o link de redefinição
      const baseUrl = window.location.origin;
      const resetLink = `${baseUrl}/#/redefinir-senha?token=${result.token}&email=${encodeURIComponent(emailTrimmed)}`;
      // Envia email via EmailJS
      await EmailService.sendPasswordResetEmail({
        nome: emailTrimmed,
        email: emailTrimmed,
        resetLink: resetLink
      });
      setMessage(`✅ Email de recuperação enviado para ${emailTrimmed}. Verifique sua caixa de entrada e spam.`);
      setEmailEnviado(true);
    } catch (err) {
      setError('Erro ao solicitar recuperação de senha. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      
      <div className="esqueci-senha-card">
        <div className="esqueci-senha-header">
          <h1>🔐 Esqueci minha senha</h1>
          <p>Não se preocupe! Vamos te ajudar a recuperar o acesso à sua conta.</p>
        </div>

        {!emailEnviado ? (
          <form onSubmit={handleSubmit} className="esqueci-senha-form">
            <div className="form-group">
              <label htmlFor="email">Email cadastrado:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                required
                disabled={loading}
                className="input-field"
              />
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '⏳ Enviando...' : '📧 Enviar Email de Recuperação'}
            </button>

            <div className="info-box">
              <p>📌 <strong>Como funciona:</strong></p>
              <ol>
                <li>Digite seu email cadastrado</li>
                <li>Você receberá um link de recuperação</li>
                <li>Clique no link e defina uma nova senha</li>
                <li>Pronto! Faça login com a nova senha</li>
              </ol>
            </div>
          </form>
        ) : (
          <div className="success-container">
            <div className="success-message">
              {message}
            </div>

            {isLocalhost && debugResetLink && (
              <div className="info-box" style={{ marginTop: 12 }}>
                <p><strong>🔧 Dev (localhost):</strong> se o email não chegar, use este link:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a className="submit-btn" style={{ textDecoration: 'none', textAlign: 'center' }} href={debugResetLink}>
                    Abrir link de recuperação
                  </a>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(debugResetLink);
                        setMessage('✅ Link copiado para a área de transferência.');
                      } catch (e) {
                        // Fallback: show as selectable text
                      }
                    }}
                  >
                    Copiar link
                  </button>
                </div>
                <p style={{ marginTop: 8, opacity: 0.85 }}>
                  Obs: este fluxo de recuperação usa um token salvo no <strong>localStorage</strong>, então precisa abrir o link no mesmo navegador/dispositivo.
                </p>
              </div>
            )}

            <div className="success-info">
              <h3>📬 Próximos passos:</h3>
              <ul>
                <li>✅ Verifique sua caixa de entrada em <strong>{email}</strong></li>
                <li>✅ Procure por email da Garagem Smart</li>
                <li>✅ Se não encontrar, verifique a pasta de <strong>SPAM</strong></li>
                <li>✅ Clique no link de recuperação</li>
                <li>✅ Defina sua nova senha</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setEmailEnviado(false);
                setEmail('');
                setMessage('');
                setDebugResetLink('');
              }}
              className="resend-btn"
            >
              📧 Reenviar email
            </button>
          </div>
        )}

        <div className="login-links">
          <Link to="/login" className="back-link">
            ← Voltar para o login
          </Link>
          <Link to="/cadastro" className="signup-link">
            Não tem conta? Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
