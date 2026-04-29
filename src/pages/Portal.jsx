import { useState } from 'react'
import { FileText, Clock, CheckCircle } from 'lucide-react'
import HomologacaoForm from './HomologacaoForm'

export default function Portal() {
  const [tab, setTab] = useState('processos')

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      {/* Tabs */}
      <div className="bg-[#1a2e5a] text-white">
        <div className="max-w-5xl mx-auto px-4 flex gap-6">
          <button
            onClick={() => setTab('processos')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${tab === 'processos' ? 'border-[#f5a623] text-white' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Meus Processos
          </button>
          <button
            onClick={() => setTab('novo')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${tab === 'novo' ? 'border-[#f5a623] text-white' : 'border-transparent text-white/60 hover:text-white'}`}
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
        <p className="text-gray-400 text-sm">
          Clique em "+ Novo Processo" para enviar seus documentos e iniciar a homologação.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Clock size={12} className="text-yellow-500" /> Em andamento</span>
        <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> Concluído</span>
      </div>
    </div>
  )
}
