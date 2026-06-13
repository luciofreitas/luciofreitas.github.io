import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Pencil, Search, X, Check, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'

const VAZIO = { nome: '', unidade: 'kg', quantidade: '', minimo: '', custo_unitario: '' }
const UNIDADES = ['kg', 'g', 'L', 'ml', 'unid', 'caixa', 'rolo', 'pacote']

export default function Estoque() {
  const { estoque, setEstoque, nextId } = useApp()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [modal, setModal] = useState(null)
  const [movModal, setMovModal] = useState(null)
  const [movQty, setMovQty] = useState('')
  const [movObs, setMovObs] = useState('')

  const filtrados = estoque.filter(e => {
    const matchBusca = e.nome.toLowerCase().includes(busca.toLowerCase())
    if (filtro === 'baixo') return matchBusca && e.quantidade <= e.minimo
    if (filtro === 'ok') return matchBusca && e.quantidade > e.minimo
    return matchBusca
  })

  function abrirNovo() { setModal({ mode: 'new', data: { ...VAZIO } }) }
  function abrirEditar(e) { setModal({ mode: 'edit', data: { ...e } }) }

  function salvar() {
    const d = modal.data
    if (!d.nome) return
    const item = { ...d, quantidade: Number(d.quantidade), minimo: Number(d.minimo), custo_unitario: Number(d.custo_unitario) }
    if (modal.mode === 'new') {
      setEstoque(prev => [...prev, { ...item, id: nextId(prev) }])
    } else {
      setEstoque(prev => prev.map(e => e.id === d.id ? item : e))
    }
    setModal(null)
  }

  function registrarMovimento(tipo) {
    const qty = Number(movQty)
    if (!qty || qty <= 0) return
    setEstoque(prev => prev.map(e => {
      if (e.id !== movModal.id) return e
      const nova = tipo === 'entrada' ? e.quantidade + qty : e.quantidade - qty
      return { ...e, quantidade: Math.max(0, nova) }
    }))
    setMovModal(null)
    setMovQty('')
    setMovObs('')
  }

  function campo(field, label, type = 'text') {
    return (
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
        <input
          type={type}
          value={modal.data[field]}
          onChange={e => setModal(m => ({ ...m, data: { ...m.data, [field]: e.target.value } }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400"
        />
      </div>
    )
  }

  const baixoCount = estoque.filter(e => e.quantidade <= e.minimo).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar insumo..."
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400 w-56" />
        </div>
        <div className="flex gap-2">
          {[['todos', 'Todos'], ['baixo', `Estoque baixo (${baixoCount})`], ['ok', 'OK']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltro(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtro === val
                  ? val === 'baixo' ? 'bg-amber-500 text-white' : 'bg-brownie-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={abrirNovo} className="ml-auto flex items-center gap-2 bg-brownie-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brownie-700 transition-colors">
          <Plus size={15} /> Novo Insumo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Insumo</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Qtd. Atual</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Mínimo</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Custo Unit.</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(e => {
              const baixo = e.quantidade <= e.minimo
              const pct = e.minimo > 0 ? Math.min(100, (e.quantidade / (e.minimo * 2)) * 100) : 100
              return (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{e.nome}</p>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className={`h-1.5 rounded-full transition-all ${baixo ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${baixo ? 'text-red-600' : 'text-gray-800'}`}>
                      {e.quantidade} {e.unidade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{e.minimo} {e.unidade}</td>
                  <td className="px-4 py-3 text-right text-gray-600">R$ {e.custo_unitario.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {baixo
                      ? <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium"><AlertTriangle size={11} /> Baixo</span>
                      : <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium">OK</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setMovModal(e); setMovQty(''); setMovObs('') }}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Movimentar estoque">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => abrirEditar(e)} className="p-1.5 hover:bg-brownie-50 rounded-lg text-gray-400 hover:text-brownie-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum item encontrado.</p>}
      </div>

      {/* Modal Cadastro */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">{modal.mode === 'new' ? 'Novo Insumo' : 'Editar Insumo'}</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {campo('nome', 'Nome do insumo')}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Unidade</label>
                <select value={modal.data.unidade}
                  onChange={e => setModal(m => ({ ...m, data: { ...m.data, unidade: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400">
                  {UNIDADES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {campo('quantidade', 'Quantidade atual', 'number')}
                {campo('minimo', 'Qtd. mínima', 'number')}
              </div>
              {campo('custo_unitario', 'Custo por unidade (R$)', 'number')}
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

      {/* Modal Movimentação */}
      {movModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Movimentar: {movModal.nome}</h3>
              <button onClick={() => setMovModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Estoque atual: <strong>{movModal.quantidade} {movModal.unidade}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Quantidade ({movModal.unidade})</label>
                <input type="number" value={movQty} onChange={e => setMovQty(e.target.value)} min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => registrarMovimento('saida')}
                className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-2">
                <ArrowDown size={15} /> Saída
              </button>
              <button onClick={() => registrarMovimento('entrada')}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2">
                <ArrowUp size={15} /> Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
