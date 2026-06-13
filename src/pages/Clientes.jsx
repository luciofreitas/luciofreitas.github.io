import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Search, Pencil, X, Check, Phone, Mail, MapPin, ShoppingBag } from 'lucide-react'

const VAZIO = { nome: '', telefone: '', email: '', bairro: '', dataCadastro: new Date().toISOString().split('T')[0], totalCompras: 0, valorTotal: 0 }

export default function Clientes() {
  const { clientes, setClientes, vendas, nextId } = useApp()
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(null)
  const [detalhe, setDetalhe] = useState(null)

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone || '').includes(busca) ||
    (c.bairro || '').toLowerCase().includes(busca.toLowerCase())
  )

  function abrirNovo() { setModal({ mode: 'new', data: { ...VAZIO } }) }
  function abrirEditar(c) { setModal({ mode: 'edit', data: { ...c } }) }

  function salvar() {
    const d = modal.data
    if (!d.nome) return
    if (modal.mode === 'new') {
      setClientes(prev => [...prev, { ...d, id: nextId(prev) }])
    } else {
      setClientes(prev => prev.map(c => c.id === d.id ? d : c))
    }
    setModal(null)
  }

  function campo(field, label, type = 'text', icon) {
    return (
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
        <div className="relative">
          {icon && <span className="absolute left-3 top-2.5 text-gray-400">{icon}</span>}
          <input type={type} value={modal.data[field]}
            onChange={e => setModal(m => ({ ...m, data: { ...m.data, [field]: e.target.value } }))}
            className={`w-full border border-gray-200 rounded-lg ${icon ? 'pl-9' : 'px-3'} pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400`} />
        </div>
      </div>
    )
  }

  const clienteVendas = detalhe
    ? vendas.filter(v => v.clienteId === detalhe.id).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10)
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, telefone ou bairro..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brownie-400" />
        </div>
        <button onClick={abrirNovo} className="ml-auto flex items-center gap-2 bg-brownie-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brownie-700 transition-colors">
          <Plus size={15} /> Novo Cliente
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-brownie-200 transition-all cursor-pointer" onClick={() => setDetalhe(c)}>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-full bg-brownie-100 flex items-center justify-center text-brownie-700 font-bold text-sm flex-shrink-0">
                {c.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <button onClick={e => { e.stopPropagation(); abrirEditar(c) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brownie-600">
                <Pencil size={13} />
              </button>
            </div>
            <p className="font-semibold text-gray-800 mt-2">{c.nome}</p>
            {c.telefone && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Phone size={11} /> {c.telefone}</p>}
            {c.bairro && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} /> {c.bairro}</p>}
            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1"><ShoppingBag size={11} /> {c.totalCompras} compras</span>
              <span className="font-semibold text-brownie-700">R$ {c.valorTotal.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      {filtrados.length === 0 && <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Nenhum cliente encontrado.</div>}

      {/* Modal Cadastro */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">{modal.mode === 'new' ? 'Novo Cliente' : 'Editar Cliente'}</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {campo('nome', 'Nome completo *')}
              {campo('telefone', 'Telefone', 'tel', <Phone size={14} />)}
              {campo('email', 'E-mail', 'email', <Mail size={14} />)}
              {campo('bairro', 'Bairro', 'text', <MapPin size={14} />)}
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

      {/* Modal Detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-lg">{detalhe.nome}</h3>
              <button onClick={() => setDetalhe(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              {detalhe.telefone && <div className="flex items-center gap-2 text-gray-600"><Phone size={14} /> {detalhe.telefone}</div>}
              {detalhe.email && <div className="flex items-center gap-2 text-gray-600"><Mail size={14} /> {detalhe.email}</div>}
              {detalhe.bairro && <div className="flex items-center gap-2 text-gray-600"><MapPin size={14} /> {detalhe.bairro}</div>}
              <div className="flex items-center gap-2 text-gray-600"><ShoppingBag size={14} /> {detalhe.totalCompras} compras</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-brownie-50 rounded-xl p-3 text-center">
                <p className="text-xs text-brownie-600 font-medium">Total gasto</p>
                <p className="text-xl font-bold text-brownie-800">R$ {detalhe.valorTotal.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 font-medium">Ticket médio</p>
                <p className="text-xl font-bold text-gray-700">
                  {detalhe.totalCompras > 0 ? `R$ ${(detalhe.valorTotal / detalhe.totalCompras).toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Últimas compras</h4>
            <div className="space-y-2">
              {clienteVendas.length === 0 && <p className="text-sm text-gray-400">Nenhuma venda registrada neste sistema.</p>}
              {clienteVendas.map(v => (
                <div key={v.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-700">{new Date(v.data + 'T12:00').toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-400">{v.formaPagamento} · {v.itens.length} item(s)</p>
                  </div>
                  <p className="font-semibold text-gray-800">R$ {v.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
