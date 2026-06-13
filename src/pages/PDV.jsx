import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Minus, Trash2, ShoppingCart, Check, Search } from 'lucide-react'
import { FORMAS_PAGAMENTO } from '../data/mockData'

export default function PDV() {
  const { produtos, clientes, adicionarVenda } = useApp()
  const [carrinho, setCarrinho] = useState([])
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [clienteId, setClienteId] = useState('')
  const [formaPag, setFormaPag] = useState('PIX')
  const [concluida, setConcluida] = useState(false)
  const [troco, setTroco] = useState(null)
  const [valorRecebido, setValorRecebido] = useState('')

  const produtosAtivos = produtos.filter(p => p.ativo)
  const categorias = ['Todos', ...new Set(produtosAtivos.map(p => p.categoria))]
  const produtosFiltrados = produtosAtivos.filter(p => {
    const matchCat = categoriaFiltro === 'Todos' || p.categoria === categoriaFiltro
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
    return matchCat && matchBusca
  })

  const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0)

  function addAoCarrinho(prod) {
    setCarrinho(prev => {
      const exists = prev.find(i => i.produtoId === prod.id)
      if (exists) return prev.map(i => i.produtoId === prod.id ? { ...i, quantidade: i.quantidade + 1 } : i)
      return [...prev, { produtoId: prod.id, nome: prod.nome, preco: prod.preco, quantidade: 1 }]
    })
  }

  function alterarQty(produtoId, delta) {
    setCarrinho(prev => prev
      .map(i => i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + delta } : i)
      .filter(i => i.quantidade > 0)
    )
  }

  function finalizar() {
    if (carrinho.length === 0) return
    const hoje = new Date()
    const venda = {
      data: hoje.toISOString().split('T')[0],
      hora: hoje.toTimeString().slice(0, 5),
      clienteId: clienteId ? Number(clienteId) : null,
      itens: carrinho,
      total,
      formaPagamento: formaPag,
    }
    adicionarVenda(venda)

    if (formaPag === 'Dinheiro' && valorRecebido) {
      setTroco(Number(valorRecebido) - total)
    }

    setConcluida(true)
  }

  function novaVenda() {
    setCarrinho([])
    setClienteId('')
    setFormaPag('PIX')
    setConcluida(false)
    setTroco(null)
    setValorRecebido('')
  }

  if (concluida) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <Check size={40} className="text-green-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Venda concluída!</h2>
          <p className="text-gray-500 mt-1">Total: <strong>R$ {total.toFixed(2)}</strong> — {formaPag}</p>
          {troco !== null && troco >= 0 && (
            <p className="text-lg font-semibold text-green-600 mt-2">Troco: R$ {troco.toFixed(2)}</p>
          )}
        </div>
        <button
          onClick={novaVenda}
          className="bg-brownie-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brownie-700 transition-colors"
        >
          Nova Venda
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Produtos */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                categoriaFiltro === cat
                  ? 'bg-brownie-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto flex-1 pr-1">
          {produtosFiltrados.map(prod => (
            <button
              key={prod.id}
              onClick={() => addAoCarrinho(prod)}
              className="bg-white border border-gray-100 rounded-xl p-4 text-left hover:border-brownie-300 hover:shadow-md transition-all active:scale-95"
            >
              <p className="font-semibold text-gray-800 text-sm leading-tight">{prod.nome}</p>
              <p className="text-xs text-gray-400 mt-1">{prod.categoria}</p>
              <p className="text-brownie-600 font-bold mt-2">R$ {prod.preco.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Carrinho */}
      <div className="w-80 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <ShoppingCart size={18} className="text-brownie-600" />
          <h2 className="font-semibold text-gray-700">Carrinho</h2>
          <span className="ml-auto text-xs bg-brownie-100 text-brownie-700 px-2 py-0.5 rounded-full font-medium">
            {carrinho.reduce((s, i) => s + i.quantidade, 0)} itens
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrinho.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">Adicione produtos ao carrinho</p>
          )}
          {carrinho.map(item => (
            <div key={item.produtoId} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.nome}</p>
                <p className="text-xs text-gray-500">R$ {item.preco.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => alterarQty(item.produtoId, -1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors">
                  {item.quantidade === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantidade}</span>
                <button onClick={() => alterarQty(item.produtoId, 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-green-100 flex items-center justify-center text-gray-600 hover:text-green-600 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-800 w-16 text-right">
                R$ {(item.preco * item.quantidade).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <select
            value={clienteId}
            onChange={e => setClienteId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400"
          >
            <option value="">— Cliente (opcional) —</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          <select
            value={formaPag}
            onChange={e => setFormaPag(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400"
          >
            {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
          </select>

          {formaPag === 'Dinheiro' && (
            <input
              type="number"
              placeholder="Valor recebido (R$)"
              value={valorRecebido}
              onChange={e => setValorRecebido(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400"
            />
          )}

          <div className="flex justify-between items-center pt-1">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="text-xl font-bold text-brownie-700">R$ {total.toFixed(2)}</span>
          </div>

          <button
            onClick={finalizar}
            disabled={carrinho.length === 0}
            className="w-full bg-brownie-600 text-white py-3 rounded-lg font-semibold hover:bg-brownie-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  )
}
