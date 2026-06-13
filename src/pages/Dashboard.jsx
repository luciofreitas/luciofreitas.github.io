import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { TrendingUp, ShoppingBag, Users, AlertTriangle, DollarSign, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { vendas, pedidos, clientes, estoque, lancamentos } = useApp()

  const hoje = new Date().toISOString().split('T')[0]
  const inicioSemana = new Date(); inicioSemana.setDate(inicioSemana.getDate() - 6)

  const vendasHoje = useMemo(() => vendas.filter(v => v.data === hoje), [vendas, hoje])
  const receitaHoje = useMemo(() => vendasHoje.reduce((s, v) => s + v.total, 0), [vendasHoje])

  const vendasSemana = useMemo(() => {
    return vendas.filter(v => new Date(v.data) >= inicioSemana)
  }, [vendas])
  const receitaSemana = useMemo(() => vendasSemana.reduce((s, v) => s + v.total, 0), [vendasSemana])

  const pedidosPendentes = useMemo(() => pedidos.filter(p => ['pendente', 'em_producao'].includes(p.status)), [pedidos])
  const estoqueBaixo = useMemo(() => estoque.filter(e => e.quantidade <= e.minimo), [estoque])

  const graficoSemana = useMemo(() => {
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short' })
      const total = vendas.filter(v => v.data === key).reduce((s, v) => s + v.total, 0)
      dias.push({ dia: label, receita: total })
    }
    return dias
  }, [vendas])

  const topProdutos = useMemo(() => {
    const contagem = {}
    vendasSemana.forEach(v => v.itens.forEach(it => {
      contagem[it.nome] = (contagem[it.nome] || 0) + it.quantidade
    }))
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, qty]) => ({ nome: nome.length > 20 ? nome.slice(0, 18) + '…' : nome, qty }))
  }, [vendasSemana])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KpiCard label="Receita Hoje" value={`R$ ${receitaHoje.toFixed(2)}`} sub={`${vendasHoje.length} vendas`} icon={DollarSign} color="bg-green-500" />
        <KpiCard label="Receita (7 dias)" value={`R$ ${receitaSemana.toFixed(2)}`} sub={`${vendasSemana.length} vendas`} icon={TrendingUp} color="bg-brownie-500" />
        <KpiCard label="Pedidos Abertos" value={pedidosPendentes.length} sub="pendente / produção" icon={ShoppingBag} color="bg-blue-500" />
        <KpiCard label="Clientes" value={clientes.length} sub="cadastrados" icon={Users} color="bg-purple-500" />
      </div>

      {/* Alertas */}
      {estoqueBaixo.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
            <AlertTriangle size={16} />
            Estoque baixo — {estoqueBaixo.length} item(ns) abaixo do mínimo
          </div>
          <div className="flex flex-wrap gap-2">
            {estoqueBaixo.map(e => (
              <span key={e.id} className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                {e.nome}: {e.quantidade} {e.unidade}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Receita — Últimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={graficoSemana}>
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={v => [`R$ ${Number(v).toFixed(2)}`, 'Receita']} />
              <Bar dataKey="receita" fill="#d4741f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Produtos mais vendidos (semana)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProdutos} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="nome" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip formatter={v => [v, 'Unidades']} />
              <Bar dataKey="qty" fill="#9c4516" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pedidos recentes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Próximas Entregas</h3>
        <div className="space-y-2">
          {pedidosPendentes.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{p.clienteNome}</p>
                <p className="text-xs text-gray-400">{p.itens.map(i => i.nome).join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">R$ {p.total.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                  p.status === 'em_producao' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {p.status === 'em_producao' ? 'Em produção' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
          {pedidosPendentes.length === 0 && <p className="text-sm text-gray-400">Nenhum pedido pendente.</p>}
        </div>
      </div>
    </div>
  )
}
