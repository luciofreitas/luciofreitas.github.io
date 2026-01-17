import React, { forwardRef, useState } from 'react';

const FuncionalidadesSection = forwardRef(function FuncionalidadesSection(
  { id = 'funcionalidades' },
  ref
) {
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (cardKey) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const funcionalidades = [
    {
      titulo: 'Busca Inteligente de Peças',
      icone: '🔍',
      cor: 'azul',
      descricao: 'Nossa ferramenta de busca foi projetada para eliminar a frustração de encontrar a peça errada. Utilizando um sistema de compatibilidade preciso, você seleciona marca, modelo e ano do seu veículo e recebe apenas as peças que realmente servem. Acabaram-se as compras erradas, devoluções e tempo perdido — cada resultado é verificado e validado para garantir compatibilidade total.'
    },
    {
      titulo: 'Tabela FIPE Atualizada',
      icone: '💰',
      cor: 'verde',
      descricao: 'Tenha acesso instantâneo aos valores de referência do mercado automotivo brasileiro. Nossa Tabela FIPE apresenta preços médios atualizados de centenas de modelos, com filtros por marca, ano e busca por modelo. Seja para comprar, vender ou simplesmente acompanhar a valorização do seu veículo, você tem informações confiáveis a um clique de distância.'
    },
    {
      titulo: 'Alertas de Recalls',
      icone: '⚠️',
      cor: 'vermelho',
      descricao: 'A segurança é nossa prioridade. Disponibilizamos uma base completa de recalls automotivos, permitindo que você verifique se o seu veículo possui alguma convocação ativa das montadoras. Mantenha-se informado sobre campanhas de segurança, defeitos identificados e procedimentos de correção — porque dirigir com tranquilidade faz toda a diferença.'
    },
    {
      titulo: 'Guias Automotivos',
      icone: '📚',
      cor: 'roxo',
      descricao: 'Oferecemos uma biblioteca rica de guias práticos que cobrem desde conceitos básicos até procedimentos técnicos avançados. Aprenda sobre manutenção preventiva, instalação de componentes, diagnóstico de problemas comuns e muito mais. Nossos guias são escritos em linguagem acessível, com ilustrações e explicações passo a passo para que você ganhe autonomia e confiança no cuidado com seu veículo.'
    },
    {
      titulo: 'Histórico de Manutenção',
      icone: '📋',
      cor: 'laranja',
      descricao: 'Com o Garagem Smart, você mantém um registro completo de todas as manutenções, trocas de peças e serviços realizados no seu veículo. Esse histórico digital facilita o acompanhamento de revisões periódicas, aumenta o valor de revenda e garante que nenhum cuidado essencial seja esquecido.'
    },
    {
      titulo: 'Versão Pro',
      icone: '⭐',
      cor: 'dourado',
      descricao: 'Para quem busca ainda mais recursos, nossa Versão Pro oferece funcionalidades exclusivas como acesso antecipado a novos guias técnicos, suporte prioritário, acesso à comunidade no Discord, histórico detalhado de manutenções e alertas personalizados — ideal para oficinas, revendedoras e entusiastas que levam a sério o cuidado automotivo.'
    }
  ];

  return (
    <section ref={ref} className="funcionalidades-section" id={id}>
      <h3 className="section-title">Funcionalidades</h3>
      <div className="funcionalidades-grid">
        {funcionalidades.map((func, index) => {
          const cardKey = `func-${index}`;
          const isExpanded = expandedCards[cardKey];

          return (
            <div
              key={index}
              className={`funcionalidade-card card-${func.cor} ${isExpanded ? 'expanded' : 'collapsed'}`}
            >
              <div
                className="funcionalidade-header"
                onClick={() => toggleCard(cardKey)}
                style={{ cursor: 'pointer' }}
              >
                <span className="funcionalidade-icone">{func.icone}</span>
                <h4>{func.titulo}</h4>
              </div>
              <div className="funcionalidade-content">
                <p>{func.descricao}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

export default FuncionalidadesSection;
