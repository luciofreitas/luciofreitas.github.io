import React, { useState, useContext, useEffect } from 'react';
import MenuLogin from './components/MenuLogin';
// Removido import './components/Menu.css' - não é necessário e causa conflito de cores
import './page-Login.css';
import usuariosData from './usuarios.json';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './App';
import ToggleCar from './components/ToggleCar';

// Contas demo que funcionam para todos os usuários (não dependem de localStorage)
const usuariosDemoGlobais = [
  {
    id: 'demo1',
    nome: 'Usuário Demo',
    email: 'demo@pecafacil.com',
    senha: '123456',
    celular: '11999999999',
    isDemo: true
  },
  {
    id: 'admin1', 
    nome: 'Admin Demo',
    email: 'admin@pecafacil.com',
    senha: 'admin123',
    celular: '11888888888',
    isDemo: true
  },
  {
    id: 'teste1',
    nome: 'Teste Público',
    email: 'teste@pecafacil.com', 
    senha: 'teste123',
    celular: '11777777777',
    isDemo: true
  }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  

  const navigate = useNavigate();
  const { setUsuarioLogado } = useContext(AuthContext || {});

  // Função para testar localStorage
  function testLocalStorage() {
    try {
      const test = '__test_localStorage__';
      localStorage.setItem(test, 'test');
      const retrieved = localStorage.getItem(test);
      localStorage.removeItem(test);
      return retrieved === 'test';
    } catch (e) {
      console.error('[Debug] localStorage não disponível:', e);
      return false;
    }
  }

  // Testar localStorage na inicialização do componente
  useEffect(() => {
    const lsAvailable = testLocalStorage();
  }, []);

  function getUsuarios() {
    let usuarios = [];
    // Sempre incluir contas demo (funcionam para todos)
    usuarios = [...usuariosDemoGlobais];
    
    // Tentar adicionar usuários do localStorage se disponível
    try {
      const raw = localStorage.getItem('usuarios');
      if (raw) {
        const parsed = JSON.parse(raw);
        usuarios = usuarios.concat(parsed);
      }
    } catch (e) {
      console.error('[Debug] Erro ao ler localStorage:', e);
    }
    
    // Seed from usuarios.json if available
    try {
      const seedData = (usuariosData || []).map(u => ({
        id: u.id,
        nome: u.nome || '',
        celular: String(u.celular || '').replace(/\D/g, ''),
        email: String(u.email || '').trim().toLowerCase(),
        senha: String(u.senha || '')
      }));
  usuarios = usuarios.concat(seedData);
    } catch (e) {
      console.error('[Debug] Erro ao processar seed data:', e);
    }
    
    return usuarios;
  }

  function saveUsuario(novoUsuario) {
    // Mantido inicialmente para compatibilidade; registro agora foi movido para page-Cadastro.jsx
    // Se necessário, a função de persistência do usuário pode ser centralizada posteriormente.
    return novoUsuario;
  }

  function handleLogin(e) {
    e.preventDefault();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedSenha = String(senha || '');
    const usuario = getUsuarios().find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail && String(u.senha || '') === normalizedSenha);
    if (!usuario) {
      setError('E-mail ou senha incorretos.');
      return;
    }
    setError('');
    if (setUsuarioLogado) setUsuarioLogado(usuario);
    try { localStorage.setItem('usuario-logado', JSON.stringify(usuario)); } catch (e) {}
    navigate('/');
  }

  // ToggleCar component imported from components/ToggleCar

  return (
    <>
      <MenuLogin />
      <div className="page-wrapper">
        <div className="page-content">
          <div className="page-root">
            <div className="login-card-outer">
          <div className="login-card">
            <div className="login-left">
              <div className="login-form-inner">
                <div className="login-section-title">Entrar</div>
                <div className="login-section-subtitle">Acesse sua conta para gerenciar pedidos e recursos</div>
                <form onSubmit={handleLogin} className="">
                  <div className="form-control w-full login-form-control">
                    <label className="sr-only">E-mail</label>
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="input input-bordered w-full bg-white text-black" autoComplete="username" />
                  </div>
                  <div className="form-control w-full login-form-control">
                    <label className="sr-only">Senha</label>
                    <div className="password-field">
                      <input id="senha" name="senha" type={showPasswordLogin ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} className="form-input password-input" placeholder="Senha" autoComplete="current-password" />
                      <ToggleCar on={showPasswordLogin} onClick={() => setShowPasswordLogin(s => !s)} />
                    </div>
                  </div>
                  <div className="login-forgot-wrapper"><a href="#" className="login-forgot-link" onClick={e => { e.preventDefault(); }}>Esqueci minha senha</a></div>
                  {error && <div className="text-red-600 text-center text-sm">{error}</div>}
                  <button type="submit" className="btn login-submit">Entrar</button>
                  <div className="login-signup-row">
                    <Link to="/cadastro" className="signup-link">Crie sua conta agora!</Link>
                  </div>
                </form>
              </div>
            </div>
            <div className="login-right" aria-hidden="true">
              <div className="login-hero" role="img" aria-label="Imagem ilustrativa de peças automotivas"></div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
