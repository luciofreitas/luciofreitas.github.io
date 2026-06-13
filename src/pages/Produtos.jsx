import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Pencil, Search, X, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import { CATEGORIAS_PRODUTO } from '../data/mockData'

const VAZIO = { nome: '', categoria: 'Brownies', preco: '', custo: '', descricao: '', ativo: true }

export default function Produtos() {
  const { produtos, setProdutos, nextId } = useApp()
  const [busca, setBusca] = useState('')
  const [catFiltro, setCatFiltro] = useState('Todos')
  const [modal, setModal] = useState(null) // null | { mode: 'new'|'edit', data }

  const filtrados = produtos.filter(p => {
    const matchCat = catFiltro === 'Todos' || p.categoria === catFiltro
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
    return matchCat && matchBusca
  })

  function abrirNovo() { setModal({ mode: 'new', data: { ...VAZIO } }) }
  function abrirEditar(p) { setModal({ mode: 'edit', data: { ...p } }) }

  function salvar() {
    const d = modal.data
    if (!d.nome || !d.preco) return
    if (modal.mode === 'new') {
      setProdutos(prev => [...prev, { ...d, id: nextId(prev), preco: Number(d.preco), custo: Number(d.custo) }])
    } else {
      setProdutos(prev => prev.map(p => p.id === d.id ? { ...d, preco: Number(d.preco), custo: Number(d.custo) } : p))
    }
    setModal(null)
  }

  function toggleAtivo(id) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p))
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Todos', ...CATEGORIAS_PRODUTO].map(cat => (
            <button key={cat} onClick={() => setCatFiltro(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${catFiltro === cat ? 'bg-brownie-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>
        <button onClick={abrirNovo} className="ml-auto flex items-center gap-2 bg-brownie-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brownie-700 transition-colors flex-shrink-0">
          <Plus size={15} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Produto</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoria</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Preço Venda</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Custo</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Margem</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(p => {
              const margem = p.custo > 0 ? ((p.preco - p.custo) / p.preco * 100).toFixed(0) : '—'
              return (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.ativo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.nome}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{p.descricao}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.categoria}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">R$ {p.preco.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">R$ {p.custo.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${Number(margem) >= 50 ? 'text-green-600' : Number(margem) >= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {margem}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleAtivo(p.id)} title={p.ativo ? 'Desativar' : 'Ativar'}>
                      {p.ativo
                        ? <ToggleRight size={22} className="text-green-500 mx-auto" />
                        : <ToggleLeft size={22} className="text-gray-300 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => abrirEditar(p)} className="p-1.5 hover:bg-brownie-50 rounded-lg text-gray-400 hover:text-brownie-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum produto encontrado.</p>}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">{modal.mode === 'new' ? 'Novo Produto' : 'Editar Produto'}</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {campo('nome', 'Nome do produto')}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Categoria</label>
                <select
                  value={modal.data.categoria}
                  onChange={e => setModal(m => ({ ...m, data: { ...m.data, categoria: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400"
                >
                  {CATEGORIAS_PRODUTO.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {campo('preco', 'Preço de venda (R$)', 'number')}
                {campo('custo', 'Custo (R$)', 'number')}
              </div>
              {campo('descricao', 'Descrição')}
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
