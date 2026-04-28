import { Link } from 'react-router-dom'
import { ChevronDown, Zap, Sun, Car, Lightbulb, CheckCircle, Phone, Mail, MapPin } from 'lucide-react'

const HERO_IMG = 'https://static.wixstatic.com/media/1c7735_b1357fa10c85453c882787c2894f72ca~mv2.png/v1/fill/w_980,h_964,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/1c7735_b1357fa10c85453c882787c2894f72ca~mv2.png'
const MARIANA_IMG = 'https://static.wixstatic.com/media/1c7735_7217d17fa1de4b96aa45ab268a0c93d5~mv2.jpg/v1/crop/x_17,y_0,w_1046,h_1080/fill/w_403,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/mari-wats_edited.jpg'
const PAULO_IMG = 'https://static.wixstatic.com/media/1c7735_681415656ffd46b4aad085b9ab959185~mv2.png/v1/crop/x_17,y_0,w_1046,h_1080/fill/w_403,h_416,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/paulo.png'

const services = [
  {
    icon: <Zap size={32} className="text-[#f5a623]" />,
    title: 'Projetos Elétricos',
    description: 'Soluções completas para indústrias, comércios e residências.',
    items: [
      'Projetos elétricos prediais e industriais',
      'Alteração de carga',
      'Ligação nova',
      'Projetos para shoppings',
    ],
  },
  {
    icon: <Sun size={32} className="text-[#f5a623]" />,
    title: 'Projetos Fotovoltaicos',
    description: 'Homologação e projetos executivos para energia solar.',
    items: [
      'Homologação microgeração e minigeração',
      'Projeto executivo micro/minigeração',
      'Projeto para consulta de acesso',
      'Laudos de fatura de energia elétrica',
    ],
  },
  {
    icon: <Car size={32} className="text-[#f5a623]" />,
    title: 'Carregadores Veiculares',
    description: 'Projetos seguros para instalação de carregadores EV.',
    items: [
      'Visita técnica inclusa',
      'Projeto de instalação',
      'ART (Anotação de Responsabilidade Técnica)',
    ],
  },
  {
    icon: <Lightbulb size={32} className="text-[#f5a623]" />,
    title: 'Consultoria Especializada',
    description: 'Orientações precisas e soluções inovadoras.',
    items: [
      'Diagnóstico de instalações',
      'Adequação a normas técnicas',
      'Suporte em todas as etapas',
    ],
  },
]

const stats = [
  { value: '1.000+', label: 'Projetos concluídos' },
  { value: '5+', label: 'Anos de experiência' },
  { value: '100%', label: 'Conformidade com normas' },
]

