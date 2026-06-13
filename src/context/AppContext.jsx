import { createContext, useContext, useState, useEffect } from 'react'
import {
  produtosIniciais,
  estoquesIniciais,
  clientesIniciais,
  vendasIniciais,
  pedidosIniciais,
  lancamentosIniciais,
} from '../data/mockData'

const AppContext = createContext(null)

function loadOrInit(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }) {
  const [produtos, setProdutos] = useState(() => loadOrInit('erp_produtos', produtosIniciais))
  const [estoque, setEstoque] = useState(() => loadOrInit('erp_estoque', estoquesIniciais))
  const [clientes, setClientes] = useState(() => loadOrInit('erp_clientes', clientesIniciais))
  const [vendas, setVendas] = useState(() => loadOrInit('erp_vendas', vendasIniciais))
  const [pedidos, setPedidos] = useState(() => loadOrInit('erp_pedidos', pedidosIniciais))
  const [lancamentos, setLancamentos] = useState(() => loadOrInit('erp_lancamentos', lancamentosIniciais))

  useEffect(() => { localStorage.setItem('erp_produtos', JSON.stringify(produtos)) }, [produtos])
  useEffect(() => { localStorage.setItem('erp_estoque', JSON.stringify(estoque)) }, [estoque])
  useEffect(() => { localStorage.setItem('erp_clientes', JSON.stringify(clientes)) }, [clientes])
  useEffect(() => { localStorage.setItem('erp_vendas', JSON.stringify(vendas)) }, [vendas])
  useEffect(() => { localStorage.setItem('erp_pedidos', JSON.stringify(pedidos)) }, [pedidos])
  useEffect(() => { localStorage.setItem('erp_lancamentos', JSON.stringify(lancamentos)) }, [lancamentos])

  function resetarDados() {
    setProdutos(produtosIniciais)
    setEstoque(estoquesIniciais)
    setClientes(clientesIniciais)
    setVendas(vendasIniciais)
    setPedidos(pedidosIniciais)
    setLancamentos(lancamentosIniciais)
    localStorage.clear()
  }

  function adicionarVenda(venda) {
    const novaVenda = { ...venda, id: Date.now(), status: 'concluida' }
    setVendas(prev => [novaVenda, ...prev])

    if (venda.clienteId) {
      setClientes(prev => prev.map(c =>
        c.id === venda.clienteId
          ? { ...c, totalCompras: c.totalCompras + 1, valorTotal: c.valorTotal + venda.total }
          : c
      ))
    }

    const lancamento = {
      id: Date.now() + 1,
      tipo: 'receita',
      descricao: `Venda #${novaVenda.id}`,
      categoria: 'Vendas',
      valor: venda.total,
      data: venda.data,
    }
    setLancamentos(prev => [lancamento, ...prev])
    return novaVenda
  }

  function nextId(lista) {
    return lista.length > 0 ? Math.max(...lista.map(i => i.id)) + 1 : 1
  }

  return (
    <AppContext.Provider value={{
      produtos, setProdutos,
      estoque, setEstoque,
      clientes, setClientes,
      vendas, setVendas,
      pedidos, setPedidos,
      lancamentos, setLancamentos,
      adicionarVenda,
      resetarDados,
      nextId,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
