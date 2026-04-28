import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Sun, Car, Lightbulb, CheckCircle, Phone, Mail, MapPin, Building2, TrendingUp, Gauge, Shield, Flame, Droplets, Wind, ChevronLeft, ChevronRight } from 'lucide-react'

const HERO_IMG = '/imagens/foto-apresentacao.jpeg'
const MARIANA_IMG = 'https://static.wixstatic.com/media/1c7735_7217d17fa1de4b96aa45ab268a0c93d5~mv2.jpg/v1/crop/x_17,y_0,w_1046,h_1080/fill/w_403,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/mari-wats_edited.jpg'
const PAULO_IMG = 'https://static.wixstatic.com/media/1c7735_681415656ffd46b4aad085b9ab959185~mv2.png/v1/crop/x_17,y_0,w_1046,h_1080/fill/w_403,h_416,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/paulo.png'

const services = [
  {
    icon: <Zap size={32} className="text-[#f5a623]" />,
    title: 'Projetos Elétricos Prediais',
    description: 'Segurança e eficiência para obras residenciais, comerciais e industriais conforme normas ABNT.',
    items: ['Projetos elétricos prediais e industriais', 'Ligação nova', 'Projetos para shoppings'],
  },
  {
    icon: <Sun size={32} className="text-[#f5a623]" />,
    title: 'Projetos Fotovoltaicos',
    description: 'Homologação e projetos executivos para energia solar, desde microgeração até minigeração.',
    items: ['Homologação microgeração e minigeração', 'Projeto executivo micro/minigeração', 'Projeto para consulta de acesso', 'Laudos de fatura de energia elétrica'],
  },
  {
    icon: <Car size={32} className="text-[#f5a623]" />,
    title: 'Carregadores Veiculares',
    description: 'Infraestrutura dedicada e segura para estações de recarga de veículos elétricos.',
    items: ['Visita técnica inclusa', 'Projeto de instalação', 'ART (Anotação de Responsabilidade Técnica)'],
  },
  {
    icon: <Building2 size={32} className="text-[#f5a623]" />,
    title: 'Projetos de Subestações',
    description: 'Dimensionamento de subestações de média tensão para distribuição eficiente de energia.',
    items: ['Subestações de média tensão', 'Distribuição de energia', 'Conformidade com normas técnicas'],
  },
  {
    icon: <TrendingUp size={32} className="text-[#f5a623]" />,
    title: 'Aumento de Carga',
    description: 'Adequação técnica da infraestrutura elétrica para suportar novas demandas de potência.',
    items: ['Análise de demanda', 'Projeto de adequação', 'Aprovação junto à concessionária'],
  },
  {
    icon: <Gauge size={32} className="text-[#f5a623]" />,
    title: 'Medição Coletiva e Individual',
    description: 'Centros de medição agrupada ou individualizados conforme normas da concessionária.',
    items: ['Medição coletiva', 'Medição individual', 'Conformidade com normas da concessionária'],
  },
  {
    icon: <Shield size={32} className="text-[#f5a623]" />,
    title: 'SPDA — Para-raios',
    description: 'Sistemas de proteção contra descargas atmosféricas e laudos de conformidade técnica.',
    items: ['Projeto de SPDA', 'Laudo técnico de conformidade', 'Inspeção e manutenção'],
  },
  {
    icon: <Flame size={32} className="text-[#f5a623]" />,
    title: 'Prevenção e Combate a Incêndio',
    description: 'Sistemas de detecção e combate a incêndios para segurança e obtenção do AVCB.',
    items: ['Projeto de PPCI', 'Obtenção do AVCB', 'Detecção e alarme de incêndio'],
  },
  {
    icon: <Droplets size={32} className="text-[#f5a623]" />,
    title: 'Instalações Hidrossanitárias',
    description: 'Redes de água fria, quente e esgoto planejadas para eficiência e durabilidade.',
    items: ['Água fria e quente', 'Esgoto sanitário', 'Drenagem pluvial'],
  },
  {
    icon: <Wind size={32} className="text-[#f5a623]" />,
    title: 'Projetos de HVAC',
    description: 'Sistemas de climatização e ventilação para conforto térmico e qualidade do ar.',
    items: ['Climatização central e split', 'Ventilação mecânica', 'Eficiência energética'],
  },
  {
    icon: <Lightbulb size={32} className="text-[#f5a623]" />,
    title: 'Consultoria Especializada',
    description: 'Orientações precisas e soluções inovadoras para sua instalação.',
    items: ['Diagnóstico de instalações', 'Adequação a normas técnicas', 'Suporte em todas as etapas'],
  },
]

