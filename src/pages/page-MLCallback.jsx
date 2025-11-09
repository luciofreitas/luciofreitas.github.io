import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';

/**
 * Mercado Livre OAuth Callback Handler
 * 
 * This page handles the OAuth redirect from Mercado Livre after authorization.
 * It extracts the access_token and refresh_token from URL parameters and stores them.
 */
const MLCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuarioLogado: user } = useContext(AuthContext) || {};
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse URL parameters
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const expiresIn = params.get('expires_in');
        const errorParam = params.get('ml_error') || params.get('error');

        // Check for error
        if (errorParam) {
          console.error('ML OAuth error:', errorParam);
          setError(`Erro na autorização: ${errorParam}`);
          setStatus('error');
          setTimeout(() => navigate('/#/configuracoes'), 3000);
          return;
        }

        // Check for required tokens
        if (!accessToken) {
          console.error('No access token received');
          setError('Nenhum token de acesso recebido');
          setStatus('error');
          setTimeout(() => navigate('/#/configuracoes'), 3000);
          return;
        }

        // Calculate token expiration time
        const expiresAt = Date.now() + (parseInt(expiresIn) * 1000);

        // Store tokens in localStorage
        const mlTokenData = {
          accessToken,
          refreshToken,
          expiresIn: parseInt(expiresIn),
          expiresAt,
          userId: user?.id,
          connectedAt: new Date().toISOString()
        };

        localStorage.setItem('ml_token_data', JSON.stringify(mlTokenData));
        console.log('ML tokens stored successfully');

        // Success - redirect to settings
        setStatus('success');
        setTimeout(() => navigate('/#/configuracoes?ml_success=true'), 1500);

      } catch (err) {
        console.error('Error processing ML callback:', err);
        setError('Erro ao processar autorização');
        setStatus('error');
        setTimeout(() => navigate('/#/configuracoes'), 3000);
      }
    };

    processCallback();
  }, [location, navigate, user]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '3rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem'
            }} />
            <h2 style={{ color: '#333', marginBottom: '1rem' }}>
              Processando autorização...
            </h2>
            <p style={{ color: '#666' }}>
              Aguarde enquanto conectamos sua conta do Mercado Livre
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#27ae60',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <span style={{ color: 'white', fontSize: '2rem' }}>✓</span>
            </div>
            <h2 style={{ color: '#27ae60', marginBottom: '1rem' }}>
              Conexão realizada com sucesso!
            </h2>
            <p style={{ color: '#666' }}>
              Sua conta do Mercado Livre foi conectada. Redirecionando...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#e74c3c',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <span style={{ color: 'white', fontSize: '2rem' }}>✕</span>
            </div>
            <h2 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
              Erro na conexão
            </h2>
            <p style={{ color: '#666' }}>
              {error || 'Ocorreu um erro ao conectar com o Mercado Livre'}
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '1rem' }}>
              Redirecionando para configurações...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MLCallback;