export default function Home() {
  return (
    <main className="pt-16">
      {/* HERO */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center justify-center text-white overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        <div className="absolute inset-0 bg-[#1a2e5a]/75" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-[#f5a623]/20 border border-[#f5a623]/40 text-[#f5a623] text-sm font-semibold px-4 py-1 rounded-full mb-6">
            Engenharia Elétrica de Excelência
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Projetos Elétricos e<br />
            <span className="text-[#f5a623]">Fotovoltaicos</span> com Segurança
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Engenheiros eletricistas especializados em projetos para sua empresa, indústria ou residência. 
            Mais de 1.000 projetos concluídos com eficiência e comprometimento.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contato"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="bg-[#f5a623] text-[#1a2e5a] font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-lg"
            >
              Solicitar Orçamento
            </a>
            <Link
              to="/homologacao"
              className="border-2 border-white/60 text-white font-semibold px-8 py-3 rounded-lg hover:border-[#f5a623] hover:text-[#f5a623] transition-colors text-lg"
            >
              Formulário de Homologação
            </Link>
          </div>
        </div>
        <a
          href="#sobre"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white animate-bounce"
          aria-label="Rolar para baixo"
        >
          <ChevronDown size={32} />
        </a>
      </section>

      {/* STATS */}
      <section className="bg-[#f5a623]">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-3 gap-4 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-extrabold text-[#1a2e5a]">{s.value}</p>
              <p className="text-[#1a2e5a]/80 text-sm font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#f5a623] font-semibold text-sm uppercase tracking-wider">Quem Somos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a2e5a] mt-2">Sobre a MPS</h2>
            <div className="w-16 h-1 bg-[#f5a623] mx-auto mt-4" />
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              A <strong className="text-[#1a2e5a]">MPS Projetos Elétricos e Consultoria</strong> é uma empresa especializada em projetos elétricos prediais e industriais.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              Com uma equipe de engenheiros eletricistas experientes e mais de <strong className="text-[#1a2e5a]">1.000 projetos concluídos</strong>, garantimos serviços eficientes e comprometidos.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Nosso foco está em oferecer soluções de alta qualidade para empresas de instalação de células fotovoltaicas e instalações elétricas em geral.
            </p>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#f5a623] font-semibold text-sm uppercase tracking-wider">O que fazemos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a2e5a] mt-2">Nossos Serviços</h2>
            <div className="w-16 h-1 bg-[#f5a623] mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
              >
                <div className="mb-4 w-14 h-14 rounded-xl bg-[#1a2e5a]/5 flex items-center justify-center group-hover:bg-[#1a2e5a]/10 transition-colors">
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1a2e5a] mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{s.description}</p>
                <ul className="space-y-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-[#f5a623] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/homologacao"
              className="inline-block bg-[#1a2e5a] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#0f1e3d] transition-colors"
            >
              Solicitar Homologação Fotovoltaica
            </Link>
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section id="equipe" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#f5a623] font-semibold text-sm uppercase tracking-wider">Os Idealizadores</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a2e5a] mt-2">Nossa Equipe</h2>
            <div className="w-16 h-1 bg-[#f5a623] mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl mx-auto">
            {[
              { name: 'Mariana', img: MARIANA_IMG, role: 'Engenheira Eletricista', desc: 'Especialista em projetos fotovoltaicos e instalações elétricas prediais com foco em eficiência energética.' },
              { name: 'Paulo', img: PAULO_IMG, role: 'Engenheiro Eletricista', desc: 'Especialista em projetos industriais e consultoria técnica com vasta experiência em normas ABNT.' },
            ].map((member) => (
              <div key={member.name} className="text-center group">
                <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden mb-5 border-4 border-[#f5a623]/30 group-hover:border-[#f5a623] transition-colors shadow-md">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#1a2e5a]">{member.name}</h3>
                <p className="text-[#f5a623] font-semibold text-sm mb-2">{member.role}</p>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-20 bg-[#1a2e5a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#f5a623] font-semibold text-sm uppercase tracking-wider">Fale Conosco</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">Entre em Contato</h2>
            <div className="w-16 h-1 bg-[#f5a623] mx-auto mt-4" />
            <p className="text-white/70 mt-4 max-w-xl mx-auto">
              Solicite um orçamento ou tire suas dúvidas. Nossa equipe responderá o mais rápido possível.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: <Phone size={24} className="text-[#f5a623]" />, label: 'Telefones', lines: ['(21) 95903-0972', '(21) 99384-2781'], href: ['tel:+5521959030972', 'tel:+5521993842781'] },
              { icon: <Mail size={24} className="text-[#f5a623]" />, label: 'E-mail', lines: ['mpsprojetoseletricos@gmail.com'], href: ['mailto:mpsprojetoseletricos@gmail.com'] },
              { icon: <MapPin size={24} className="text-[#f5a623]" />, label: 'Localização', lines: ['Rio de Janeiro, RJ'], href: [null] },
            ].map((card) => (
              <div key={card.label} className="bg-white/10 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
                <div className="flex justify-center mb-3">{card.icon}</div>
                <h4 className="text-white font-semibold mb-2">{card.label}</h4>
                {card.lines.map((line, i) => (
                  card.href[i] ? (
                    <a key={line} href={card.href[i]} className="block text-white/70 hover:text-[#f5a623] text-sm transition-colors">{line}</a>
                  ) : (
                    <p key={line} className="text-white/70 text-sm">{line}</p>
                  )
                ))}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a
              href="https://wa.me/5521959030972?text=Olá,%20gostaria%20de%20solicitar%20um%20orçamento"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3 rounded-lg transition-colors text-lg"
            >
              💬 Chamar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
