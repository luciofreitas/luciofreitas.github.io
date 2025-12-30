import React, { useState } from 'react';
import { MenuLogin } from '../components';
import '../styles/pages/page-SobreGaragemSmart.css';
import '../styles/pages/page-QuemSomos.css';

export default function SobreGaragemSmart() {
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
    <>
      <MenuLogin />
      <div className="page-wrapper">
        <div className="page-content" id="sobre-garagemsmart">
          <h2 className="page-title">Sobre o GaragemSmart</h2>
          
          <p className="page-subtitle">
            Conheça nossa história e missão no setor automotivo.
          </p>

          {/* PRIMEIRO: Conteúdo completo de Quem Somos */}
          <div className="quem-somos-descricao">
            <p>
               Somos uma empresa fundada por três amigos que, cansados de depender de terceiros, decidiram transformar iniciativa em soluções concretas.
              Com recursos iniciais modestos, unimos curiosidade técnica, colaboração e disciplina para resolver problemas reais do setor automotivo.
              Atuamos com foco em eficiência, acessibilidade e resultados mensuráveis. Nosso compromisso é entregar produtos úteis e confiáveis,
              sustentados por ética, transparência e aprendizado contínuo. Não buscamos ser apenas mais uma empresa no mercado global —
              trabalhamos com serenidade e consistência para, um dia, nos tornar referência em tecnologia.
            </p>
          </div>

          {/* Seção de Apresentação da Equipe */}
          <div className="quem-somos-equipe-section">
            <h3 className="equipe-section-title">Nossa Equipe</h3>
            
            <div className="equipe-cards-container">
              {/* Card Membro 1 */}
              <div className="equipe-card">
                <div className="equipe-card-photo">
                  <img src="/images/rafael.jpg" alt="Rafael" className="equipe-photo" />
                </div>
                <div className="equipe-card-content">
                  <h4 className="equipe-nome">Rafael de Almeida</h4>
                  <p className="equipe-cargo">Fundador & Head de Inovação</p>
                  <p className="equipe-bio">
                   Idealizador do Garagem Smart, é quem trouxe a visão inicial do projeto e ajuda a guiar seus rumos estratégicos. 
                   Tem perfil criativo e inovador, buscando sempre novas formas de gerar valor para o negócio e seus usuários.
                  </p>
                </div>
              </div>

              {/* Card Membro 2 */}
              <div className="equipe-card">
                <div className="equipe-card-photo">
                  <img src="/images/guilherme.jpg" alt="Guilherme" className="equipe-photo" />
                </div>
                <div className="equipe-card-content">
                  <h4 className="equipe-nome">Guilherme Melo Fleury</h4>
                  <p className="equipe-cargo">Co-Fundador & Head de Negócios</p>
                  <p className="equipe-bio">
                    Responsável pela liderança e pela representação do Garagem Smart em eventos e apresentações. 
                    Atua como porta-voz do projeto, conduzindo negociações e transmitindo a visão da empresa. 
                    Tem foco em crescimento, conexões estratégicas e novos negócios.
                  </p>
                </div>
              </div>

              {/* Card Membro 3 */}
              <div className="equipe-card">
                <div className="equipe-card-photo">
                  <img src="/images/lucio.png" alt="Lúcio" className="equipe-photo" />
                </div>
                <div className="equipe-card-content">
                  <h4 className="equipe-nome">Lúcio de Freitas Pereira</h4>
                  <p className="equipe-cargo">Co-Fundador & Head de Design/Desenvolvimento</p>
                  <p className="equipe-bio">
                 Apaixonado por tecnologia e design, é responsável pelo desenvolvimento e pela experiência digital do Garagem Smart. 
                 Com formação em TI e experiência em análise de dados, encontrou no design UX/UI uma forma de unir criatividade 
                 e funcionalidade.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DEPOIS: Conteúdo do Nosso Projeto */}
          <section className="projeto-section">
            <h3 className="section-title">Nosso Projeto</h3>
            
            <div className="projeto-descricao">
              <p>
                O Garagem Smart é uma plataforma completa e intuitiva desenvolvida para transformar a forma como você cuida do seu veículo. 
                Nascemos da necessidade de simplificar o complexo universo automotivo, oferecendo ferramentas práticas que colocam o 
                conhecimento técnico ao alcance de todos — desde consumidores finais até profissionais do setor.            
              </p>         
            </div>
            
            <div className="projeto-descricao-dois">
              <p>
                O Garagem Smart está em constante evolução. Desde o início, adotamos o compromisso de desenvolver uma plataforma transparente, 
                confiável e alinhada às necessidades reais de quem cuida do próprio veículo. Cada nova funcionalidade nasce de testes contínuos, feedbacks reais e colaboração da nossa comunidade inicial.
                Estamos construindo algo sólido, passo a passo — com seriedade, clareza e foco no que realmente importa: oferecer informações automotivas acessíveis, organizadas e livres de confusão. Se você está aqui agora, já faz parte deste começo e contribui para moldar um serviço pensado para durar.
              </p> 
            </div>
          </section>

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
