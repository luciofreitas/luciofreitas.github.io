import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Zap, User, LogOut, Settings, UserCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { label: 'Início', href: '/#inicio' },
  { label: 'Sobre', href: '/#sobre' },
  { label: 'Serviços', href: '/#servicos' },
  { label: 'Equipe', href: '/#equipe' },
]
const contatoLink = { label: 'Contato', href: '/#contato' }

export default function Navbar({ dark, onToggleDark }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('inicio')
  const location = useLocation()
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (location.pathname !== '/') setActiveSection('')
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const allIds = [...navLinks.map(l => l.href.slice(2)), contatoLink.href.slice(2)]

    const handleScroll = () => {
      if (window.location.pathname !== '/') return
      let current = allIds[0]
      allIds.forEach((id) => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 90) current = id
      })
      setActiveSection(current)
      window.history.replaceState(null, '', `/#${current}`)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    setUserMenu(false)
    await signOut()
    navigate('/')
  }

  const handleNavClick = (e, href) => {
    setOpen(false)
    if (href.startsWith('/#')) {
      if (location.pathname !== '/') return
      e.preventDefault()
      const id = href.slice(2)
      setActiveSection(id)
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#1a2e5a] shadow-lg' : 'bg-[#1a2e5a]/90 backdrop-blur-sm'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 flex items-center h-16">
        {/* Logo — esquerda */}
        <div className="flex-1">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Zap className="text-[#f5a623]" size={24} />
            <span>MPS</span>
            <span className="text-[#f5a623] font-light text-sm hidden sm:block">Projetos Elétricos</span>
          </Link>
        </div>

        {/* Desktop nav — centro */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const sectionId = link.href.slice(2)
            const isActive = activeSection === sectionId
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-[#f5a623]' : 'text-white/90 hover:text-[#f5a623]'
                }`}
              >
                {link.label}
              </a>
            )
          })}
          {user && (
            <Link
              to="/portal"
              className={`text-sm font-medium transition-colors duration-200 ${
                location.pathname === '/portal' ? 'text-[#f5a623]' : 'text-white/90 hover:text-[#f5a623]'
              }`}
            >
              Homologação
            </Link>
          )}
          <a
            href={contatoLink.href}
            onClick={(e) => handleNavClick(e, contatoLink.href)}
            className={`text-sm font-medium transition-colors duration-200 ${
              activeSection === contatoLink.href.slice(2)
                ? 'text-[#f5a623]'
                : 'text-white/90 hover:text-[#f5a623]'
            }`}
          >
            {contatoLink.label}
          </a>
        </nav>

        {/* Ícone de usuário — direita */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 overflow-hidden"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </button>
              {userMenu && (
                <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400">Logado como</p>
                    <p className="text-sm font-semibold text-[#1a2e5a] truncate">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                  </div>
                  <button disabled className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed w-full">
                    <UserCircle size={16} /> Perfil
                  </button>
                  <button disabled className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed w-full">
                    <Settings size={16} /> Configurações
                  </button>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              aria-label="Área do cliente"
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
            >
              <User size={20} className="text-white" />
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-1 ml-auto"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#1a2e5a] border-t border-white/10 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => {
            const sectionId = link.href.slice(2)
            const isActive = location.pathname === '/' && activeSection === sectionId
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`font-medium py-1 transition-colors duration-200 ${
                  isActive ? 'text-[#f5a623]' : 'text-white/90 hover:text-[#f5a623]'
                }`}
              >
                {link.label}
              </a>
            )
          })}
          {user && (
            <Link
              to="/portal"
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-[#f5a623] font-medium py-1"
            >
              Homologação
            </Link>
          )}
          <a
            href={contatoLink.href}
            onClick={(e) => { handleNavClick(e, contatoLink.href); setOpen(false) }}
            className="text-white/90 hover:text-[#f5a623] font-medium py-1"
          >
            {contatoLink.label}
          </a>
          <Link
            to={user ? '/portal' : '/login'}
            onClick={() => setOpen(false)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold text-center flex items-center justify-center gap-2 transition-colors"
          >
            <User size={16} />
            {user ? 'Minha Área' : 'Área do Cliente'}
          </Link>
          <button
            onClick={() => { onToggleDark(); setOpen(false) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${
              dark
                ? 'bg-[#f5a623] border-[#f5a623] text-white'
                : 'bg-transparent border-[#f5a623] text-[#f5a623]'
            }`}
          >
            <Zap size={16} />
            {dark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      )}
    </header>
  )
}
