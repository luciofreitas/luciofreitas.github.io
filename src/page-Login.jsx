import React, { useState, useContext, useEffect } from 'react';
import MenuLogin from './components/MenuLogin';
// Removido import './components/Menu.css' - não é necessário e causa conflito de cores
import './page-Login.css';
import usuariosData from './usuarios.json';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './App';

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

  const [regNome, setRegNome] = useState('');
  const [regCelular, setRegCelular] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regConfirmSenha, setRegConfirmSenha] = useState('');
  const [regError, setRegError] = useState('');

  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordRegister, setShowPasswordRegister] = useState(false);
  const [showPasswordConfirmRegister, setShowPasswordConfirmRegister] = useState(false);

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
    
    // Obter apenas usuários do localStorage (excluir demos e seeds)
    let usuariosLs = [];
    try {
      const raw = localStorage.getItem('usuarios');
      if (raw) {
        usuariosLs = JSON.parse(raw);
      }
    } catch (e) {
      console.error('[Debug] Erro ao ler localStorage existente:', e);
      return novoUsuario; // Falha silenciosa
    }
    
    
    
    const normalized = {
      ...novoUsuario,
      email: String(novoUsuario.email || '').trim().toLowerCase(),
      celular: String(novoUsuario.celular || '').replace(/\D/g, '')
    };
    
    const updated = [...usuariosLs, normalized];
    
    
    try { 
      const serialized = JSON.stringify(updated);
      localStorage.setItem('usuarios', serialized);
      // Verificação opcional.
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
      throw e;
    }
    
    return normalized;
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

  function handleRegister(e) {
    e.preventDefault();
    
    if (!regNome || !regSenha || !regEmail || !regCelular || !regConfirmSenha) {
      setRegError('Preencha todos os campos.');
      return;
    }
    
    // email regex: allow common email characters and require a TLD of at least 2 letters
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(regEmail)) {
      setRegError('E-mail inválido. Use o formato: exemplo@dominio.com');
      return;
    }
    
    const cleanCelular = regCelular.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(cleanCelular)) {
      setRegError('Celular inválido (deve ter 10 ou 11 dígitos).');
      return;
    }
    
    if (regSenha.length < 4) {
      setRegError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    
    if (regSenha !== regConfirmSenha) {
      setRegError('As senhas não coincidem.');
      return;
    }
    
    const normalizedRegEmail = String(regEmail || '').trim().toLowerCase();
  const existingUsers = getUsuarios();
    
    if (existingUsers.some(u => String(u.email || '').trim().toLowerCase() === normalizedRegEmail)) {
      setRegError('Já existe um usuário com este e-mail.');
      return;
    }
    
    const id = Date.now();
    const novoUsuario = {
      id,
      nome: regNome,
      celular: cleanCelular,
      email: normalizedRegEmail,
      senha: regSenha
    };
    
    
    try {
  const savedUser = saveUsuario(novoUsuario);
      
      setRegError('');
      setRegNome(''); setRegCelular(''); setRegEmail(''); setRegSenha(''); setRegConfirmSenha('');
      alert('Registro realizado com sucesso! Agora faça login com suas credenciais.');
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setRegError('Erro ao salvar usuário. Tente novamente.');
    }
  }

  function formatCelular(value) {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) {
      formatted += '(' + digits.substring(0, 2);
      if (digits.length >= 2) {
        formatted += ') ' + digits.substring(2, 7);
      }
      if (digits.length > 7) {
        formatted += '-' + digits.substring(7, 11);
      }
    }
    return formatted;
  }

  const ToggleCar = ({ on, onClick }) => (
    <span
      className={`car-toggle ${on ? 'headlight-on' : 'headlight-off'}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
  aria-label={on ? 'Ocultar senha' : 'Mostrar senha'}
    >
      <svg width="32" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: on ? '#3B82F6' : '#4A5568' }}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="currentColor" />
        <circle cx="12" cy="12" r="3" fill={on ? '#FFFFFF' : '#CBD5E0'} />
      </svg>
    </span>
  );

  return (
    <>
    <MenuLogin />
    <div className="page-root">
      <div className="page-wrapper login-page-wrapper">
        <div className="page-content login-content-container">
          <h2 className="page-heading login-heading page-title">Faça o Login ou Cadastro</h2>
          
          <div className="login-forms-row">
            <div className="login-form-card">
              <div><h2 className="login-section-title">Entrar</h2></div>
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-control w-full login-form-control">
                  <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="input input-bordered w-full bg-white text-black" autoComplete="username" />
                </div>
                <div className="form-control w-full login-form-control">
                  <div className="password-field">
                    <input id="senha" name="senha" type={showPasswordLogin ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} className="form-input password-input" placeholder="Senha" autoComplete="current-password" />
                    <ToggleCar on={showPasswordLogin} onClick={() => setShowPasswordLogin(s => !s)} />
                  </div>
                </div>
                <div className="login-forgot-wrapper"><a href="#" className="login-forgot-link" onClick={e => { e.preventDefault(); }}>Esqueci minha senha</a></div>
                {error && <div className="text-red-600 text-center text-sm">{error}</div>}
                <button type="submit" className="btn w-full login-submit">Entrar</button>
              </form>
            </div>

            <div className="login-form-card">
              <div><h2 className="login-section-title">Registrar</h2></div>
              <form onSubmit={handleRegister} className="login-form">
                <div className="form-control w-full login-form-control">
                  <input type="text" placeholder="Nome Completo" value={regNome} onChange={e => setRegNome(e.target.value)} className="input input-bordered w-full bg-white text-black" autoComplete="name" />
                </div>
                <div className="form-control w-full login-form-control">
                  <input type="tel" placeholder="Celular" value={regCelular} onChange={e => setRegCelular(formatCelular(e.target.value))} className="input input-bordered w-full bg-white text-black" autoComplete="tel" />
                </div>
                <div className="form-control w-full login-form-control">
                  <input type="email" placeholder="E-mail" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="input input-bordered w-full bg-white text-black" autoComplete="email" />
                </div>
                <div className="form-control w-full login-form-control">
                  <div className="password-field">
                    <input type={showPasswordRegister ? 'text' : 'password'} placeholder="Senha" value={regSenha} onChange={e => setRegSenha(e.target.value)} className="form-input password-input" autoComplete="new-password" />
                    <ToggleCar on={showPasswordRegister} onClick={() => setShowPasswordRegister(s => !s)} />
                  </div>
                </div>
                <div className="form-control w-full login-form-control">
                  <div className="password-field">
                    <input type={showPasswordConfirmRegister ? 'text' : 'password'} placeholder="Confirmar Senha" value={regConfirmSenha} onChange={e => setRegConfirmSenha(e.target.value)} className="form-input password-input" autoComplete="new-password" />
                    <ToggleCar on={showPasswordConfirmRegister} onClick={() => setShowPasswordConfirmRegister(s => !s)} />
                  </div>
                </div>
                {regError && <div className="text-red-600 text-center text-sm">{regError}</div>}
                <button type="submit" className="btn w-full login-submit">Registrar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