const stats = [
  { value: '1.000+', label: 'Projetos concluídos' },
  { value: '5+', label: 'Anos de experiência' },
  { value: '100%', label: 'Conformidade com normas' },
]

export default function Home() {
  const carouselRef = useRef(null)

  const scroll = (dir) => {
    carouselRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }
  return (
    <main className="pt-16">
      {/* HERO */}
      <section
        id="inicio"
        className="relative min-h-[560px] flex items-center justify-center text-white overflow-hidden"
      >
        {/* Imagem de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        {/* Overlay escuro forte para garantir legibilidade */}
        <div className="absolute inset-0 bg-[#1a2e5a]/85 backdrop-blur-[1px]" />

        {/* Conteúdo */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-16">
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
              className="bg-[#f5a623] text-white font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-lg"
            >
              Solicitar Orçamento
            </a>
            <Link
              to="/login"
              className="border-2 border-white/60 text-white font-semibold px-8 py-3 rounded-lg hover:border-[#f5a623] hover:text-[#f5a623] transition-colors text-lg"
            >
              Formulário de Homologação
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#f5a623]">
        <div className="max-w-6xl mx-auto px-4 py-5 sm:py-8 grid grid-cols-3 gap-2 sm:gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#1a2e5a]">{s.value}</p>
              <p className="text-[#1a2e5a]/80 text-[10px] sm:text-sm font-medium mt-1 leading-tight">{s.label}</p>
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

          {/* Carousel */}
          <div className="relative">
            <button
              onClick={() => scroll(-1)}
              className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-[#f5a623] hover:text-white transition-colors border border-gray-100 items-center justify-center"
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>

            <div
              ref={carouselRef}
              className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {services.map((s) => (
                <div
                  key={s.title}
                  className="flex-none w-[260px] sm:w-[300px] md:w-[320px] bg-white rounded-2xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
                >
                  <div className="mb-4 w-14 h-14 rounded-xl bg-[#1a2e5a]/5 flex items-center justify-center group-hover:bg-[#1a2e5a]/10 transition-colors">
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#1a2e5a] mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{s.description}</p>
                  <ul className="space-y-2">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle size={15} className="text-[#f5a623] mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll(1)}
              className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-[#f5a623] hover:text-white transition-colors border border-gray-100 items-center justify-center"
              aria-label="Próximo"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/login"
              className="inline-block bg-[#f5a623] text-white font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
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
                <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 mx-auto rounded-2xl overflow-hidden mb-5 border-4 border-[#f5a623]/30 group-hover:border-[#f5a623] transition-colors shadow-md">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: <Phone size={24} className="text-[#f5a623]" />, label: 'Telefones', lines: ['(21) 95903-0972', '(21) 99384-2781'], href: ['tel:+5521959030972', 'tel:+5521993842781'] },
              { icon: <Mail size={24} className="text-[#f5a623]" />, label: 'E-mail', lines: ['mpsprojetoseletricos@gmail.com'], href: [null] },
              { icon: <MapPin size={24} className="text-[#f5a623]" />, label: 'Localização', lines: ['Rio de Janeiro, RJ'], href: [null] },
            ].map((card) => (
              <div key={card.label} className="bg-white/10 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
                <div className="flex justify-center mb-3">{card.icon}</div>
                <h4 className="text-white font-semibold mb-2">{card.label}</h4>
                {card.lines.map((line, i) => (
                  card.href[i] ? (
                    <a key={line} href={card.href[i]} className="block text-white/70 hover:text-[#f5a623] text-sm transition-colors break-all">{line}</a>
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
