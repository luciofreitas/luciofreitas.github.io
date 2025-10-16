import React from 'react';
import MenuLogin from '../components/MenuLogin';
import '../styles/pages/page-QuemSomos.css';

export default function QuemSomos() {
  return (
    <>
    <MenuLogin />
    <div className="page-wrapper">
      <div className="page-content" id="quem-somos">
        <h2 className="page-title">Quem Somos</h2>
          
          <div className="quem-somos-intro">
            <p>
              Conheça nossa história e missão no setor automotivo.
            </p>
          </div>

          <div className="quem-somos-content">
            <p className="quem-somos-body">
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
                  <img src="/fotos-socios/rafael.jpg" alt="Rafael" className="equipe-photo" />
                </div>
                <div className="equipe-card-content">
                  <h4 className="equipe-nome">Rafael de Almeida</h4>
                  <p className="equipe-cargo">Fundador & Head de Inovação</p>
                  <p className="equipe-bio">
                   Idealizador do Peça Fácil, é quem trouxe a visão inicial do projeto e ajuda a guiar seus rumos estratégicos. 
                   Tem perfil criativo e inovador, buscando sempre novas formas de gerar valor para o negócio e seus usuários.
                  </p>
                </div>
              </div>

              {/* Card Membro 2 */}
              <div className="equipe-card">
                <div className="equipe-card-photo">
                  <img src="/fotos-socios/guilherme.jpg" alt="Guilherme" className="equipe-photo" />
                </div>
                <div className="equipe-card-content">
                  <h4 className="equipe-nome">Guilherme Melo Fleury</h4>
                  <p className="equipe-cargo">Co-Fundador & Head de Negócios</p>
                  <p className="equipe-bio">
                    Responsável pela liderança e pela representação do Peça Fácil em eventos e apresentações. 
                    Atua como porta-voz do projeto, conduzindo negociações e transmitindo a visão da empresa. 
                    Tem foco em crescimento, conexões estratégicas e novos negócios.
                  </p>
                </div>
              </div>

              {/* Card Membro 3 */}
              <div className="equipe-card">
                <div className="equipe-card-photo">
                  <img src="/fotos-socios/lucio.jpg" alt="Nome do Membro 3" className="equipe-photo" />
                </div>
                <div className="equipe-card-content">
                  <h4 className="equipe-nome">Lúcio de Freitas Pereira</h4>
                  <p className="equipe-cargo">Co-Fundador & Product Designer/Desenvolvedor</p>
                  <p className="equipe-bio">
                 Apaixonado por tecnologia e design, é responsável pelo desenvolvimento e pela experiência digital do Peça Fácil. 
                 Com formação em TI e experiência em análise de dados, encontrou no design UX/UI uma forma de unir criatividade 
                 e funcionalidade.
                  </p>
                </div>
              </div>
            </div>
          </div>

      </div>
    </div>
    </>
  );
}
