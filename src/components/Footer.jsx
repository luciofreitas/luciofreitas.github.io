import { Link } from 'react-router-dom'
import { Facebook, Linkedin, Instagram, Zap, Phone, Mail } from 'lucide-react'

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
            Especialistas em projetos elétricos prediais, industriais e fotovoltaicos. Mais de 1.000 projetos concluídos.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="https://www.facebook.com/share/1ASvRTuD6F/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook size={20} className="text-white/70 hover:text-[#f5a623] transition-colors" />
            </a>
            <a href="https://www.linkedin.com/in/mps-projetos-el%C3%A9tricos-e-consultoria-75947927b" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin size={20} className="text-white/70 hover:text-[#f5a623] transition-colors" />
            </a>
            <a href="https://www.instagram.com/mpsprojetoseletricos" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={20} className="text-white/70 hover:text-[#f5a623] transition-colors" />
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
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-[#f5a623]" />
              <a href="mailto:mpsprojetoseletricos@gmail.com" className="hover:text-white transition-colors">mpsprojetoseletricos@gmail.com</a>
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
