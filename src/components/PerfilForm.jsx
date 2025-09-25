import React, { useState, use-effect, useContext } from 'react';
import { AuthContext } from '../App';
import './ContatoForm.css';
import '../page-Login.css';
import './PerfilForm.css'; // Importado por último para ter precedência

export default function PerfilForm({
  form-data = {},
  onChange = () => {},
  onSave = () => {},
  onCancel = () => {},
  showPassword = false,
  onToggleShowPassword = () => {}
}) {
  const { usuario-logado, setUsuarioLogado } = useContext(AuthContext);
  const [local, setLocal] = useState({
    nome: '',
    celular: '',
    email: '',
    senha-atual: '',
    nova-senha: '',
    confirm-nova-senha: ''
  });
  const [showPasswordState, setShowPasswordState] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showConfirmNova, setShowConfirmNova] = useState(false);
  const [errors, setErrors] = useState({});

  use-effect(() => {
    if (usuario-logado) {
      setLocal({
        nome: usuario-logado.nome || '',
        celular: usuario-logado.celular || '',
        email: usuario-logado.email || '',
        senha-atual: '',
        nova-senha: '',
        confirm-nova-senha: ''
      });
    }
  }, [usuario-logado]);

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
    if (local.senha-atual || local.nova-senha || local.confirm-nova-senha) {
      if (!local.senha-atual) {
        newErrors.senha-atual = 'Senha atual é obrigatória para alterar senha';
      } else if (usuario-logado && local.senha-atual !== usuario-logado.senha) {
        newErrors.senha-atual = 'Senha atual incorreta';
      }

      if (!local.nova-senha) {
        newErrors.nova-senha = 'Nova senha é obrigatória';
      } else if (local.nova-senha.length < 6) {
        newErrors.nova-senha = 'Nova senha deve ter pelo menos 6 caracteres';
      }

      if (local.nova-senha !== local.confirm-nova-senha) {
        newErrors.confirm-nova-senha = 'Confirmação de senha não confere';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
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

  function handleSave() {
    if (!validateForm()) {
      return;
    }

    if (!usuario-logado) {
      alert('Erro: usuário não está logado');
      return;
    }

    try {
      const updatedUser = { ...usuario-logado, ...local };
      if (local.nova-senha) {
        updatedUser.senha = local.nova-senha;
      }

      // Atualizar contexto
      setUsuarioLogado(updatedUser);
      
      // Persistir no localStorage
      localStorage.set-item('usuario-logado', JSON.stringify(updatedUser));
      
      // Atualizar lista de usuários
      const usuarios = JSON.parse(localStorage.get-item('usuarios') || '[]');
      const updatedUsuarios = usuarios.map(u => u.id === usuario-logado.id ? updatedUser : u);
      localStorage.set-item('usuarios', JSON.stringify(updatedUsuarios));

      // Limpar campos de senha
      setLocal(prev => ({
        ...prev,
        senha-atual: '',
        nova-senha: '',
        confirm-nova-senha: ''
      }));

      alert('Dados salvos com sucesso!');
      
      onSave(updatedUser);
    } catch (err) {
      alert('Erro ao salvar dados: ' + err.message);
    }
  }

  function handleCancel() {
    if (usuario-logado) {
      setLocal({
        nome: usuario-logado.nome || '',
        celular: usuario-logado.celular || '',
        email: usuario-logado.email || '',
        senha-atual: '',
        nova-senha: '',
        confirm-nova-senha: ''
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

          <div className="form-control w-full login-form-control">
            <div className="password-field">
              <input 
                id="senha-atual" 
                name="senha-atual" 
                type={showSenhaAtual ? 'text' : 'password'} 
                value={local.senha-atual} 
                onChange={handleChange} 
                className={`form-input password-input ${errors.senha-atual ? 'error' : ''}`}
                placeholder="Senha atual" 
                autoComplete="current-password"
              />
              <span
                className={`car-toggle ${showSenhaAtual ? 'headlight-on' : 'headlight-off'}`}
                role="button"
                tabIndex={0}
                on-click={() => setShowSenhaAtual(s => !s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowSenhaAtual(s => !s); }}
                aria-label={showSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M28 8c0-1.1-.9-2-2-2h-2l-1-2c-.5-.9-1.4-1.5-2.4-1.5-h11.4c-1 0-1.9.6-2.4 1.5l-1 2H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h1v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h12v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h1c1.1 0 2-.9 2-2V8z" fill={showSenhaAtual ? '#3B82F6' : '#4A5568'} className="car-body"/>
                  <path d="M24 6H8l1.5-1.5c.3-.3.7-.5 1.1-.5h9.8c.4 0 .8.2 1.1.5-l24 6z" fill={showSenhaAtual ? '#1E40AF' : '#2D3748'} className="car-roof"/>
                  <path d="M10.5 4.5-l9 6h3l1-1.5h-2.5z" fill="#63B3ED" opacity="0.3"/>
                  <circle cx="9" cy="16" r="2.5" fill="#2D3748"/>
                  <circle cx="9" cy="16" r="1.5" fill={showSenhaAtual ? '#60A5FA' : '#718096'} className="wheel-rim"/>
                  <circle cx="23" cy="16" r="2.5" fill="#2D3748"/>
                  <circle cx="23" cy="16" r="1.5" fill={showSenhaAtual ? '#60A5FA' : '#718096'} className="wheel-rim"/>
                  <rect x="4" y="9" width="2" height="4" fill={showSenhaAtual ? '#1E40AF' : '#2D3748'} className="car-grille"/>
                  <circle cx="5" cy="10" r="2" fill={showSenhaAtual ? '#FED7AA' : '#E2E8F0'} className="headlight-main"/>
                  {showSenhaAtual && (
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
                  <circle cx="5" cy="13.5" r="0.8" fill={showSenhaAtual ? '#FEF3C7' : '#CBD5E0'}/>
                  <rect x="15" y="11" width="1" height="0.5" fill={showSenhaAtual ? '#1E40AF' : '#2D3748'} className="door-handle"/>
                  <ellipse cx="7.5" cy="8.5" rx="0.8" ry="0.5" fill={showSenhaAtual ? '#3B82F6' : '#4A5568'} className="side-mirror"/>
                </svg>
              </span>
            </div>
            {errors.senha-atual && <span className="error-message">{errors.senha-atual}</span>}
          </div>

          <div className="form-control w-full login-form-control">
            <div className="password-field">
              <input 
                id="nova-senha" 
                name="nova-senha" 
                type={showPasswordState ? 'text' : 'password'} 
                value={local.nova-senha} 
                onChange={handleChange} 
                className={`form-input password-input ${errors.nova-senha ? 'error' : ''}`}
                placeholder="Nova senha" 
                autoComplete="new-password"
              />
              <span
                className={`car-toggle ${showPasswordState ? 'headlight-on' : 'headlight-off'}`}
                role="button"
                tabIndex={0}
                on-click={toggleShowPassword}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleShowPassword(); }}
                aria-label={showPasswordState ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M28 8c0-1.1-.9-2-2-2h-2l-1-2c-.5-.9-1.4-1.5-2.4-1.5-h11.4c-1 0-1.9.6-2.4 1.5l-1 2H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h1v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h12v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h1c1.1 0 2-.9 2-2V8z" fill={showPasswordState ? '#3B82F6' : '#4A5568'} className="car-body"/>
                  <path d="M24 6H8l1.5-1.5c.3-.3.7-.5 1.1-.5h9.8c.4 0 .8.2 1.1.5-l24 6z" fill={showPasswordState ? '#1E40AF' : '#2D3748'} className="car-roof"/>
                  <path d="M10.5 4.5-l9 6h3l1-1.5h-2.5z" fill="#63B3ED" opacity="0.3"/>
                  <circle cx="9" cy="16" r="2.5" fill="#2D3748"/>
                  <circle cx="9" cy="16" r="1.5" fill={showPasswordState ? '#60A5FA' : '#718096'} className="wheel-rim"/>
                  <circle cx="23" cy="16" r="2.5" fill="#2D3748"/>
                  <circle cx="23" cy="16" r="1.5" fill={showPasswordState ? '#60A5FA' : '#718096'} className="wheel-rim"/>
                  <rect x="4" y="9" width="2" height="4" fill={showPasswordState ? '#1E40AF' : '#2D3748'} className="car-grille"/>
                  <circle cx="5" cy="10" r="2" fill={showPasswordState ? '#FED7AA' : '#E2E8F0'} className="headlight-main"/>
                  {showPasswordState && (
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
                  <circle cx="5" cy="13.5" r="0.8" fill={showPasswordState ? '#FEF3C7' : '#CBD5E0'}/>
                  <rect x="15" y="11" width="1" height="0.5" fill={showPasswordState ? '#1E40AF' : '#2D3748'} className="door-handle"/>
                  <ellipse cx="7.5" cy="8.5" rx="0.8" ry="0.5" fill={showPasswordState ? '#3B82F6' : '#4A5568'} className="side-mirror"/>
                </svg>
              </span>
            </div>
            {errors.nova-senha && <span className="error-message">{errors.nova-senha}</span>}
          </div>

          <div className="form-control w-full login-form-control">
            <div className="password-field">
              <input 
                id="confirm-nova-senha" 
                name="confirm-nova-senha" 
                type={showConfirmNova ? 'text' : 'password'} 
                value={local.confirm-nova-senha} 
                onChange={handleChange} 
                className={`form-input password-input ${errors.confirm-nova-senha ? 'error' : ''}`}
                placeholder="Confirmar nova senha" 
                autoComplete="new-password"
              />
              <span
                className={`car-toggle ${showConfirmNova ? 'headlight-on' : 'headlight-off'}`}
                role="button"
                tabIndex={0}
                on-click={() => setShowConfirmNova(s => !s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowConfirmNova(s => !s); }}
                aria-label={showConfirmNova ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M28 8c0-1.1-.9-2-2-2h-2l-1-2c-.5-.9-1.4-1.5-2.4-1.5-h11.4c-1 0-1.9.6-2.4 1.5l-1 2H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h1v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h12v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h1c1.1 0 2-.9 2-2V8z" fill={showConfirmNova ? '#3B82F6' : '#4A5568'} className="car-body"/>
                  <path d="M24 6H8l1.5-1.5c.3-.3.7-.5 1.1-.5h9.8c.4 0 .8.2 1.1.5-l24 6z" fill={showConfirmNova ? '#1E40AF' : '#2D3748'} className="car-roof"/>
                  <path d="M10.5 4.5-l9 6h3l1-1.5h-2.5z" fill="#63B3ED" opacity="0.3"/>
                  <circle cx="9" cy="16" r="2.5" fill="#2D3748"/>
                  <circle cx="9" cy="16" r="1.5" fill={showConfirmNova ? '#60A5FA' : '#718096'} className="wheel-rim"/>
                  <circle cx="23" cy="16" r="2.5" fill="#2D3748"/>
                  <circle cx="23" cy="16" r="1.5" fill={showConfirmNova ? '#60A5FA' : '#718096'} className="wheel-rim"/>
                  <rect x="4" y="9" width="2" height="4" fill={showConfirmNova ? '#1E40AF' : '#2D3748'} className="car-grille"/>
                  <circle cx="5" cy="10" r="2" fill={showConfirmNova ? '#FED7AA' : '#E2E8F0'} className="headlight-main"/>
                  {showConfirmNova && (
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
                  <circle cx="5" cy="13.5" r="0.8" fill={showConfirmNova ? '#FEF3C7' : '#CBD5E0'}/>
                  <rect x="15" y="11" width="1" height="0.5" fill={showConfirmNova ? '#1E40AF' : '#2D3748'} className="door-handle"/>
                  <ellipse cx="7.5" cy="8.5" rx="0.8" ry="0.5" fill={showConfirmNova ? '#3B82F6' : '#4A5568'} className="side-mirror"/>
                </svg>
              </span>
            </div>
            {errors.confirm-nova-senha && <span className="error-message">{errors.confirm-nova-senha}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn w-full login-submit" on-click={handleSave}>Salvar</button>
            <button type="button" className="btn w-full btn-cancel" on-click={handleCancel}>Cancelar</button>
          </div>
      </form>
    </div>
  );
}
