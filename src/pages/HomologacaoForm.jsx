import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

const WEB3FORMS_ACCESS_KEY = '2e475e19-11f9-42ef-8f36-cfd3458678af'

const PADRÃO_OPTIONS = ['AUMENTO DE CARGA', 'LIGAÇÃO NOVA', 'MEDIÇÃO INDIRETA', 'Outro']

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]/30 focus:border-[#1a2e5a] transition-all'

export default function HomologacaoForm({ onSuccess }) {
  const [form, setForm] = useState({
    email: '', empresa: '', localizacao: '', padraoEntrada: '',
    inversor: '', placa: '', inversorHibrido: '', mudancaPadrao: '',
    mudancaOutro: '', rateioCreditcredit: '',
  })
  const [files, setFiles] = useState({ documento: null, procuracao: null, fatura: null, titularidade: null })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)
  const [sending, setSending] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }
  const handleFile = (name) => (e) => setFiles((prev) => ({ ...prev, [name]: e.target.files[0] || null }))

  const reset = () => {
    setSubmitted(false)
    setForm({ email: '', empresa: '', localizacao: '', padraoEntrada: '', inversor: '', placa: '', inversorHibrido: '', mudancaPadrao: '', mudancaOutro: '', rateioCreditcredit: '' })
    setFiles({ documento: null, procuracao: null, fatura: null, titularidade: null })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSending(true)
    setError(false)
    const body = new FormData()
    body.append('access_key', WEB3FORMS_ACCESS_KEY)
    body.append('subject', 'Novo Formulário de Homologação - MPS Projetos Elétricos')
    body.append('E-mail', form.email)
    body.append('Empresa Parceira', form.empresa)
    body.append('Localização', form.localizacao)
    body.append('Padrão de Entrada', form.padraoEntrada)
    body.append('Inversor', form.inversor)
    body.append('Placa', form.placa)
    body.append('Inversor Híbrido', form.inversorHibrido)
    body.append('Mudança no Padrão', form.mudancaPadrao === 'Outro' ? `Outro: ${form.mudancaOutro}` : form.mudancaPadrao)
    body.append('Rateio de Créditos', form.rateioCreditcredit)
    if (files.documento)    body.append('Documento de Identificação', files.documento)
    if (files.procuracao)   body.append('Procuração', files.procuracao)
    if (files.fatura)       body.append('Fatura de Energia', files.fatura)
    if (files.titularidade) body.append('Documentos do Titular Correto', files.titularidade)
    fetch('https://api.web3forms.com/submit', { method: 'POST', body })
      .then((r) => r.json())
      .then((data) => { if (data.success) setSubmitted(true); else setError(true) })
      .catch(() => setError(true))
      .finally(() => setSending(false))
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-extrabold text-[#1a2e5a] mb-2">Formulário enviado!</h2>
        <p className="text-gray-600 mb-6">
          Recebemos suas informações. Nossa equipe entrará em contato em breve.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="bg-[#f5a623] text-white font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors">
            Enviar novo formulário
          </button>
          {onSuccess && (
            <button onClick={onSuccess} className="bg-[#1a2e5a] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#0f1e3d] transition-colors">
              Ver meus processos
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a2e5a]/5 border border-[#1a2e5a]/10 rounded-xl p-4 text-sm text-[#1a2e5a]">
        <strong>Atenção:</strong> Todos os documentos marcados com <span className="text-red-500">*</span> são obrigatórios.
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Identificação">
          <Field label="Seu e-mail" required>
            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="seu@email.com" className={inputClass} />
          </Field>
          <Field label="Empresa Parceira" hint="Nome da sua empresa">
            <input type="text" name="empresa" value={form.empresa} onChange={handleChange} placeholder="Nome da empresa" className={inputClass} />
          </Field>
        </Section>

        <Section title="Documentos do Cliente">
          <p className="text-sm text-gray-500 -mt-2 mb-2">Esta seção destina-se à inserção da documentação necessária para a homologação.</p>
          <FileField label="Documento de Identificação" hint="Legível / frente e verso" required name="documento" value={files.documento} onChange={handleFile('documento')} />
          <FileField label="Procuração" hint="Assinada pelo cliente (Manuscrito ou GOV)" required name="procuracao" value={files.procuracao} onChange={handleFile('procuracao')} />
          <FileField label="Fatura de Energia" hint="Anexar fatura legível e atualizada" required name="fatura" value={files.fatura} onChange={handleFile('fatura')} />
          <Field label="Localização" hint="Coordenadas geográficas da instalação">
            <input type="text" name="localizacao" value={form.localizacao} onChange={handleChange} placeholder="Ex: -22.9068, -43.1729" className={inputClass} />
          </Field>
          <Field label="Padrão de Entrada" required hint="Ex: 40 A - Tripolar - 10mm²">
            <input type="text" name="padraoEntrada" value={form.padraoEntrada} onChange={handleChange} required placeholder="Ex: 40 A - Tripolar - 10mm²" className={inputClass} />
          </Field>
          <Field label="Inversor" hint="Ex: 1 inversor Sungrow modelo SG10RS-L">
            <input type="text" name="inversor" value={form.inversor} onChange={handleChange} placeholder="Ex: 1 inversor Sungrow modelo SG10RS-L" className={inputClass} />
          </Field>
          <Field label="Placa" hint="Ex: 23 placas ZN SHINE modelo ZXNR-MD120-600W">
            <input type="text" name="placa" value={form.placa} onChange={handleChange} placeholder="Ex: 23 placas ZN SHINE modelo ZXNR-MD120-600W" className={inputClass} />
          </Field>
        </Section>

        <Section title="Informações Adicionais">
          <Field label="Inversor Híbrido" hint="Caso híbrido, informe a bateria. Caso contrário: N/A" required>
            <input type="text" name="inversorHibrido" value={form.inversorHibrido} onChange={handleChange} required placeholder="Ex: Bateria Pylontech US3000C 3,5kWh ou N/A" className={inputClass} />
          </Field>
        </Section>

        <Section title="Troca de Titularidade">
          <p className="text-sm text-gray-500 -mt-2 mb-2">Se a fatura estiver em nome de outro titular, anexe os documentos do titular correto.</p>
          <FileField label="Documentos do Titular Correto" hint="Fatura + ID + Procuração do titular" name="titularidade" value={files.titularidade} onChange={handleFile('titularidade')} />
          <Field label="Mudança no Padrão de Entrada" required>
            <div className="flex flex-wrap gap-3">
              {PADRÃO_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="mudancaPadrao" value={opt} checked={form.mudancaPadrao === opt} onChange={handleChange} className="accent-[#f5a623]" required />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            {form.mudancaPadrao === 'Outro' && (
              <input type="text" name="mudancaOutro" value={form.mudancaOutro} onChange={handleChange} placeholder="Especifique..." className={`${inputClass} mt-3`} />
            )}
          </Field>
          <Field label="Rateio de Créditos" required hint="Ex: Unidade geradora: End. A - 50% / Unidade beneficiada: End. B - 50%">
            <textarea name="rateioCreditcredit" value={form.rateioCreditcredit} onChange={handleChange} required rows={3}
              placeholder={"Unidade geradora: Est dos Bandeirantes 2026 - 50%\nUnidade beneficiada: Est dos Bandeirantes 2025 - 50%\nOu: N/A"}
              className={`${inputClass} resize-none`} />
          </Field>
        </Section>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} /> Ocorreu um erro ao enviar. Tente novamente.
          </div>
        )}

        <button type="submit" disabled={sending}
          className="w-full bg-[#1a2e5a] hover:bg-[#0f1e3d] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-colors">
          {sending ? 'Enviando...' : 'Enviar Formulário de Homologação'}
        </button>
      </form>
    </div>
  )
}

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
        <input type="file" name={name} accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} className="hidden" required={required} />
      </label>
      {value && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12} /> {value.name}</p>}
    </Field>
  )
}
