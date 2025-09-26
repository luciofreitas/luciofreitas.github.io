import React, { useState } from 'react';
import ToggleCar from './components/ToggleCar';
import MenuLogin from './components/MenuLogin';
import './page-Cadastro.css';

export default function PageCadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmSenha, setShowConfirmSenha] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate() {
    const e = {};
    if (!nome || !nome.trim()) e.nome = 'Nome é obrigatório.';
    if (!email || !email.trim()) e.email = 'E-mail é obrigatório.';
    else if (!emailRegex.test(email)) e.email = 'E-mail inválido.';
    if (!senha) e.senha = 'Senha é obrigatória.';
    else if (senha.length < 6) e.senha = 'Senha deve ter pelo menos 6 caracteres.';
    if (senha !== confirmSenha) e.confirmSenha = 'As senhas não conferem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    setSuccess('');
    if (!validate()) return;

    // Simular persistência em localStorage (clientes estáticos)
    try {
      const key = 'usuarios';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({ nome: nome.trim(), email: email.trim(), senha, criadoEm: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(existing));
      setSuccess('Cadastro realizado com sucesso!');
      setNome('');
      setEmail('');
      setSenha('');
      setConfirmSenha('');
      setErrors({});
    } catch (err) {
      setErrors({ form: 'Erro ao salvar os dados localmente. Verifique o console.' });
      // eslint-disable-next-line no-console
      console.error('Erro salvando usuário:', err);
    }
  }

  return (
    <>
      <MenuLogin />
      <main className="cadastro-page">
        <section className="cadastro-card">
        <h1 className="cadastro-title">Cadastro</h1>
        <p className="cadastro-sub">Crie sua conta para acessar recursos adicionais</p>

        <form className="cadastro-form" onSubmit={handleSubmit} noValidate>
          {errors.form && <div className="form-error">{errors.form}</div>}

          <label className="field">
            <span className="label">Nome completo</span>
            <input
              className={`input ${errors.nome ? 'input-error' : ''}`}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? 'err-nome' : undefined}
            />
            {errors.nome && <div id="err-nome" className="error">{errors.nome}</div>}
          </label>

          <label className="field">
            <span className="label">E-mail</span>
            <input
              className={`input ${errors.email ? 'input-error' : ''}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@exemplo.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'err-email' : undefined}
            />
            {errors.email && <div id="err-email" className="error">{errors.email}</div>}
          </label>

          <label className="field">
            <span className="label">Senha</span>
            <div className="password-field">
              <input
                className={`input password-input ${errors.senha ? 'input-error' : ''}`}
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Crie uma senha"
                aria-invalid={!!errors.senha}
                aria-describedby={errors.senha ? 'err-senha' : undefined}
              />
              <ToggleCar on={showSenha} onClick={() => setShowSenha((s) => !s)} ariaLabel={showSenha ? 'Ocultar senha' : 'Mostrar senha'} />
            </div>
            {errors.senha && <div id="err-senha" className="error">{errors.senha}</div>}
          </label>

          <label className="field field-password">
            <span className="label">Confirmar senha</span>
            <div className="password-field">
              <input
                className={`input password-input ${errors.confirmSenha ? 'input-error' : ''}`}
                type={showConfirmSenha ? 'text' : 'password'}
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                placeholder="Repita a senha"
                aria-invalid={!!errors.confirmSenha}
                aria-describedby={errors.confirmSenha ? 'err-confirm' : undefined}
              />
              <ToggleCar on={showConfirmSenha} onClick={() => setShowConfirmSenha((s) => !s)} ariaLabel={showConfirmSenha ? 'Ocultar senha' : 'Mostrar senha'} />
            </div>
            {errors.confirmSenha && <div id="err-confirm" className="error">{errors.confirmSenha}</div>}
          </label>

          <button className="submit" type="submit">Criar conta</button>

          {success && <div className="success">{success}</div>}
        </form>
      </section>
    </main>
    </>
  );
}
