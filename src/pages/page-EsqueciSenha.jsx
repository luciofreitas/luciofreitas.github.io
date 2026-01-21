import React, { useContext, useMemo, useState } from 'react';
import { Menu, MenuLogin } from '../components';
import { Link } from 'react-router-dom';
import EmailService from '../services/emailService';
import { AuthContext } from '../App';
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
      console.log('Email processado:', emailTrimmed);

      // SOLUÇÃO ALTERNATIVA: Tentar buscar sem filtro e filtrar no JavaScript
      let _supabase = null;
      try { const mod = await import('../supabase'); _supabase = mod.default || mod.supabase; } catch (e) { _supabase = null; }
      if (!_supabase) {
        throw new Error('Supabase não configurado ou indisponível');
      }
      const { data: allUsers, error: allError } = await _supabase
        .from('users')
        .select('id, nome, email, auth_id');

      console.log('Todos os usuários:', allUsers, 'Erro:', allError);

      if (allError) {
        console.error('Erro ao buscar usuários:', allError);
        throw new Error('Erro ao acessar o banco de dados.');
      }

      // Filtrar manualmente no JavaScript
      const userData = allUsers?.find(user => user.email?.toLowerCase() === emailTrimmed);

      console.log('Usuário encontrado:', userData);

      if (!userData) {
        console.warn('Usuário não encontrado na tabela users:', emailTrimmed);
        setError('Email não encontrado. Verifique e tente novamente.');
        setLoading(false);
        return;
      }

      // Gerar token único para recuperação
      const resetToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Detectar ambiente (localhost ou produção)
      const baseUrl = isLocalhost ? window.location.origin : 'https://www.garagemsmart.com.br';
      const resetLink = `${baseUrl}/#/redefinir-senha?token=${resetToken}&email=${encodeURIComponent(emailTrimmed)}`;

      console.log('Link de recuperação gerado:', resetLink);
      setDebugResetLink(resetLink);

      // Salvar token no localStorage (temporário - expira em 1 hora)
      const tokenData = {
        email: emailTrimmed,
        token: resetToken,
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hora
      };
      localStorage.setItem(`reset_token_${emailTrimmed}`, JSON.stringify(tokenData));

      // Enviar email APENAS via EmailJS
      console.log('Enviando email via EmailJS...');
      await EmailService.sendPasswordResetEmail({
        nome: userData.nome || 'Usuário',
        email: emailTrimmed,
        userId: userData.id,
        resetLink: resetLink
      });

      console.log('Email enviado com sucesso!');
      setEmailEnviado(true);
      setMessage(`✅ Email de recuperação enviado para ${emailTrimmed}. Verifique sua caixa de entrada e spam.`);
      
    } catch (err) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      // Show EmailJS error details when available
      try {
        const msg = EmailService.getErrorMessage(err);
        setError(msg || 'Erro ao enviar email de recuperação. Tente novamente mais tarde.');
      } catch (e) {
        setError('Erro ao enviar email de recuperação. Tente novamente mais tarde.');
      }
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
