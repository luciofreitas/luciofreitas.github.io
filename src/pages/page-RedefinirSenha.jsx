import React, { useState, useEffect } from 'react';
import { MenuLogin } from '../components';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import '../styles/pages/page-RedefinirSenha.css';

export default function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há um token de recuperação válido
    const checkRecoveryToken = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
          setValidToken(false);
        } else {
          setValidToken(true);
        }
      } catch (err) {
        console.error('Erro ao verificar token:', err);
        setError('Erro ao validar link de recuperação.');
        setValidToken(false);
      } finally {
        setCheckingToken(false);
      }
    };

    checkRecoveryToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validações
    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // Atualizar senha usando Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (updateError) {
        throw updateError;
      }

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
        <MenuLogin />
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
        <MenuLogin />
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
        <MenuLogin />
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
      <MenuLogin />
      
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
              <small className="hint">Mínimo 6 caracteres</small>
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
                <li>✅ Use pelo menos 6 caracteres</li>
                <li>✅ Misture letras, números e símbolos</li>
                <li>✅ Não use senhas óbvias (123456, senha, etc.)</li>
                <li>✅ Não compartilhe sua senha com ninguém</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
