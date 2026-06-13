import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Boxes,
  ClipboardList, Users, DollarSign, BarChart2,
  ChevronLeft, ChevronRight, RefreshCw, Cookie,
  LogOut, Menu, X, Info, GraduationCap
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

const NAV_INFO = {
  '/':           'Tela inicial com resumo do negócio: receita do dia, pedidos em aberto, alertas de estoque baixo e gráficos dos últimos 7 dias.',
  '/pdv':        'Ponto de Venda. Registre as vendas do caixa: clique nos produtos para adicionar ao carrinho, selecione cliente e forma de pagamento e finalize.',
  '/produtos':   'Catálogo de produtos da loja. Cadastre novos itens, edite preços, veja a margem de lucro calculada e ative ou desative produtos.',
  '/estoque':    'Controle de ingredientes e insumos. Registre entradas (compras) e saídas (uso na produção). Alertas automáticos quando o estoque está abaixo do mínimo.',
  '/pedidos':    'Encomendas dos clientes. Crie pedidos com data de entrega, acompanhe o status (Pendente → Em Produção → Pronto → Entregue) e registre o sinal pago.',
  '/clientes':   'Cadastro de clientes com telefone, bairro e histórico de compras. Veja o total gasto e ticket médio de cada cliente.',
  '/financeiro': 'Lançamentos financeiros manuais. Registre receitas e despesas, filtre por mês e veja o resultado — se a loja teve lucro ou prejuízo.',
  '/relatorios': 'Gráficos de desempenho: produtos mais vendidos, receita por categoria, formas de pagamento preferidas e comparativo de receitas vs. despesas por mês.',
}

/* Balão flutuante (desktop) */
function DesktopTooltip({ item, onClose }) {
  const CARD_W = 280
  const top = Math.max(8, Math.min(item.top - 50, window.innerHeight - 200))

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9990]" onClick={onClose} />
      <div
        className="fixed z-[9991] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
        style={{ top, left: item.left + 14, width: CARD_W }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -left-2 top-8 w-3.5 h-3.5 bg-white border-l border-b border-gray-100 rotate-45" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <item.icon size={15} className="text-brownie-600 flex-shrink-0" />
            <span className="font-semibold text-gray-800 text-sm">{item.label}</span>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={14} />
          </button>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{NAV_INFO[item.to]}</p>
      </div>
    </>,
    document.body
  )
}

function SidebarContent({ collapsed, setCollapsed, onClose, isMobile }) {
  const { resetarDados } = useApp()
  const { user, logout, reiniciarAprendizagem } = useAuth()

  // Desktop: floating tooltip
  const [desktopTooltip, setDesktopTooltip] = useState(null)
  // Mobile: inline expand
  const [mobileInfo, setMobileInfo] = useState(null)

  function handleReset() {
    if (window.confirm('Resetar todos os dados para o estado inicial?')) {
      resetarDados()
      window.location.reload()
    }
  }

  function handleReiniciar() {
    if (window.confirm('Isso vai te deslogar e o tour de aprendizagem aparece novamente no próximo login. Continuar?')) {
      reiniciarAprendizagem()
    }
  }

  function handleInfoClick(e, nav) {
    e.preventDefault()
    e.stopPropagation()

    if (isMobile) {
      setMobileInfo(p => p === nav.to ? null : nav.to)
      return
    }

    if (desktopTooltip?.to === nav.to) { setDesktopTooltip(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setDesktopTooltip({ ...nav, top: rect.top, left: rect.right })
  }

  const showLabels = !collapsed || isMobile

  return (
    <div className="flex flex-col h-full bg-brownie-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-brownie-700 flex-shrink-0">
        <div className="w-8 h-8 bg-brownie-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <Cookie size={18} className="text-white" />
        </div>
        {showLabels && (
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
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {NAV.map((nav) => {
          const { to, label, icon: Icon, tourId } = nav
          const infoOpen = isMobile ? mobileInfo === to : desktopTooltip?.to === to

          return (
            <div key={to}>
              <div className="relative group flex items-center">
                <NavLink
                  to={to}
                  id={tourId}
                  end={to === '/'}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    `flex-1 flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors min-w-0 ${
                      isActive
                        ? 'bg-brownie-600 text-white'
                        : 'text-brownie-200 hover:bg-brownie-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {showLabels && <span className="truncate">{label}</span>}
                </NavLink>

                {/* Botão ℹ */}
                {showLabels && (
                  <button
                    onClick={(e) => handleInfoClick(e, nav)}
                    title={`O que é ${label}?`}
                    className={`
                      flex-shrink-0 p-1.5 rounded-md ml-1 transition-all duration-150
                      ${infoOpen
                        ? 'bg-brownie-500 text-white opacity-100'
                        : 'text-brownie-500 hover:text-white hover:bg-brownie-700 opacity-0 group-hover:opacity-100'
                      }
                      ${isMobile ? '!opacity-100' : ''}
                    `}
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>

              {/* Balão inline — mobile */}
              {isMobile && mobileInfo === to && (
                <div className="mx-2 mt-1 mb-2 relative">
                  <div className="absolute right-4 -top-1.5 w-3 h-3 bg-brownie-800 border-l border-t border-brownie-700 rotate-45" />
                  <div className="bg-brownie-800 border border-brownie-700 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={13} className="text-brownie-300 flex-shrink-0" />
                      <span className="text-xs font-semibold text-white">{label}</span>
                    </div>
                    <p className="text-xs text-brownie-200 leading-relaxed">{NAV_INFO[to]}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-brownie-700 space-y-0.5 flex-shrink-0">
        {showLabels && (
          <>
            <button
              onClick={handleReiniciar}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-amber-300 hover:bg-brownie-800 hover:text-amber-200 transition-colors"
            >
              <GraduationCap size={14} />
              Reiniciar aprendizagem
            </button>
            <button
              id="tour-reset"
              onClick={handleReset}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-brownie-300 hover:bg-brownie-800 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              Resetar dados
            </button>
            <button
              onClick={() => { logout(); if (onClose) onClose() }}
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

      {/* Tooltip flutuante — desktop */}
      {!isMobile && desktopTooltip && (
        <DesktopTooltip item={desktopTooltip} onClose={() => setDesktopTooltip(null)} />
      )}
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

      {/* Desktop sidebar */}
      <aside
        id="tour-sidebar"
        className={`hidden lg:flex flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} isMobile={false} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isMobile onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
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

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {showTour && <Tour onFinish={finishTour} />}
    </div>
  )
}
