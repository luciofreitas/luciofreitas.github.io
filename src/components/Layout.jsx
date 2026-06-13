import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Boxes,
  ClipboardList, Users, DollarSign, BarChart2,
  ChevronLeft, ChevronRight, RefreshCw, Cookie, LogOut, Menu, X
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

function SidebarContent({ collapsed, setCollapsed, onClose, isMobile }) {
  const { resetarDados } = useApp()
  const { user, logout } = useAuth()

  function handleReset() {
    if (window.confirm('Resetar todos os dados para o estado inicial?')) {
      resetarDados()
      window.location.reload()
    }
  }

  function handleLogout() {
    logout()
    if (onClose) onClose()
  }

  return (
    <div className="flex flex-col h-full bg-brownie-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-brownie-700">
        <div className="w-8 h-8 bg-brownie-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <Cookie size={18} className="text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-sm leading-tight">Di Brownie</p>
            <p className="text-brownie-300 text-xs">Sistema ERP</p>
          </div>
        )}
        {isMobile && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brownie-800 text-brownie-300">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, tourId }) => (
          <NavLink
            key={to}
            to={to}
            id={tourId}
            end={to === '/'}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brownie-600 text-white'
                  : 'text-brownie-200 hover:bg-brownie-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-brownie-700 space-y-1">
        {(!collapsed || isMobile) && (
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
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-brownie-300 hover:bg-brownie-800 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              Sair ({user})
            </button>
          </>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(p => !p)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-brownie-300 hover:bg-brownie-800 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, showTour, finishTour } = useAuth()
  const location = useLocation()

  const pageLabel = NAV.find(n => n.to === location.pathname)?.label ?? 'ERP'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Desktop sidebar ── */}
      <aside
        id="tour-sidebar"
        className={`hidden lg:flex flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} isMobile={false} />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        id="tour-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isMobile onClose={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-3">
          {/* Hamburger (mobile only) */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 flex-shrink-0"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <h1 className="text-base font-semibold text-gray-800 flex-1 truncate">{pageLabel}</h1>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:block text-sm text-gray-400">São Gonçalo — RJ</span>
            {user && (
              <span className="text-xs bg-brownie-100 text-brownie-700 px-2.5 py-1 rounded-full font-medium capitalize">
                {user}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Tour */}
      {showTour && <Tour onFinish={finishTour} />}
    </div>
  )
}
