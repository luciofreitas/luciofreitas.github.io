import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import './ContatoForm.css';
import '../page-Login.css';
import './PerfilForm.css'; // Importado por último para ter precedência

export default function PerfilForm({
  formData = {},
  onChange = () => {},
  onSave = () => {},
  onCancel = () => {},
  showPassword = false,
  onToggleShowPassword = () => {}
}) {
  const { usuarioLogado, setUsuarioLogado } = useContext(AuthContext);
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
      } else if (usuarioLogado && local.senhaAtual !== usuarioLogado.senha) {
        newErrors.senhaAtual = 'Senha atual incorreta';
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

  function handleSave() {
    if (!validateForm()) {
      return;
    }

    if (!usuarioLogado) {
      alert('Erro: usuário não está logado');
      return;
    }

    try {
      const updatedUser = { ...usuarioLogado, ...local };
      if (local.novaSenha) {
        updatedUser.senha = local.novaSenha;
      }

      // Atualizar contexto
      setUsuarioLogado(updatedUser);
      
      // Persistir no localStorage
      localStorage.setItem('usuario-logado', JSON.stringify(updatedUser));
      
      // Atualizar lista de usuários
      const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
      const updatedUsuarios = usuarios.map(u => u.id === usuarioLogado.id ? updatedUser : u);
      localStorage.setItem('usuarios', JSON.stringify(updatedUsuarios));

      // Limpar campos de senha
      setLocal(prev => ({
        ...prev,
        senhaAtual: '',
        novaSenha: '',
        confirmNovaSenha: ''
      }));

      alert('Dados salvos com sucesso!');
      
      onSave(updatedUser);
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
              <span
                className={`car-toggle ${showSenhaAtual ? 'headlight-on' : 'headlight-off'}`}
                role="button"
                tabIndex={0}
                onClick={() => setShowSenhaAtual(s => !s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowSenhaAtual(s => !s); }}
                aria-label={showSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg width="32" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: showSenhaAtual ? '#3B82F6' : '#4A5568' }}>
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="currentColor" />
                  <circle cx="12" cy="12" r="3" fill={showSenhaAtual ? '#FFFFFF' : '#CBD5E0'} />
                </svg>
              </span>
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
              <span
                className={`car-toggle ${showPasswordState ? 'headlight-on' : 'headlight-off'}`}
                role="button"
                tabIndex={0}
                onClick={toggleShowPassword}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleShowPassword(); }}
                aria-label={showPasswordState ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg width="32" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: showPasswordState ? '#3B82F6' : '#4A5568' }}>
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="currentColor" />
                  <circle cx="12" cy="12" r="3" fill={showPasswordState ? '#FFFFFF' : '#CBD5E0'} />
                </svg>
              </span>
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
              <span
                className={`car-toggle ${showConfirmNova ? 'headlight-on' : 'headlight-off'}`}
                role="button"
                tabIndex={0}
                onClick={() => setShowConfirmNova(s => !s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowConfirmNova(s => !s); }}
                aria-label={showConfirmNova ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg width="32" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: showConfirmNova ? '#3B82F6' : '#4A5568' }}>
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="currentColor" />
                  <circle cx="12" cy="12" r="3" fill={showConfirmNova ? '#FFFFFF' : '#CBD5E0'} />
                </svg>
              </span>
            </div>
            {errors.confirmNovaSenha && <span className="error-message">{errors.confirmNovaSenha}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn w-full login-submit" onClick={handleSave}>Salvar</button>
            <button type="button" className="btn w-full btn-cancel" onClick={handleCancel}>Cancelar</button>
          </div>
      </form>
    </div>
  );
}
