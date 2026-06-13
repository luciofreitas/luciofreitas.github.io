import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PDV from './pages/PDV'
import Produtos from './pages/Produtos'
import Estoque from './pages/Estoque'
import Pedidos from './pages/Pedidos'
import Clientes from './pages/Clientes'
import Financeiro from './pages/Financeiro'
import Relatorios from './pages/Relatorios'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pdv" element={<PDV />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  )
}
