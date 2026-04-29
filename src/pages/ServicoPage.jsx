import { useParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowLeft, Phone, Mail } from 'lucide-react'
import { services } from '../data/services'

export default function ServicoPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const service = services.find((s) => s.slug === slug)

  if (!service) {
    return (
      <main className="pt-16 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-bold text-[#1a2e5a]">Serviço não encontrado.</p>
        <Link to="/#servicos" className="text-[#f5a623] underline">Voltar aos serviços</Link>
      </main>
    )
  }

  return (
    <main className="pt-16 min-h-screen bg-gray-50">
      {/* HERO */}
      <section className="bg-[#1a2e5a] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-5 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              {service.iconLarge}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{service.title}</h1>
          </div>
          <p className="text-white/80 text-lg mt-4 max-w-2xl">{service.description}</p>
        </div>
      </section>

      {/* DETALHES */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
          {/* Sobre o serviço */}
          <div>
            <h2 className="text-2xl font-extrabold text-[#1a2e5a] mb-4">Sobre o serviço</h2>
            <p className="text-gray-600 leading-relaxed">{service.details}</p>

            <h3 className="text-lg font-bold text-[#1a2e5a] mt-8 mb-4">O que está incluso</h3>
            <ul className="space-y-3">
              {service.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700">
                  <CheckCircle size={18} className="text-[#f5a623] mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Benefícios */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <h3 className="text-lg font-bold text-[#1a2e5a] mb-5">Benefícios</h3>
            <ul className="space-y-3">
              {service.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-gray-700 text-sm">
                  <CheckCircle size={16} className="text-[#f5a623] mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PROCESSO */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-[#1a2e5a] mb-10 text-center">Como funciona</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {service.process.map((p) => (
              <div key={p.step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#f5a623] text-white font-extrabold text-lg flex items-center justify-center mb-3">
                  {p.step}
                </div>
                <h4 className="font-bold text-[#1a2e5a] mb-1">{p.title}</h4>
                <p className="text-gray-500 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#f5a623]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Precisa deste serviço?</h2>
          <p className="text-white/90 mb-8">Entre em contato com nossa equipe e solicite um orçamento sem compromisso.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white text-[#1a2e5a] font-bold px-7 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Phone size={18} /> WhatsApp
            </a>
            <a
              href="mailto:contato@mpsprojetoeletrico.com.br"
              className="flex items-center justify-center gap-2 bg-[#1a2e5a] text-white font-bold px-7 py-3 rounded-lg hover:bg-[#162548] transition-colors"
            >
              <Mail size={18} /> Enviar e-mail
            </a>
          </div>
        </div>
      </section>

      {/* OUTROS SERVIÇOS */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-bold text-[#1a2e5a] mb-6 text-center">Outros serviços</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {services
              .filter((s) => s.slug !== slug)
              .map((s) => (
                <Link
                  key={s.slug}
                  to={`/servicos/${s.slug}`}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-[#1a2e5a] font-medium hover:border-[#f5a623] hover:text-[#f5a623] transition-colors"
                >
                  {s.title}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  )
}
