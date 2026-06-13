import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Search, X, Check, ChevronDown } from 'lucide-react'

const STATUS_LABELS = {
  pendente: { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-700' },
  em_producao: { label: 'Em produção', cls: 'bg-blue-100 text-blue-700' },
  pronto: { label: 'Pronto', cls: 'bg-purple-100 text-purple-700' },
  entregue: { label: 'Entregue', cls: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
}

const VAZIO = {
  clienteNome: '', clienteTelefone: '',
  dataEntrega: '', observacoes: '', sinal: '',
  itens: [{ produtoId: null, nome: '', quantidade: 1, preco: '' }],
}

export default function Pedidos() {
  const { pedidos, setPedidos, produtos, clientes, nextId } = useApp()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modal, setModal] = useState(null)
  const [detalhe, setDetalhe] = useState(null)

  const hoje = new Date().toISOString().split('T')[0]

  const filtrados = pedidos.filter(p => {
    const matchBusca = p.clienteNome.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus
    return matchBusca && matchStatus
  }).sort((a, b) => new Date(a.dataEntrega) - new Date(b.dataEntrega))

  function abrirNovo() { setModal({ data: { ...VAZIO } }) }

  function atualizarItem(idx, campo, valor) {
    setModal(m => {
      const itens = [...m.data.itens]
      itens[idx] = { ...itens[idx], [campo]: valor }
      if (campo === 'produtoId') {
        const prod = produtos.find(p => p.id === Number(valor))
        if (prod) itens[idx] = { ...itens[idx], nome: prod.nome, preco: prod.preco }
      }
      const total = itens.reduce((s, i) => s + (Number(i.preco) * Number(i.quantidade)), 0)
      return { ...m, data: { ...m.data, itens, total } }
    })
  }

  function addItem() {
    setModal(m => ({ ...m, data: { ...m.data, itens: [...m.data.itens, { produtoId: null, nome: '', quantidade: 1, preco: '' }] } }))
  }

  function remItem(idx) {
    setModal(m => ({ ...m, data: { ...m.data, itens: m.data.itens.filter((_, i) => i !== idx) } }))
  }

  function salvar() {
    const d = modal.data
    if (!d.clienteNome || !d.dataEntrega || d.itens.length === 0) return
    const total = d.itens.reduce((s, i) => s + Number(i.preco) * Number(i.quantidade), 0)
    const novo = {
      ...d, id: nextId(pedidos),
      dataPedido: hoje,
      total: Number(total.toFixed(2)),
      sinal: Number(d.sinal) || 0,
      status: 'pendente',
    }
    setPedidos(prev => [novo, ...prev])
    setModal(null)
  }

  function avancarStatus(id) {
    const ordem = ['pendente', 'em_producao', 'pronto', 'entregue']
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p
      const idx = ordem.indexOf(p.status)
      if (idx < ordem.length - 1) return { ...p, status: ordem[idx + 1] }
      return p
    }))
  }

  function cancelar(id) {
    if (!window.confirm('Cancelar este pedido?')) return
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelado' } : p))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..."
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400 w-52" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['todos', 'Todos'], ...Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.label])].map(([val, label]) => (
            <button key={val} onClick={() => setFiltroStatus(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtroStatus === val ? 'bg-brownie-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={abrirNovo} className="ml-auto flex items-center gap-2 bg-brownie-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brownie-700 transition-colors">
          <Plus size={15} /> Novo Pedido
        </button>
      </div>

      <div className="space-y-3">
        {filtrados.map(p => {
          const st = STATUS_LABELS[p.status]
          const atrasado = p.status !== 'entregue' && p.status !== 'cancelado' && p.dataEntrega < hoje
          return (
            <div key={p.id} onClick={() => setDetalhe(p)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-brownie-200 cursor-pointer transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{p.clienteNome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    {atrasado && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Atrasado</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{p.itens.map(i => `${i.nome} (${i.quantidade}x)`).join(', ')}</p>
                  {p.observacoes && <p className="text-xs text-gray-400 mt-1 italic">"{p.observacoes}"</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-800">R$ {p.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Entrega: {new Date(p.dataEntrega + 'T12:00').toLocaleDateString('pt-BR')}</p>
                  {p.sinal > 0 && <p className="text-xs text-green-600">Sinal: R$ {p.sinal.toFixed(2)}</p>}
                </div>
              </div>
              {p.status !== 'entregue' && p.status !== 'cancelado' && (
                <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                  <button onClick={() => avancarStatus(p.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brownie-50 text-brownie-700 rounded-lg text-xs font-medium hover:bg-brownie-100 transition-colors">
                    <ChevronDown size={12} className="rotate-[-90deg]" /> Avançar status
                  </button>
                  <button onClick={() => cancelar(p.id)}
                    className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtrados.length === 0 && <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Nenhum pedido encontrado.</div>}
      </div>

      {/* Modal Novo Pedido */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">Nova Encomenda</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Nome do cliente *</label>
                  <input value={modal.data.clienteNome}
                    onChange={e => setModal(m => ({ ...m, data: { ...m.data, clienteNome: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Telefone</label>
                  <input value={modal.data.clienteTelefone}
                    onChange={e => setModal(m => ({ ...m, data: { ...m.data, clienteTelefone: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Data de entrega *</label>
                  <input type="date" value={modal.data.dataEntrega} min={hoje}
                    onChange={e => setModal(m => ({ ...m, data: { ...m.data, dataEntrega: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Sinal (R$)</label>
                  <input type="number" value={modal.data.sinal}
                    onChange={e => setModal(m => ({ ...m, data: { ...m.data, sinal: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Itens do pedido</label>
                <div className="space-y-2">
                  {modal.data.itens.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select value={item.produtoId || ''} onChange={e => atualizarItem(idx, 'produtoId', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400">
                        <option value="">Selecionar produto...</option>
                        {produtos.filter(p => p.ativo).map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.preco.toFixed(2)}</option>)}
                      </select>
                      <input type="number" value={item.quantidade} min="1" onChange={e => atualizarItem(idx, 'quantidade', e.target.value)}
                        className="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400 text-center" />
                      {modal.data.itens.length > 1 && (
                        <button onClick={() => remItem(idx)} className="text-red-400 hover:text-red-600"><X size={15} /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={addItem} className="text-brownie-600 text-sm font-medium hover:underline flex items-center gap-1">
                    <Plus size={14} /> Adicionar item
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Observações</label>
                <textarea value={modal.data.observacoes}
                  onChange={e => setModal(m => ({ ...m, data: { ...m.data, observacoes: e.target.value } }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} className="flex-1 bg-brownie-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brownie-700 flex items-center justify-center gap-2">
                <Check size={15} /> Criar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
