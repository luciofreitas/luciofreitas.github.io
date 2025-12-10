import React, { useState } from 'react';
import { MenuLogin } from '../components';
import '../styles/pages/page-NossoProjeto.css';

export default function NossoProjeto() {
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
      titulo: 'Guias Automotivos Completos',
      icone: '📚',
      cor: 'roxo',
      descricao: 'Oferecemos uma biblioteca rica de guias práticos que cobrem desde conceitos básicos até procedimentos técnicos avançados. Aprenda sobre manutenção preventiva, instalação de componentes, diagnóstico de problemas comuns e muito mais. Nossos guias são escritos em linguagem acessível, com ilustrações e explicações passo a passo para que você ganhe autonomia e confiança no cuidado com seu veículo.'
    },
    {
      titulo: 'Histórico de Manutenção Organizado',
      icone: '📋',
      cor: 'laranja',
      descricao: 'Com o Garagem Smart, você mantém um registro completo de todas as manutenções, trocas de peças e serviços realizados no seu veículo. Esse histórico digital facilita o acompanhamento de revisões periódicas, aumenta o valor de revenda e garante que nenhum cuidado essencial seja esquecido.'
    },
    {
      titulo: 'Versão Pro',
      icone: '⭐',
      cor: 'dourado',
      descricao: 'Para quem busca ainda mais recursos, nossa Versão Pro oferece funcionalidades exclusivas como notificações personalizadas de recalls, acesso antecipado a novos guias técnicos, suporte prioritário e ferramentas avançadas de gestão de frota — ideal para oficinas, revendedoras e entusiastas que levam a sério o cuidado automotivo.'
    }
  ];

  return (
    <>
      <MenuLogin />
      <div className="page-wrapper">
        <div className="page-content" id="nosso-projeto">
          <h2 className="page-title">Nosso Projeto</h2>
          
          <p className="page-subtitle">
            Conheça o Garagem Smart - nossa solução completa para o seu problema automotivo.
          </p>

          <div className="projeto-descricao">
            <p>
              O Garagem Smart é uma plataforma completa e intuitiva desenvolvida para transformar a forma como você cuida do seu veículo. 
              Nascemos da necessidade de simplificar o complexo universo automotivo, oferecendo ferramentas práticas que colocam o 
              conhecimento técnico ao alcance de todos — desde consumidores finais até profissionais do setor.
            </p>
          </div>

          <section className="funcionalidades-section">
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

          <div className="projeto-conclusao">
            <p>
              Em resumo, o Garagem Smart centraliza informações técnicas, preços de mercado, alertas de segurança e conhecimento especializado 
              em uma única plataforma moderna e acessível. Nosso compromisso é entregar <strong>economia de tempo e dinheiro</strong>, 
              <strong>decisões mais informadas</strong> e a <strong>confiança</strong> de que você está fazendo as escolhas certas para o seu veículo.
            </p>
            <p className="projeto-welcome">
              Seja bem-vindo a uma nova era de autonomia e transparência no setor automotivo. 🚀
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
