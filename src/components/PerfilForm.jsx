import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { apiService } from '../utils/apiService';
import ToggleCar from './ToggleCar';
import './ContatoForm.css';
import '../styles/pages/page-Login.css';
import './PerfilForm.css'; // Importado por último para ter precedência

export default function PerfilForm({
  formData = {},
  onChange = () => {},
  onSave = () => {},
  onCancel = () => {},
  showPassword = false,
  onToggleShowPassword = () => {}
}) {
  const { usuarioLogado, setUsuarioLogado } = useContext(AuthContext) || {};
  const [local, setLocal] = useState({
    nome: '',
    celular: '',
    email: '',
    senhaAtual: '',
    novaSenha: '',
    confirmNovaSenha: ''
  });
  const [showPasswordState, setShowPasswordState] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showConfirmNova, setShowConfirmNova] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (usuarioLogado) {
      setLocal({
        nome: usuarioLogado.nome || '',
        celular: usuarioLogado.celular || '',
        email: usuarioLogado.email || '',
        senhaAtual: '',
        novaSenha: '',
        confirmNovaSenha: ''
      });
    }
  }, [usuarioLogado]);

  function validateForm() {
    const newErrors = {};

    if (!local.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!local.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^\S+@\S+\.\S+$/.test(local.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!local.celular.trim()) {
      newErrors.celular = 'Celular é obrigatório';
    } else if (!/^\d{8,}$/.test(local.celular.replace(/\D/g, ''))) {
      newErrors.celular = 'Celular inválido';
    }

    // Validação de senha (apenas se campos de senha estão preenchidos)
    if (local.senhaAtual || local.novaSenha || local.confirmNovaSenha) {
      if (!local.senhaAtual) {
        newErrors.senhaAtual = 'Senha atual é obrigatória para alterar senha';
      }

      if (!local.novaSenha) {
        newErrors.novaSenha = 'Nova senha é obrigatória';
      } else if (local.novaSenha.length < 6) {
        newErrors.novaSenha = 'Nova senha deve ter pelo menos 6 caracteres';
      }

      if (local.novaSenha !== local.confirmNovaSenha) {
        newErrors.confirmNovaSenha = 'Confirmação de senha não confere';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

    function handleChange(e) {
    let { name, value } = e.target;
    // normalize hyphenated names to camelCase (e.g., senha-atual -> senhaAtual)
    if (name && name.includes('-')) {
      name = name.split('-').map((part, idx) => idx === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('');
    }
    let formattedValue = value;

    // Formatação do celular
  if (name === 'celular') {
      const digits = value.replace(/\D/g, '');
      let formatted = '';
      if (digits.length > 0) {
        formatted += '(' + digits.substring(0, 2);
        if (digits.length >= 2) {
          formatted += ') ';
          formatted += digits.substring(2, 7);
        }
        if (digits.length > 7) {
          formatted += '-' + digits.substring(7, 11);
        }
      }
      formattedValue = formatted;
    }

  setLocal(prev => ({ ...prev, [name]: formattedValue }));
    
    // Limpar erro específico quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    try { onChange({ target: { name, value: formattedValue } }); } catch (err) { /* ignore */ }
  }

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    // If the user provided senhaAtual, verify it server-side before proceeding
    if (local.senhaAtual) {
      try {
        // Resolve API base at runtime to avoid embedding development defaults into the bundle
        const base = (apiService && typeof apiService.getBaseUrl === 'function') ? apiService.getBaseUrl() : (typeof window !== 'undefined' && window.__API_BASE) ? window.__API_BASE : '';
        const resp = await fetch(`${base}/api/auth/verify-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: usuarioLogado.email, senha: local.senhaAtual })
        });
        if (!resp.ok) {
          if (resp.status === 401) {
            setErrors(prev => ({ ...prev, senhaAtual: 'Senha atual incorreta' }));
            return;
          }
          setErrors(prev => ({ ...prev, senhaAtual: 'Erro ao verificar senha atual' }));
          return;
        }
        const j = await resp.json();
        if (!j || !j.success) {
          setErrors(prev => ({ ...prev, senhaAtual: 'Senha atual incorreta' }));
          return;
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, senhaAtual: 'Erro ao verificar senha atual' }));
        return;
      }
    }

    if (!usuarioLogado) {
      alert('Erro: usuário não está logado');
      return;
    }

    try {
      // Prepare payload for server update
      const payload = {
        nome: local.nome,
        email: local.email,
        celular: local.celular,
      };
      if (local.novaSenha) payload.novaSenha = local.novaSenha;
      // include existing photoURL if present so backend can sync avatar
      if (usuarioLogado && usuarioLogado.photoURL) payload.photoURL = usuarioLogado.photoURL;

      const base = (apiService && typeof apiService.getBaseUrl === 'function') ? apiService.getBaseUrl() : (typeof window !== 'undefined' && window.__API_BASE) ? window.__API_BASE : '';
      let savedUser = null;
      let serverOk = false;
      try {
        const headers = { 'Content-Type': 'application/json' };
        // If we have an access token (from Firebase/Supabase verify), include it
        if (usuarioLogado && usuarioLogado.access_token) headers['Authorization'] = `Bearer ${usuarioLogado.access_token}`;
        const resp = await fetch(`${base}/api/users/${encodeURIComponent(usuarioLogado.id)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          serverOk = true;
          const j = await resp.json().catch(() => null);
          if (j && j.success && j.user) savedUser = j.user;
        } else {
          // ignore and fallback to local persistence
          console.warn('Profile save to server failed', resp.status);
        }
      } catch (err) {
        console.warn('Profile save to server threw', err && err.message ? err.message : err);
      }

  // If server returned updated user, prefer it. Otherwise construct from local + existing usuarioLogado
  const updatedUser = savedUser ? { ...usuarioLogado, ...savedUser } : { ...usuarioLogado, ...local };
  // Do NOT persist plaintext senha in localStorage. Keep password changes only on the server side.

      // Atualizar contexto
      setUsuarioLogado(updatedUser);
      
  // Persistir no localStorage but never include the password field
  const safeToPersist = { ...updatedUser };
  if (safeToPersist.senha) delete safeToPersist.senha;
  localStorage.setItem('usuario-logado', JSON.stringify(safeToPersist));
      
  // Atualizar lista de usuários (store without senha)
  const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const updatedUsuarios = usuarios.map(u => u.id === usuarioLogado.id ? safeToPersist : u);
  localStorage.setItem('usuarios', JSON.stringify(updatedUsuarios));

      // Limpar campos de senha
      setLocal(prev => ({
        ...prev,
        senhaAtual: '',
        novaSenha: '',
        confirmNovaSenha: ''
      }));

      if (serverOk) {
        alert('Dados salvos com sucesso!');
      } else {
        alert('Alterações salvas apenas localmente (servidor indisponível). A senha não foi atualizada no servidor.');
      }
      // Provide the caller with the updated user object but never include senha
      const outUser = { ...updatedUser };
      if (outUser.senha) delete outUser.senha;
      onSave(outUser);
    } catch (err) {
      alert('Erro ao salvar dados: ' + err.message);
    }
  }

  function handleCancel() {
    if (usuarioLogado) {
      setLocal({
        nome: usuarioLogado.nome || '',
        celular: usuarioLogado.celular || '',
        email: usuarioLogado.email || '',
        senhaAtual: '',
        novaSenha: '',
        confirmNovaSenha: ''
      });
    }
    setErrors({});
    try { onCancel(); } catch (err) { /* ignore */ }
  }

  function toggleShowPassword() {
    setShowPasswordState(!showPasswordState);
    try { onToggleShowPassword(); } catch (err) { /* ignore */ }
  }

  return (
    <div className="login-form-card">
      <div><h2 className="login-section-title">Informações Pessoais</h2></div>
      <form className="login-form">
          <div className="form-control w-full login-form-control">
            <input 
              id="nome" 
              name="nome" 
              type="text"
              value={local.nome} 
              onChange={handleChange} 
              className={`input input-bordered w-full bg-white text-black ${errors.nome ? 'error' : ''}`}
              placeholder="Nome Completo" 
              autoComplete="name"
            />
            {errors.nome && <span className="error-message">{errors.nome}</span>}
          </div>

          <div className="form-control w-full login-form-control">
            <input 
              id="celular" 
              name="celular" 
              type="tel"
              value={local.celular} 
              onChange={handleChange} 
              className={`input input-bordered w-full bg-white text-black ${errors.celular ? 'error' : ''}`}
              placeholder="Celular" 
              autoComplete="tel"
            />
            {errors.celular && <span className="error-message">{errors.celular}</span>}
          </div>

          <div className="form-control w-full login-form-control">
            <input 
              id="email" 
              name="email" 
              type="email"
              value={local.email} 
              onChange={handleChange} 
              className={`input input-bordered w-full bg-white text-black ${errors.email ? 'error' : ''}`}
              placeholder="E-mail" 
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Provider/link status: show when the logged user has an auth_id or provider hint */}
          {usuarioLogado && (usuarioLogado.auth_id || (usuarioLogado.providers && usuarioLogado.providers.includes && usuarioLogado.providers.includes('google'))) && (
            <div className="form-control w-full login-form-control" style={{marginTop:6}}>
              <div style={{padding:'8px',borderRadius:6,background:'#f3f7ff',border:'1px solid #e0e7ff'}}>
                <strong>Conexões de conta:</strong>
                <div style={{marginTop:6}}>Google: <span style={{fontWeight:700,color:'#1a73e8'}}>Conectado</span></div>
                <div style={{marginTop:6,fontSize:13}}>Se quiser desvincular a conta do Google, vá em <a href="/configuracoes">Configurações</a> ou contate o suporte.</div>
              </div>
            </div>
          )}

          <div className="form-control w-full login-form-control">
            <div className="password-field">
              <input 
                id="senha-atual" 
                name="senha-atual" 
                type={showSenhaAtual ? 'text' : 'password'} 
                value={local.senhaAtual} 
                onChange={handleChange} 
                className={`form-input password-input ${errors.senhaAtual ? 'error' : ''}`}
                placeholder="Senha atual" 
                autoComplete="current-password"
              />
              <ToggleCar on={showSenhaAtual} onClick={() => setShowSenhaAtual(s => !s)} ariaLabel={showSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'} />
            </div>
              {errors.senhaAtual && <span className="error-message">{errors.senhaAtual}</span>}
          </div>

          <div className="form-control w-full login-form-control">
            <div className="password-field">
              <input 
                id="nova-senha" 
                name="nova-senha" 
                type={showPasswordState ? 'text' : 'password'} 
                value={local.novaSenha} 
                onChange={handleChange} 
                className={`form-input password-input ${errors.novaSenha ? 'error' : ''}`}
                placeholder="Nova senha" 
                autoComplete="new-password"
              />
              <ToggleCar on={showPasswordState} onClick={toggleShowPassword} ariaLabel={showPasswordState ? 'Ocultar senha' : 'Mostrar senha'} />
            </div>
            {errors.novaSenha && <span className="error-message">{errors.novaSenha}</span>}
          </div>

          <div className="form-control w-full login-form-control">
            <div className="password-field">
              <input 
                id="confirm-nova-senha" 
                name="confirm-nova-senha" 
                type={showConfirmNova ? 'text' : 'password'} 
                value={local.confirmNovaSenha} 
                onChange={handleChange} 
                className={`form-input password-input ${errors.confirmNovaSenha ? 'error' : ''}`}
                placeholder="Confirmar nova senha" 
                autoComplete="new-password"
              />
              <ToggleCar on={showConfirmNova} onClick={() => setShowConfirmNova(s => !s)} ariaLabel={showConfirmNova ? 'Ocultar senha' : 'Mostrar senha'} />
            </div>
            {errors.confirmNovaSenha && <span className="error-message">{errors.confirmNovaSenha}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn login-submit" onClick={handleSave}>Salvar</button>
            <button type="button" className="btn btn-cancel" onClick={handleCancel}>Cancelar</button>
          </div>
      </form>
    </div>
  );
}
