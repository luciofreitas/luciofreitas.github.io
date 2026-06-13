import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, Boxes,
  ClipboardList, Users, DollarSign, BarChart2,
  ChevronLeft, ChevronRight, RefreshCw, Cookie, LogOut
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import Tour from './Tour'

const NAV = [
  { to: '/',           label: 'Dashboard', icon: LayoutDashboard, tourId: 'tour-nav-dashboard' },
  { to: '/pdv',        label: 'PDV',       icon: ShoppingCart,    tourId: 'tour-nav-pdv' },
  { to: '/produtos',   label: 'Produtos',  icon: Cookie,          tourId: 'tour-nav-produtos' },
  { to: '/estoque',    label: 'Estoque',   icon: Boxes,           tourId: 'tour-nav-estoque' },
  { to: '/pedidos',    label: 'Pedidos',   icon: ClipboardList,   tourId: 'tour-nav-pedidos' },
  { to: '/clientes',   label: 'Clientes',  icon: Users,           tourId: 'tour-nav-clientes' },
  { to: '/financeiro', label: 'Financeiro',icon: DollarSign,      tourId: 'tour-nav-financeiro' },
  { to: '/relatorios', label: 'Relatórios',icon: BarChart2,       tourId: 'tour-nav-relatorios' },
]

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const { resetarDados } = useApp()
  const { user, logout, showTour, finishTour } = useAuth()
  const location = useLocation()

  function handleReset() {
    if (window.confirm('Resetar todos os dados para o estado inicial? Esta ação não pode ser desfeita.')) {
      resetarDados()
      window.location.reload()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        id="tour-sidebar"
        className={`flex flex-col bg-brownie-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-brownie-700">
          <div className="w-8 h-8 bg-brownie-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Cookie size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight">Di Brownie</p>
              <p className="text-brownie-300 text-xs">Sistema ERP</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto scrollbar-thin">
          {NAV.map(({ to, label, icon: Icon, tourId }) => (
            <NavLink
              key={to}
              to={to}
              id={tourId}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brownie-600 text-white'
                    : 'text-brownie-200 hover:bg-brownie-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-brownie-700 space-y-1">
          {!collapsed && (
            <>
              <button
                id="tour-reset"
                onClick={handleReset}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-brownie-300 hover:bg-brownie-800 hover:text-white transition-colors"
              >
                <RefreshCw size={14} />
                Resetar dados
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-brownie-300 hover:bg-brownie-800 hover:text-white transition-colors"
              >
                <LogOut size={14} />
                Sair
              </button>
            </>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-brownie-300 hover:bg-brownie-800 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">
            {NAV.find(n => n.to === location.pathname)?.label ?? 'ERP'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">São Gonçalo — RJ</span>
            {user && (
              <span className="text-xs bg-brownie-100 text-brownie-700 px-2.5 py-1 rounded-full font-medium capitalize">
                {user}
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Tour */}
      {showTour && <Tour onFinish={finishTour} />}
    </div>
  )
}
