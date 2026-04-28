import { Link } from 'react-router-dom'
import { Zap, Phone, Mail } from 'lucide-react'

function InstagramIcon({ size = 20, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function LinkedinIcon({ size = 20, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function FacebookIcon({ size = 20, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[#1a2e5a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="text-[#f5a623]" size={22} />
            <span className="font-bold text-lg">MPS Projetos Elétricos</span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            Especialistas em projetos elétricos<br />prediais, industriais e fotovoltaicos.<br />Mais de 1.000 projetos concluídos.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="https://www.facebook.com/share/1ASvRTuD6F/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FacebookIcon size={20} className="text-white/70 hover:text-[#f5a623] transition-colors" />
            </a>
            <a href="https://www.linkedin.com/in/mps-projetos-el%C3%A9tricos-e-consultoria-75947927b" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <LinkedinIcon size={20} className="text-white/70 hover:text-[#f5a623] transition-colors" />
            </a>
            <a href="https://www.instagram.com/mpsprojetoseletricos" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <InstagramIcon size={20} className="text-white/70 hover:text-[#f5a623] transition-colors" />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-semibold text-[#f5a623] mb-3">Navegação</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><a href="/#inicio" className="hover:text-white transition-colors">Início</a></li>
            <li><a href="/#sobre" className="hover:text-white transition-colors">Sobre Nós</a></li>
            <li><a href="/#servicos" className="hover:text-white transition-colors">Serviços</a></li>
            <li><a href="/#equipe" className="hover:text-white transition-colors">Nossa Equipe</a></li>
            <li><Link to="/homologacao" className="hover:text-white transition-colors">Formulário de Homologação</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-[#f5a623] mb-3">Contato</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-[#f5a623]" />
              <a href="tel:+5521959030972" className="hover:text-white transition-colors">(21) 95903-0972</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-[#f5a623]" />
              <a href="tel:+5521993842781" className="hover:text-white transition-colors">(21) 99384-2781</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail size={14} className="text-[#f5a623] mt-0.5 shrink-0" />
              <a href="mailto:mpsprojetoseletricos@gmail.com" className="hover:text-white transition-colors break-all">mpsprojetoseletricos@gmail.com</a>
            </li>
          </ul>
          <p className="text-white/40 text-xs mt-4">CNPJ: 50.546.226/0001-60</p>
        </div>
      </div>

      <div className="border-t border-white/10 text-center text-white/40 text-xs py-4">
        © {new Date().getFullYear()} MPS Projetos Elétricos e Consultoria. Todos os direitos reservados.
      </div>
    </footer>
  )
}
