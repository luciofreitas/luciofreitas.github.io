import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const PAD = 8

const STEPS = [
  {
    targetId: null,
    title: 'Bem-vindo ao ERP Di Brownie! 🍫',
    desc: 'Olá! Este é o sistema de gestão da Di Brownie. Vamos fazer um tour rápido para você conhecer cada módulo e já se sentir em casa na loja.',
    position: 'center',
  },
  {
    targetId: 'tour-sidebar',
    title: '📌 Menu Principal',
    desc: 'Esta barra lateral contém todos os módulos do sistema. Clique em qualquer item para navegar entre as seções. Você também pode recolhê-la clicando na seta no rodapé.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-dashboard',
    title: '📊 Dashboard',
    desc: 'A tela inicial. Mostra um resumo em tempo real: receita de hoje, vendas da semana, pedidos abertos, alertas de estoque baixo e os melhores produtos do período.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-pdv',
    title: '🛒 PDV — Ponto de Venda',
    desc: 'Aqui você registra as vendas do caixa. Clique nos produtos para adicionar ao carrinho, selecione o cliente (opcional), escolha a forma de pagamento e finalize. No dinheiro, o sistema calcula o troco automaticamente.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-produtos',
    title: '🍫 Produtos',
    desc: 'Catálogo completo de produtos da loja. Você pode cadastrar novos itens, editar nome e preço, ver a margem de lucro calculada automaticamente, e ativar ou desativar produtos sem excluí-los.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-estoque',
    title: '📦 Estoque',
    desc: 'Controle de ingredientes e insumos. Registre entradas (compra de materiais) e saídas (uso na produção). O sistema alerta em vermelho quando um item está abaixo do estoque mínimo definido.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-pedidos',
    title: '📋 Pedidos / Encomendas',
    desc: 'Gerencie as encomendas dos clientes. Crie pedidos com data de entrega, acompanhe o status (Pendente → Em Produção → Pronto → Entregue), registre o sinal pago e veja alertas de atraso.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-clientes',
    title: '👥 Clientes',
    desc: 'Cadastro de clientes com telefone, e-mail e bairro. Clique em um cliente para ver o histórico de compras, valor total gasto e ticket médio. Útil para identificar os melhores clientes.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-financeiro',
    title: '💰 Financeiro',
    desc: 'Lance receitas e despesas manualmente. Filtre por mês e tipo. Veja o resultado do período — se a loja teve lucro ou prejuízo — com os totais de receitas e despesas separados.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-relatorios',
    title: '📈 Relatórios',
    desc: 'Gráficos de desempenho: receita diária, produtos mais vendidos, receita por categoria, formas de pagamento preferidas e comparativo de receitas vs. despesas por mês. Filtre por 7, 30, 60 ou 90 dias.',
    position: 'right',
  },
  {
    targetId: 'tour-reset',
    title: '🔄 Resetar Dados',
    desc: 'Este botão volta todos os dados ao estado inicial de treinamento. Use sempre que quiser recomeçar do zero para praticar novamente. Perfeito para treinar diferentes cenários!',
    position: 'right',
  },
]

export default function Tour({ onFinish }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    if (!current.targetId) { setRect(null); return }
    const update = () => {
      const el = document.getElementById(current.targetId)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height })
      } else {
        setRect(null)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [step, current.targetId])

  function next() { isLast ? onFinish() : setStep(s => s + 1) }
  function prev() { setStep(s => s - 1) }

  // Compute tooltip position
  let cardStyle = {}
  let showLeftArrow = false

  if (rect && current.position === 'right') {
    const top = Math.min(Math.max(rect.top + rect.height / 2 - 140, 12), window.innerHeight - 340)
    cardStyle = { position: 'fixed', top, left: rect.right + 18, zIndex: 10001, width: 320 }
    showLeftArrow = true
  } else {
    cardStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10001, width: 340 }
  }

  return createPortal(
    <>
      {/* Full overlay */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.0)' }}
        onClick={onFinish}
      />

      {/* No-target: backdrop */}
      {!rect && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', pointerEvents: 'none' }} />
      )}

      {/* Spotlight frame (creates dim via box-shadow) */}
      {rect && (
        <div style={{
          position: 'fixed',
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          zIndex: 9999,
          borderRadius: 12,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          border: '2px solid #e0913a',
          pointerEvents: 'none',
        }} />
      )}

      {/* Tooltip card */}
      <div style={cardStyle} onClick={e => e.stopPropagation()}>
        {/* Left arrow */}
        {showLeftArrow && (
          <div style={{
            position: 'absolute',
            left: -8,
            top: 140,
            width: 16,
            height: 16,
            background: 'white',
            transform: 'rotate(45deg)',
            borderLeft: '1px solid #f3f4f6',
            borderBottom: '1px solid #f3f4f6',
            zIndex: -1,
          }} />
        )}

        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          position: 'relative',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#bc5c17', fontWeight: 700, letterSpacing: 1 }}>
                PASSO {step + 1} DE {STEPS.length}
              </span>
              <h3 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#1f2937', lineHeight: 1.3 }}>
                {current.title}
              </h3>
            </div>
            <button
              onClick={onFinish}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1, padding: '0 0 0 8px', marginTop: 2 }}
              title="Pular tour"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <p style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.65, margin: '0 0 18px' }}>
            {current.desc}
          </p>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, alignItems: 'center' }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                style={{
                  height: 6,
                  borderRadius: 99,
                  background: i === step ? '#bc5c17' : '#e5e7eb',
                  width: i === step ? 22 : 6,
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={prev}
                style={{
                  padding: '9px 16px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'white',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={next}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: isLast ? '#16a34a' : '#bc5c17',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {isLast ? '🚀 Pronto, vamos começar!' : 'Próximo →'}
            </button>
          </div>

          {step === 0 && (
            <button
              onClick={onFinish}
              style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 12, fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Pular tour
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
