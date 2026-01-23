import React, { useMemo, useState, useEffect, useContext } from 'react';
import { validateResetToken } from '../services/resetPasswordService';
import { Menu, MenuLogin } from '../components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
// Supabase client is lazily imported where needed to avoid bundling it into
// pages that don't require it on first paint.
import '../styles/pages/page-RedefinirSenha.css';

export default function RedefinirSenha() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  const navigate = useNavigate();

  const passwordChecklist = useMemo(() => {
    const s = String(novaSenha || '');
    return {
      upper: /\p{Lu}/u.test(s),
      lower: /\p{Ll}/u.test(s),
      number: /\d/.test(s),
      minLength: s.length >= 6,
    };
  }, [novaSenha]);

  const isPasswordValid = useMemo(() => {
    return !!(passwordChecklist.upper && passwordChecklist.lower && passwordChecklist.number && passwordChecklist.minLength);
  }, [passwordChecklist]);

  useEffect(() => {
    // Verificar se há um token de recuperação válido via backend
    const checkRecoveryToken = async () => {
      try {
        // Extrair parâmetros da URL
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const token = params.get('token');
        const email = params.get('email');

        if (!token || !email) {
          setError('Link de recuperação inválido. Solicite um novo link.');
          setValidToken(false);
          setCheckingToken(false);
          return;
        }

        // Validar token no backend
        const result = await validateResetToken(token, email);
        if (!result.valid) {
          setError(result.error || 'Link de recuperação inválido ou expirado. Solicite um novo link.');
          setValidToken(false);
          setCheckingToken(false);
          return;
        }

        // Token válido
        setUserEmail(email);
        setValidToken(true);
        setCheckingToken(false);
      } catch (err) {
        console.error('Erro ao verificar token:', err);
        setError('Erro ao validar link de recuperação.');
        setValidToken(false);
        setCheckingToken(false);
      }
    };

    checkRecoveryToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validações
    if (!isPasswordValid) {
      setError('Senha fraca. Atenda aos requisitos abaixo.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // Atualizar senha no Supabase Auth (lazy-import cliente)
      let _supabase = null;
      try { const mod = await import('../supabase'); _supabase = mod.default || mod.supabase; } catch (e) { _supabase = null; }
      if (_supabase && _supabase.auth && typeof _supabase.auth.updateUser === 'function') {
        // Some Supabase SDKs require a signIn before update; try update first
        const { error: updateError } = await _supabase.auth.updateUser({ email: userEmail, password: novaSenha });
        if (updateError) throw updateError;
      } else {
        throw new Error('Supabase client not configured');
      }

      // Limpar token usado
      localStorage.removeItem(`reset_token_${userEmail}`);

      setSuccess(true);
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setError('Erro ao redefinir senha. Tente novamente ou solicite um novo link.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="page-wrapper">
        {usuarioLogado ? <Menu /> : <MenuLogin />}
        <div className="redefinir-senha-container">
          <div className="redefinir-senha-card">
            <div className="loading-message">
              ⏳ Verificando link de recuperação...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="page-wrapper">
        {usuarioLogado ? <Menu /> : <MenuLogin />}
        <div className="redefinir-senha-container">
          <div className="redefinir-senha-card">
            <div className="error-container">
              <h2>❌ Link Inválido</h2>
              <p>{error}</p>
              <button
                onClick={() => navigate('/esqueci-senha')}
                className="action-btn"
              >
                🔐 Solicitar novo link
              </button>
              <button
                onClick={() => navigate('/login')}
                className="secondary-btn"
              >
                ← Voltar ao login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-wrapper">
        {usuarioLogado ? <Menu /> : <MenuLogin />}
        <div className="redefinir-senha-container">
          <div className="redefinir-senha-card">
            <div className="success-container">
              <h2>✅ Senha Redefinida!</h2>
              <p>Sua senha foi alterada com sucesso!</p>
              <p className="redirect-message">Redirecionando para o login em 3 segundos...</p>
              <button
                onClick={() => navigate('/login')}
                className="action-btn"
              >
                Ir para o login agora
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {usuarioLogado ? <Menu /> : <MenuLogin />}
      
      <div className="redefinir-senha-container">
        <div className="redefinir-senha-card">
          <div className="redefinir-senha-header">
            <h1>🔑 Redefinir Senha</h1>
            <p>Crie uma nova senha segura para sua conta.</p>
          </div>

          <form onSubmit={handleSubmit} className="redefinir-senha-form">
            <div className="form-group">
              <label htmlFor="novaSenha">Nova Senha:</label>
              <input
                type="password"
                id="novaSenha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                disabled={loading}
                className="input-field"
                minLength={6}
              />
              <div className="password-checklist" aria-live="polite">
                <ul className="password-checklist-list">
                  <li className={passwordChecklist.upper ? 'ok' : 'missing'}>Letra maiúscula</li>
                  <li className={passwordChecklist.lower ? 'ok' : 'missing'}>Letra minúscula</li>
                  <li className={passwordChecklist.number ? 'ok' : 'missing'}>Números</li>
                  <li className={passwordChecklist.minLength ? 'ok' : 'missing'}>Mínimo 6 dígitos</li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmarSenha">Confirmar Nova Senha:</label>
              <input
                type="password"
                id="confirmarSenha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                disabled={loading}
                className="input-field"
                minLength={6}
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
              {loading ? '⏳ Salvando...' : '✅ Redefinir Senha'}
            </button>

            <div className="security-tips">
              <h3>🛡️ Dicas de Segurança:</h3>
              <ul>
                <li>✅ Use letras maiúsculas e minúsculas</li>
                <li>✅ Use números</li>
                <li>✅ Mínimo 6 caracteres</li>
                <li>✅ Não compartilhe sua senha com ninguém</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
