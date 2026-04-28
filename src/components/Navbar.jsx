import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'

const navLinks = [
  { label: 'Início', href: '/#inicio' },
  { label: 'Sobre', href: '/#sobre' },
  { label: 'Serviços', href: '/#servicos' },
  { label: 'Equipe', href: '/#equipe' },
  { label: 'Contato', href: '/#contato' },
]

export default function Navbar() {
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
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <Zap className="text-[#f5a623]" size={24} />
          <span>MPS</span>
          <span className="text-[#f5a623] font-light text-sm hidden sm:block">Projetos Elétricos</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
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
          <Link
            to="/homologacao"
            className="bg-[#f5a623] text-[#1a2e5a] px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors duration-200"
          >
            Solicitar Homologação
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-1"
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
            to="/homologacao"
            onClick={() => setOpen(false)}
            className="bg-[#f5a623] text-[#1a2e5a] px-4 py-2 rounded-lg text-sm font-bold text-center hover:bg-yellow-400 transition-colors"
          >
            Solicitar Homologação
          </Link>
        </div>
      )}
    </header>
  )
}
