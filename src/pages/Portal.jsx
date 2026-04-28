import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, FileText, Clock, CheckCircle, ChevronRight, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import HomologacaoForm from './HomologacaoForm'

export default function Portal() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('processos')

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Cliente'
  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      {/* Header do portal */}
      <div className="bg-[#1a2e5a] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#f5a623] flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
            )}
            <div>
              <p className="text-xs text-white/60">Bem-vindo,</p>
              <p className="font-bold">{displayName}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-6 border-t border-white/10">
          <button
            onClick={() => setTab('processos')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'processos' ? 'border-[#f5a623] text-white' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Meus Processos
          </button>
          <button
            onClick={() => setTab('novo')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'novo' ? 'border-[#f5a623] text-white' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Novo Processo
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {tab === 'processos' && <ProcessosTab onNew={() => setTab('novo')} />}
        {tab === 'novo' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-[#1a2e5a]">Novo Processo de Homologação</h2>
              <p className="text-gray-500 text-sm mt-1">Preencha os campos e envie sua documentação.</p>
            </div>
            <HomologacaoForm onSuccess={() => setTab('processos')} />
          </div>
        )}
      </div>
    </main>
  )
}

function ProcessosTab({ onNew }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-[#1a2e5a]">Meus Processos</h2>
        <button onClick={onNew} className="bg-[#f5a623] text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors">
          + Novo Processo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <FileText size={48} className="text-gray-200 mx-auto mb-4" />
        <h3 className="text-gray-500 font-semibold mb-1">Nenhum processo ainda</h3>
        <p className="text-gray-400 text-sm mb-6">
          Clique em "Novo Processo" para enviar seus documentos e iniciar a homologação.
        </p>
        <button onClick={onNew} className="inline-flex items-center gap-2 bg-[#1a2e5a] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#0f1e3d] transition-colors">
          Iniciar processo <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Clock size={12} className="text-yellow-500" /> Em andamento</span>
        <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> Concluído</span>
      </div>
    </div>
  )
}
