import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Cookie, Eye, EyeOff, Lock, User } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setCarregando(true)
    setTimeout(() => {
      const ok = login(usuario, senha)
      if (!ok) {
        setErro('Usuário ou senha incorretos. Tente novamente.')
        setCarregando(false)
      }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-brownie-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brownie-800 rounded-full opacity-30" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brownie-800 rounded-full opacity-20" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brownie-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brownie-900">
            <Cookie size={38} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Di Brownie</h1>
          <p className="text-brownie-300 text-sm mt-1">Sistema de Gestão • São Gonçalo — RJ</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-7 shadow-2xl">
          <h2 className="font-bold text-gray-800 text-xl mb-1">Entrar no sistema</h2>
          <p className="text-gray-400 text-sm mb-6">Informe suas credenciais de acesso</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Usuário</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={usuario}
                  onChange={e => { setUsuario(e.target.value); setErro('') }}
                  placeholder="seu.usuario"
                  autoComplete="username"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={verSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => { setSenha(e.target.value); setErro('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {verSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2.5">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !usuario || !senha}
              className="w-full bg-brownie-600 text-white py-3 rounded-xl font-semibold hover:bg-brownie-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 flex items-center justify-center gap-2"
            >
              {carregando ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-300 mt-5">
            Sistema interno — Di Brownie © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
