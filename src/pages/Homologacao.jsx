import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react'

// Google Forms field entry IDs (obtained from the form's prefill URL)
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSdrGvqV1-4YDr9wV4JSa7zbZuN-8EfeHQtkvW3Njvr2p9j4uetpZ4/formResponse'

const PADRÃO_OPTIONS = [
  'AUMENTO DE CARGA',
  'LIGAÇÃO NOVA',
  'MEDIÇÃO INDIRETA',
  'Outro',
]

export default function Homologacao() {
  const [form, setForm] = useState({
    email: '',
    empresa: '',
    localizacao: '',
    padraoEntrada: '',
    inversor: '',
    placa: '',
    inversorHibrido: '',
    mudancaPadrao: '',
    mudancaOutro: '',
    rateioCreditcredit: '',
  })
  const [files, setFiles] = useState({
    documento: null,
    procuracao: null,
    fatura: null,
    titularidade: null,
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFile = (name) => (e) => {
    setFiles((prev) => ({ ...prev, [name]: e.target.files[0] || null }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Google Forms doesn't support CORS file uploads via fetch.
    // We open the native form with prefilled data as fallback.
    try {
      const params = new URLSearchParams()
      if (form.email) params.set('entry.emailAddress', form.email)
      if (form.empresa) params.set('entry.empresa', form.empresa)
      if (form.localizacao) params.set('entry.localizacao', form.localizacao)
      if (form.padraoEntrada) params.set('entry.padraoEntrada', form.padraoEntrada)
      if (form.inversor) params.set('entry.inversor', form.inversor)
      if (form.placa) params.set('entry.placa', form.placa)
      if (form.inversorHibrido) params.set('entry.inversorHibrido', form.inversorHibrido)
      const mudanca = form.mudancaPadrao === 'Outro' ? form.mudancaOutro : form.mudancaPadrao
      if (mudanca) params.set('entry.mudancaPadrao', mudanca)
      if (form.rateioCreditcredit) params.set('entry.rateioCreditcredit', form.rateioCreditcredit)

      // Open Google Form with prefill for user to attach files and submit
      window.open(
        `https://docs.google.com/forms/d/1YDr9wV4JSa7zbZuN-8EfeHQtkvW3Njvr2p9j4uetpZ4/viewform?${params.toString()}`,
        '_blank'
      )
      setSubmitted(true)
    } catch {
      setError(true)
    }
  }

  if (submitted) {
    return (
      <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-[#1a2e5a] mb-2">Quase lá!</h2>
          <p className="text-gray-600 mb-4">
            Abrimos o formulário do Google com seus dados preenchidos. Por favor, <strong>anexe os documentos</strong> e clique em <strong>Enviar</strong> na aba que abriu.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Se a aba não abriu, verifique se o bloqueador de pop-ups está ativo.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://docs.google.com/forms/d/1YDr9wV4JSa7zbZuN-8EfeHQtkvW3Njvr2p9j4uetpZ4/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#f5a623] text-[#1a2e5a] font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Abrir Formulário do Google
            </a>
            <button
              onClick={() => setSubmitted(false)}
              className="text-[#1a2e5a] underline text-sm"
            >
              Voltar e editar dados
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[#1a2e5a] hover:text-[#f5a623] font-medium mb-8 transition-colors"
        >
          <ChevronLeft size={18} /> Voltar ao site
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="text-[#f5a623] font-semibold text-sm uppercase tracking-wider">MPS Projetos Elétricos</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a2e5a] mt-1 mb-2">
            Formulário de Homologação
          </h1>
          <p className="text-gray-500">Residencial – Energia Solar Fotovoltaica</p>
          <div className="w-16 h-1 bg-[#f5a623] mt-4" />
        </div>

        <div className="bg-[#1a2e5a]/5 border border-[#1a2e5a]/10 rounded-xl p-4 mb-8 text-sm text-[#1a2e5a]">
          <strong>Atenção:</strong> Todos os documentos marcados com <span className="text-red-500">*</span> são obrigatórios. 
          A ausência de qualquer item poderá acarretar atrasos na análise do processo.
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Empresa */}
          <Section title="Identificação">
            <Field label="Seu e-mail" required>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
                className={inputClass}
              />
            </Field>
            <Field label="Empresa Parceira" hint="Nome da sua empresa">
              <input
                type="text"
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
                placeholder="Nome da empresa"
                className={inputClass}
              />
            </Field>
          </Section>

          {/* Documentos */}
          <Section title="Documentos do Cliente">
            <p className="text-sm text-gray-500 -mt-2 mb-4">
              Esta seção destina-se à inserção da documentação completa necessária para a efetiva homologação do projeto.
            </p>
            <FileField
              label="Documento de Identificação"
              hint="Legível / frente e verso"
              required
              name="documento"
              value={files.documento}
              onChange={handleFile('documento')}
            />
            <FileField
              label="Procuração"
              hint="Assinada pelo cliente (Manuscrito ou GOV)"
              required
              name="procuracao"
              value={files.procuracao}
              onChange={handleFile('procuracao')}
            />
            <FileField
              label="Fatura de Energia"
              hint="Anexar fatura legível e atualizada"
              required
              name="fatura"
              value={files.fatura}
              onChange={handleFile('fatura')}
            />
            <Field label="Localização" hint="Coordenadas geográficas da instalação">
              <input
                type="text"
                name="localizacao"
                value={form.localizacao}
                onChange={handleChange}
                placeholder="Ex: -22.9068, -43.1729"
                className={inputClass}
              />
            </Field>
            <Field label="Padrão de Entrada" required hint="Informe o disjuntor e seção do cabo. Ex: 40 A - Tripolar - 10mm²">
              <input
                type="text"
                name="padraoEntrada"
                value={form.padraoEntrada}
                onChange={handleChange}
                required
                placeholder="Ex: 40 A - Tripolar - 10mm²"
                className={inputClass}
              />
            </Field>
            <Field label="Inversor" hint="Quantidade, modelo e marca. Ex: 1 inversor Sungrow modelo SG10RS-L">
              <input
                type="text"
                name="inversor"
                value={form.inversor}
                onChange={handleChange}
                placeholder="Ex: 1 inversor Sungrow modelo SG10RS-L"
                className={inputClass}
              />
            </Field>
            <Field label="Placa" hint="Quantidade, modelo e marca. Ex: 23 placas ZN SHINE modelo ZXNR-MD120-600W">
              <input
                type="text"
                name="placa"
                value={form.placa}
                onChange={handleChange}
                placeholder="Ex: 23 placas ZN SHINE modelo ZXNR-MD120-600W"
                className={inputClass}
              />
            </Field>
          </Section>

          {/* Informações adicionais */}
          <Section title="Informações Adicionais">
            <Field label="Inversor Híbrido" hint="Caso o sistema seja híbrido, informe a bateria utilizada" required>
              <input
                type="text"
                name="inversorHibrido"
                value={form.inversorHibrido}
                onChange={handleChange}
                required
                placeholder="Ex: Bateria Pylontech US3000C 3,5kWh ou N/A"
                className={inputClass}
              />
            </Field>
          </Section>

          {/* Troca de titularidade */}
          <Section title="Troca de Titularidade">
            <p className="text-sm text-gray-500 -mt-2 mb-4">
              Se a fatura de energia estiver em nome de outro titular, anexe abaixo a fatura, ID e procuração do titular correto.
            </p>
            <FileField
              label="Documentos do Titular Correto"
              hint="Fatura + ID + Procuração do titular"
              name="titularidade"
              value={files.titularidade}
              onChange={handleFile('titularidade')}
            />
            <Field label="Mudança no Padrão de Entrada" required>
              <div className="flex flex-wrap gap-3">
                {PADRÃO_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mudancaPadrao"
                      value={opt}
                      checked={form.mudancaPadrao === opt}
                      onChange={handleChange}
                      className="accent-[#f5a623]"
                      required
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
              {form.mudancaPadrao === 'Outro' && (
                <input
                  type="text"
                  name="mudancaOutro"
                  value={form.mudancaOutro}
                  onChange={handleChange}
                  placeholder="Especifique..."
                  className={`${inputClass} mt-3`}
                />
              )}
            </Field>
            <Field label="Rateio de Créditos" required hint="Se houver rateio de créditos, insira a porcentagem. Ex: Unidade geradora: End. A - 50% / Unidade beneficiada: End. B - 50%">
              <textarea
                name="rateioCreditcredit"
                value={form.rateioCreditcredit}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Ex: Unidade geradora: Est dos Bandeirantes 2026 - 50%&#10;Unidade beneficiada: Est dos Bandeirantes 2025 - 50%&#10;Ou: N/A"
                className={`${inputClass} resize-none`}
              />
            </Field>
          </Section>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} />
              Ocorreu um erro ao abrir o formulário. Tente novamente ou acesse diretamente o link do Google Forms.
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Como funciona:</strong> Ao clicar em "Enviar", abriremos o formulário oficial do Google com seus dados já preenchidos. 
            Você precisará anexar os documentos e clicar em <strong>Enviar</strong> lá.
          </div>

          <button
            type="submit"
            className="w-full bg-[#1a2e5a] hover:bg-[#0f1e3d] text-white font-bold py-4 rounded-xl text-lg transition-colors"
          >
            Preencher e Abrir Formulário de Homologação
          </button>
        </form>
      </div>
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h3 className="text-lg font-bold text-[#1a2e5a] border-b border-gray-100 pb-3 mb-5">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

function FileField({ label, hint, required, name, value, onChange }) {
  return (
    <Field label={label} hint={hint} required={required}>
      <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-[#f5a623] rounded-xl px-4 py-3 cursor-pointer transition-colors group">
        <Upload size={18} className="text-gray-400 group-hover:text-[#f5a623] shrink-0" />
        <span className="text-sm text-gray-500 group-hover:text-gray-700 truncate">
          {value ? value.name : 'Clique para selecionar o arquivo'}
        </span>
        <input
          type="file"
          name={name}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={onChange}
          className="hidden"
          required={required}
        />
      </label>
      {value && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <CheckCircle size={12} /> {value.name}
        </p>
      )}
    </Field>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f5a623]/40 focus:border-[#f5a623] transition-colors'
