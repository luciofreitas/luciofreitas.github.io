import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Zap, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { label: 'Início', href: '/#inicio' },
  { label: 'Sobre', href: '/#sobre' },
  { label: 'Serviços', href: '/#servicos' },
  { label: 'Equipe', href: '/#equipe' },
  { label: 'Contato', href: '/#contato' },
]

export default function Navbar({ dark, onToggleDark }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (e, href) => {
    setOpen(false)
    if (href.startsWith('/#')) {
      if (location.pathname !== '/') return
      e.preventDefault()
      const id = href.slice(2)
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#1a2e5a] shadow-lg' : 'bg-[#1a2e5a]/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center h-16">
        {/* Logo — esquerda */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl shrink-0">
          <Zap className="text-[#f5a623]" size={24} />
          <span>MPS</span>
          <span className="text-[#f5a623] font-light text-sm hidden sm:block">Projetos Elétricos</span>
        </Link>

        {/* Desktop nav — centro */}
        <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-white/90 hover:text-[#f5a623] text-sm font-medium transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Ícone de usuário — direita */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            to={user ? '/portal' : '/login'}
            aria-label="Área do cliente"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 overflow-hidden"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-white" />
            )}
          </Link>
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
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-white/90 hover:text-[#f5a623] font-medium py-1"
            >
              {link.label}
            </a>
          ))}
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
