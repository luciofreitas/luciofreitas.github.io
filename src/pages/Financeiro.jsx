import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, X, Check, TrendingUp, TrendingDown, DollarSign, Search } from 'lucide-react'

const CATEGORIAS_RECEITA = ['Vendas', 'Encomendas', 'Outros']
const CATEGORIAS_DESPESA = ['Insumos', 'Aluguel', 'Energia', 'Salários', 'Embalagens', 'Marketing', 'Manutenção', 'Outros']

const VAZIO = { tipo: 'despesa', descricao: '', categoria: 'Insumos', valor: '', data: new Date().toISOString().split('T')[0] }

export default function Financeiro() {
  const { lancamentos, setLancamentos, nextId } = useApp()
  const [modal, setModal] = useState(null)
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7))
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busca, setBusca] = useState('')

  const doMes = useMemo(() => lancamentos.filter(l => l.data.startsWith(filtroMes)), [lancamentos, filtroMes])

  const receitas = useMemo(() => doMes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0), [doMes])
  const despesas = useMemo(() => doMes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0), [doMes])
  const saldo = receitas - despesas

  const filtrados = doMes
    .filter(l => {
      const matchTipo = filtroTipo === 'todos' || l.tipo === filtroTipo
      const matchBusca = l.descricao.toLowerCase().includes(busca.toLowerCase()) || l.categoria.toLowerCase().includes(busca.toLowerCase())
      return matchTipo && matchBusca
    })
    .sort((a, b) => b.data.localeCompare(a.data))

  function salvar() {
    const d = modal.data
    if (!d.descricao || !d.valor || !d.data) return
    setLancamentos(prev => [...prev, { ...d, id: nextId(prev), valor: Number(d.valor) }])
    setModal(null)
  }

  function excluir(id) {
    if (!window.confirm('Remover este lançamento?')) return
    setLancamentos(prev => prev.filter(l => l.id !== id))
  }

  function campo(field, label, type = 'text') {
    return (
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
        <input type={type} value={modal.data[field]}
          onChange={e => setModal(m => ({ ...m, data: { ...m.data, [field]: e.target.value } }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400" />
      </div>
    )
  }

  const meses = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    meses.push(d.toISOString().slice(0, 7))
  }

  return (
    <div className="space-y-5">
      {/* Controles */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400">
          {meses.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {[['todos', 'Todos'], ['receita', 'Receitas'], ['despesa', 'Despesas']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltroTipo(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroTipo === val
                  ? val === 'receita' ? 'bg-green-600 text-white' : val === 'despesa' ? 'bg-red-500 text-white' : 'bg-brownie-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{label}</button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400 w-44" />
        </div>
        <button onClick={() => setModal({ data: { ...VAZIO } })}
          className="ml-auto flex items-center gap-2 bg-brownie-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brownie-700 transition-colors">
          <Plus size={15} /> Lançamento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <TrendingUp size={16} /> <span className="text-xs font-medium">Receitas</span>
          </div>
          <p className="text-2xl font-bold text-green-800">R$ {receitas.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 text-red-700 mb-1">
            <TrendingDown size={16} /> <span className="text-xs font-medium">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-800">R$ {despesas.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl p-4 border ${saldo >= 0 ? 'bg-brownie-50 border-brownie-100' : 'bg-orange-50 border-orange-100'}`}>
          <div className={`flex items-center gap-2 mb-1 ${saldo >= 0 ? 'text-brownie-700' : 'text-orange-700'}`}>
            <DollarSign size={16} /> <span className="text-xs font-medium">Resultado</span>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-brownie-800' : 'text-orange-800'}`}>
            {saldo >= 0 ? '+' : ''}R$ {saldo.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Descrição</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoria</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Valor</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(l.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{l.descricao}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l.categoria}</span>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${l.tipo === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                  {l.tipo === 'receita' ? '+' : '-'} R$ {l.valor.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => excluir(l.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors"><X size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum lançamento encontrado.</p>}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">Novo Lançamento</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo</label>
                <div className="flex gap-2">
                  {['receita', 'despesa'].map(t => (
                    <button key={t} onClick={() => setModal(m => ({ ...m, data: { ...m.data, tipo: t, categoria: t === 'receita' ? 'Outros' : 'Insumos' } }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        modal.data.tipo === t
                          ? t === 'receita' ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {t === 'receita' ? '+ Receita' : '- Despesa'}
                    </button>
                  ))}
                </div>
              </div>
              {campo('descricao', 'Descrição *')}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Categoria</label>
                <select value={modal.data.categoria}
                  onChange={e => setModal(m => ({ ...m, data: { ...m.data, categoria: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400">
                  {(modal.data.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {campo('valor', 'Valor (R$) *', 'number')}
                {campo('data', 'Data *', 'date')}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} className="flex-1 bg-brownie-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brownie-700 flex items-center justify-center gap-2">
                <Check size={15} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
