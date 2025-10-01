import React from 'react';
import MenuLogin from './components/MenuLogin';
import './page-QuemSomos.css';

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
                  <img src="/path/to/rafael.jpg" alt="Rafael" className="equipe-photo" />
                </div>
                <div className="equipe-card-content">
                  <h4 className="equipe-nome">Rafael de Almeida</h4>
                  <p className="equipe-cargo">Fundador & Head de Inovação</p>
                  <p className="equipe-bio">
                    Descrição breve sobre o membro 1. Sua experiência, formação e papel na empresa.
                    Pode incluir conquistas relevantes e áreas de especialização.
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
                    Descrição breve sobre o membro 2. Sua experiência, formação e papel na empresa.
                    Pode incluir conquistas relevantes e áreas de especialização.
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
                    Descrição breve sobre o membro 3. Sua experiência, formação e papel na empresa.
                    Pode incluir conquistas relevantes e áreas de especialização.
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
