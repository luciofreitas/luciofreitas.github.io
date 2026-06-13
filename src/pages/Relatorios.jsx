import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts'

const CORES = ['#d4741f', '#9c4516', '#e9af60', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444']

export default function Relatorios() {
  const { vendas, lancamentos, produtos } = useApp()
  const [periodo, setPeriodo] = useState('30')

  const dataCorte = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - Number(periodo))
    return d.toISOString().split('T')[0]
  }, [periodo])

  const vendasPeriodo = useMemo(() => vendas.filter(v => v.data >= dataCorte), [vendas, dataCorte])

  const graficoVendas = useMemo(() => {
    const agr = {}
    vendasPeriodo.forEach(v => { agr[v.data] = (agr[v.data] || 0) + v.total })
    return Object.entries(agr).sort().map(([data, total]) => ({
      data: new Date(data + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: Number(total.toFixed(2)),
    }))
  }, [vendasPeriodo])

  const graficoCategorias = useMemo(() => {
    const agr = {}
    vendasPeriodo.forEach(v => v.itens.forEach(it => {
      const prod = produtos.find(p => p.id === it.produtoId)
      const cat = prod?.categoria || 'Outros'
      agr[cat] = (agr[cat] || 0) + it.preco * it.quantidade
    }))
    return Object.entries(agr).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
  }, [vendasPeriodo, produtos])

  const graficoFormas = useMemo(() => {
    const agr = {}
    vendasPeriodo.forEach(v => { agr[v.formaPagamento] = (agr[v.formaPagamento] || 0) + 1 })
    return Object.entries(agr).map(([name, value]) => ({ name, value }))
  }, [vendasPeriodo])

  const topProdutos = useMemo(() => {
    const agr = {}
    vendasPeriodo.forEach(v => v.itens.forEach(it => {
      agr[it.nome] = { qty: (agr[it.nome]?.qty || 0) + it.quantidade, receita: (agr[it.nome]?.receita || 0) + it.preco * it.quantidade }
    }))
    return Object.entries(agr).sort((a, b) => b[1].qty - a[1].qty).slice(0, 8).map(([nome, d]) => ({
      nome: nome.length > 22 ? nome.slice(0, 20) + '…' : nome,
      qty: d.qty,
      receita: Number(d.receita.toFixed(2)),
    }))
  }, [vendasPeriodo])

  const lancPeriodo = useMemo(() => lancamentos.filter(l => l.data >= dataCorte), [lancamentos, dataCorte])
  const graficoDRE = useMemo(() => {
    const agr = {}
    lancPeriodo.forEach(l => {
      const mes = l.data.slice(0, 7)
      if (!agr[mes]) agr[mes] = { mes, receita: 0, despesa: 0 }
      if (l.tipo === 'receita') agr[mes].receita += l.valor
      else agr[mes].despesa += l.valor
    })
    return Object.values(agr).sort((a, b) => a.mes.localeCompare(b.mes)).map(m => ({
      ...m,
      mes: new Date(m.mes + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      receita: Number(m.receita.toFixed(2)),
      despesa: Number(m.despesa.toFixed(2)),
    }))
  }, [lancPeriodo])

  const totalReceita = vendasPeriodo.reduce((s, v) => s + v.total, 0)
  const totalVendas = vendasPeriodo.length
  const ticketMedio = totalVendas > 0 ? totalReceita / totalVendas : 0

  return (
    <div className="space-y-6">
      {/* Período */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 font-medium">Período:</span>
        {[['7', '7 dias'], ['30', '30 dias'], ['60', '60 dias'], ['90', '90 dias']].map(([val, label]) => (
          <button key={val} onClick={() => setPeriodo(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${periodo === val ? 'bg-brownie-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 font-medium">Receita total</p>
          <p className="text-2xl font-bold text-brownie-700 mt-1">R$ {totalReceita.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 font-medium">Total de vendas</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalVendas}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 font-medium">Ticket médio</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">R$ {ticketMedio.toFixed(2)}</p>
        </div>
      </div>

      {/* Vendas ao longo do tempo */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Receita por dia</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={graficoVendas}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="data" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
            <Tooltip formatter={v => [`R$ ${Number(v).toFixed(2)}`, 'Receita']} />
            <Line type="monotone" dataKey="total" stroke="#d4741f" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Produtos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Produtos mais vendidos</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topProdutos} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="nome" type="category" tick={{ fontSize: 10 }} width={140} />
              <Tooltip formatter={v => [v, 'Unidades']} />
              <Bar dataKey="qty" fill="#d4741f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por categoria */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Receita por categoria</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={graficoCategorias} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {graficoCategorias.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`R$ ${Number(v).toFixed(2)}`, 'Receita']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DRE mensal */}
      {graficoDRE.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Receitas x Despesas (mensal)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={graficoDRE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={v => [`R$ ${Number(v).toFixed(2)}`]} />
              <Legend />
              <Bar dataKey="receita" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Formas de pagamento */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Formas de pagamento</h3>
        <div className="flex flex-wrap gap-3">
          {graficoFormas.map((f, i) => (
            <div key={f.name} className="flex-1 min-w-24 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: CORES[i % CORES.length] }} />
              <p className="text-xs text-gray-500 font-medium">{f.name}</p>
              <p className="text-xl font-bold text-gray-800">{f.value}</p>
              <p className="text-xs text-gray-400">{((f.value / totalVendas) * 100).toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
