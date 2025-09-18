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
  const [localStorageAvailable, setLocalStorageAvailable] = useState(true);

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
    console.log('[Debug] Login component mounted');
    const lsAvailable = testLocalStorage();
    console.log('[Debug] localStorage disponível?', lsAvailable);
    setLocalStorageAvailable(lsAvailable);
    
    if (!lsAvailable) {
      console.warn('[Debug] localStorage não disponível - usando apenas contas demo');
    }
    
    console.log('[Debug] Usuários iniciais:', getUsuarios().length);
    console.log('[Debug] Contas demo disponíveis:', usuariosDemoGlobais.length);
  }, []);

  function getUsuarios() {
    console.log('[Debug] getUsuarios iniciado');
    
    let usuarios = [];
    
    // Sempre incluir contas demo (funcionam para todos)
    usuarios = [...usuariosDemoGlobais];
    console.log('[Debug] Contas demo adicionadas:', usuarios.length);
    
    // Tentar adicionar usuários do localStorage se disponível
    try {
      const raw = localStorage.getItem('usuarios');
      console.log('[Debug] localStorage raw data:', !!raw);
      
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log('[Debug] Usuários do localStorage:', parsed.length);
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
      console.log('[Debug] Seed data disponível:', seedData.length);
      usuarios = usuarios.concat(seedData);
    } catch (e) {
      console.error('[Debug] Erro ao processar seed data:', e);
    }
    
    console.log('[Debug] Total de usuários disponíveis:', usuarios.length);
    return usuarios;
  }

  function saveUsuario(novoUsuario) {
    console.log('[Debug] saveUsuario iniciado');
    
    if (!localStorageAvailable) {
      console.warn('[Debug] localStorage não disponível - registro temporário apenas');
      alert('⚠️ Seu navegador não permite salvar dados.\nSeu registro será temporário. Use uma das contas demo para testes permanentes.');
      return novoUsuario;
    }
    
    // Obter apenas usuários do localStorage (excluir demos e seeds)
    let usuariosLS = [];
    try {
      const raw = localStorage.getItem('usuarios');
      if (raw) {
        usuariosLS = JSON.parse(raw);
      }
    } catch (e) {
      console.error('[Debug] Erro ao ler localStorage existente:', e);
    }
    
    console.log('[Debug] Usuários do localStorage antes de salvar:', usuariosLS.length);
    
    const normalized = {
      ...novoUsuario,
      email: String(novoUsuario.email || '').trim().toLowerCase(),
      celular: String(novoUsuario.celular || '').replace(/\D/g, '')
    };
    
    const updated = [...usuariosLS, normalized];
    console.log('[Debug] Lista atualizada com novo usuário:', updated.length);
    
    try { 
      const serialized = JSON.stringify(updated);
      localStorage.setItem('usuarios', serialized);
      console.log('[Debug] Dados salvos no localStorage com sucesso');
      
      // Verificar se realmente foi salvo
      const verification = localStorage.getItem('usuarios');
      if (verification) {
        const parsed = JSON.parse(verification);
        console.log('[Debug] Verificação - usuários salvos:', parsed.length);
      } else {
        console.warn('[Debug] Falha na verificação - dados não encontrados no localStorage');
      }
    } catch (e) {
      console.error('[Debug] Erro ao salvar no localStorage:', e);
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
    try { localStorage.setItem('usuarioLogado', JSON.stringify(usuario)); } catch (e) {}
    navigate('/');
  }

  function handleRegister(e) {
    e.preventDefault();
    console.log('[Debug] Iniciando registro:', { regNome, regEmail, regCelular: regCelular.replace(/\D/g, '') });
    
    if (!regNome || !regSenha || !regEmail || !regCelular || !regConfirmSenha) {
      console.log('[Debug] Campos em branco:', { regNome, regEmail, regCelular, regSenha: !!regSenha, regConfirmSenha: !!regConfirmSenha });
      setRegError('Preencha todos os campos.');
      return;
    }
    
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(regEmail)) {
      console.log('[Debug] E-mail inválido:', regEmail);
      setRegError('E-mail inválido. Use o formato: exemplo@dominio.com');
      return;
    }
    
    const cleanCelular = regCelular.replace(/\D/g, '');
    console.log('[Debug] Celular limpo:', cleanCelular, 'Válido?', /^\d{10,11}$/.test(cleanCelular));
    if (!/^\d{10,11}$/.test(cleanCelular)) {
      setRegError('Celular inválido (deve ter 10 ou 11 dígitos).');
      return;
    }
    
    if (regSenha.length < 4) {
      console.log('[Debug] Senha muito curta:', regSenha.length);
      setRegError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    
    if (regSenha !== regConfirmSenha) {
      console.log('[Debug] Senhas não coincidem');
      setRegError('As senhas não coincidem.');
      return;
    }
    
    const normalizedRegEmail = String(regEmail || '').trim().toLowerCase();
    const existingUsers = getUsuarios();
    console.log('[Debug] Usuários existentes:', existingUsers.length);
    
    if (existingUsers.some(u => String(u.email || '').trim().toLowerCase() === normalizedRegEmail)) {
      console.log('[Debug] E-mail já existe:', normalizedRegEmail);
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
    
    console.log('[Debug] Criando novo usuário:', { ...novoUsuario, senha: '***' });
    
    try {
      const savedUser = saveUsuario(novoUsuario);
      console.log('[Debug] Usuário salvo com sucesso:', { ...savedUser, senha: '***' });
      
      setRegError('');
      setRegNome(''); setRegCelular(''); setRegEmail(''); setRegSenha(''); setRegConfirmSenha('');
      alert('Registro realizado com sucesso! Agora faça login com suas credenciais.');
    } catch (error) {
      console.error('[Debug] Erro ao salvar usuário:', error);
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
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 8c0-1.1-.9-2-2-2h-2l-1-2c-.5-.9-1.4-1.5-2.4-1.5H11.4c-1 0-1.9.6-2.4 1.5l-1 2H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h1v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h12v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h1c1.1 0 2-.9 2-2V8z" fill={on ? '#3B82F6' : '#4A5568'} className="car-body"/>
        <path d="M24 6H8l1.5-1.5c.3-.3.7-.5 1.1-.5h9.8c.4 0 .8.2 1.1.5L24 6z" fill={on ? '#1E40AF' : '#2D3748'} className="car-roof"/>
        <path d="M10.5 4.5L9 6h3l1-1.5h-2.5z" fill="#63B3ED" opacity="0.3"/>
        <circle cx="9" cy="16" r="2.5" fill="#2D3748"/>
        <circle cx="9" cy="16" r="1.5" fill={on ? '#60A5FA' : '#718096'} className="wheel-rim"/>
        <circle cx="23" cy="16" r="2.5" fill="#2D3748"/>
        <circle cx="23" cy="16" r="1.5" fill={on ? '#60A5FA' : '#718096'} className="wheel-rim"/>
        <rect x="4" y="9" width="2" height="4" fill={on ? '#1E40AF' : '#2D3748'} className="car-grille"/>
        <circle cx="5" cy="10" r="2" fill={on ? '#FED7AA' : '#E2E8F0'} className="headlight-main"/>
        {on && (
          <>
            <ellipse cx="2" cy="10" rx="4" ry="6" fill="#FED7AA" opacity="0.15" className="headlight-beam"/>
            <circle cx="5" cy="10" r="2.8" fill="#FBBF24" opacity="0.25" className="headlight-glow-1"/>
            <circle cx="5" cy="10" r="2.2" fill="#F59E0B" opacity="0.4" className="headlight-glow-2"/>
            <circle cx="5" cy="10" r="1.3" fill="#FCD34D" className="headlight-bright"/>
            <g className="headlight-rays" stroke="#FDE68A" strokeWidth="0.8" strokeLinecap="round" opacity="0.95">
              <line x1="7" y1="9" x2="11" y2="7" className="ray ray-1" />
              <line x1="7" y1="10" x2="12" y2="10" className="ray ray-2" />
              <line x1="7" y1="11" x2="11" y2="13" className="ray ray-3" />
              <line x1="6" y1="8.2" x2="9" y2="6" className="ray ray-4" />
              <line x1="6" y1="11.8" x2="9" y2="14" className="ray ray-5" />
            </g>
          </>
        )}
        <circle cx="5" cy="13.5" r="0.8" fill={on ? '#FEF3C7' : '#CBD5E0'}/>
        <rect x="15" y="11" width="1" height="0.5" fill={on ? '#1E40AF' : '#2D3748'} className="door-handle"/>
        <ellipse cx="7.5" cy="8.5" rx="0.8" ry="0.5" fill={on ? '#3B82F6' : '#4A5568'} className="side-mirror"/>
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
          
          {/* Alerta sobre localStorage e contas demo */}
          {!localStorageAvailable && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Modo Limitado:</strong> Seu navegador não permite salvar dados localmente. 
                    Use uma das contas demo abaixo para testar o sistema!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lista de contas demo - sempre visível */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">🧪 Contas Demo Disponíveis:</h3>
            <div className="space-y-2">
              {usuariosDemoGlobais.map((user, index) => (
                <div key={user.id} className="bg-white p-3 rounded border text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong>{user.nome}</strong><br />
                      <span className="text-gray-600">E-mail: {user.email}</span><br />
                      <span className="text-gray-600">Senha: {user.senha}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setEmail(user.email);
                        setSenha(user.senha);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Usar Esta Conta
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              💡 <strong>Dica:</strong> Essas contas funcionam em qualquer navegador/dispositivo e são ideais para demonstrações!
            </p>
          </div>
          
          <div className="login-forms-row">
            <div className="login-form-card">
              <div><h2 className="login-section-title">Entrar</h2></div>
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-control w-full login-form-control">
                  <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="input input-bordered w-full bg-white text-black" autoComplete="username" />
                </div>
                <div className="form-control w-full Login-form-control">
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
                <div className="form-control w-full Login-form-control">
                  <input type="tel" placeholder="Celular" value={regCelular} onChange={e => setRegCelular(formatCelular(e.target.value))} className="input input-bordered w-full bg-white text-black" autoComplete="tel" />
                </div>
                <div className="form-control w-full Login-form-control">
                  <input type="email" placeholder="E-mail" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="input input-bordered w-full bg-white text-black" autoComplete="email" />
                </div>
                <div className="form-control w-full Login-form-control">
                  <div className="password-field">
                    <input type={showPasswordRegister ? 'text' : 'password'} placeholder="Senha" value={regSenha} onChange={e => setRegSenha(e.target.value)} className="form-input password-input" autoComplete="new-password" />
                    <ToggleCar on={showPasswordRegister} onClick={() => setShowPasswordRegister(s => !s)} />
                  </div>
                </div>
                <div className="form-control w-full Login-form-control">
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
