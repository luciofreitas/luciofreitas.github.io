import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MenuLogin } from '../components';
import ProjetoSection from './sobreGaragemSmart/ProjetoSection';
import FuncionalidadesSection from './sobreGaragemSmart/FuncionalidadesSection';
import '../styles/pages/page-SobreGaragemSmart.css';
import '../styles/pages/page-QuemSomos.css';

export default function SobreGaragemSmart() {
  const location = useLocation();

  useEffect(() => {
    const resolveAnchorId = () => {
      // 1) Preferir query param (funciona em HashRouter: /#/rota?scroll=secao)
      try {
        const params = new URLSearchParams(location.search || '');
        const fromQuery = (params.get('scroll') || params.get('section') || '').trim();
        if (fromQuery) return fromQuery;
      } catch {
        // ignore
      }

      // 2) Hash normal (BrowserRouter) ou quando o router preencher location.hash
      const fromRouter = (location.hash || '').replace('#', '').trim();
      if (fromRouter) return fromRouter;

      // Compatibilidade com HashRouter em produção (ex: /#/nosso-projeto#funcionalidades)
      // Nesses casos, o browser só tem um "hash" e o react-router pode não preencher location.hash.
      const rawHash = (typeof window !== 'undefined' && window.location?.hash) ? window.location.hash : '';
      const decodedHash = (() => {
        try { return decodeURIComponent(rawHash); } catch { return rawHash; }
      })();

      // Alguns navegadores/routers transformam o "#" extra em "%23".
      // Ex: "#/nosso-projeto%23funcionalidades" -> queremos "funcionalidades".
      if (decodedHash.includes('%23')) {
        const candidate = decodedHash.split('%23').pop()?.trim() || '';
        if (candidate && !candidate.startsWith('/') && !candidate.includes('/')) return candidate;
      }

      if (decodedHash.includes('#')) {
        const candidate = decodedHash.split('#').pop()?.trim() || '';
        if (candidate && !candidate.startsWith('/') && !candidate.includes('/')) return candidate;
      }

      const rawHref = (typeof window !== 'undefined' && window.location?.href) ? window.location.href : '';
      if (rawHref.includes('#')) {
        const candidate = rawHref.split('#').pop()?.trim() || '';
        if (candidate && !candidate.startsWith('/') && !candidate.includes('/')) return candidate;
      }

      return '';
    };

    const targetId = resolveAnchorId();
    if (!targetId) return;

    let cancelled = false;
    const timeoutIds = [];

    const getScrollBehavior = () => {
      try {
        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        return prefersReducedMotion ? 'auto' : 'smooth';
      } catch {
        return 'smooth';
      }
    };

    const scrollToTarget = (behaviorOverride) => {
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return false;

      const behavior = behaviorOverride || getScrollBehavior();
      // Prefer scrollIntoView para alinhar o elemento de forma consistente.
      // O CSS `scroll-margin-top` ajuda a compensar o header fixo.
      targetEl.scrollIntoView({ behavior, block: 'start' });

      // Ajuste fino (fallback) caso o header fixe ainda cubra o topo.
      const headerEl = document.querySelector('.site-header');
      const headerOffset = headerEl ? headerEl.getBoundingClientRect().height : 0;
      const extraOffset = 12;
      if (headerOffset > 0) {
        const rect = targetEl.getBoundingClientRect();
        const desiredTop = headerOffset + extraOffset;
        const delta = rect.top - desiredTop;
        if (Math.abs(delta) > 2) {
          window.scrollBy({ top: delta, behavior: 'auto' });
        }
      }

      return true;
    };

    // Em mobile, imagens/fontes e a barra de endereço podem mudar o layout após o primeiro scroll.
    // Faz algumas tentativas espaçadas para garantir que o usuário caia exatamente na seção.
    const schedule = (ms, behaviorOverride) => {
      const id = window.setTimeout(() => {
        if (cancelled) return;
        scrollToTarget(behaviorOverride);
      }, ms);
      timeoutIds.push(id);
    };

    schedule(0, 'auto');
    schedule(50);
    schedule(150);
    schedule(350);
    schedule(700);

    const onLoad = () => {
      if (cancelled) return;
      scrollToTarget();
    };
    window.addEventListener('load', onLoad, { once: true });

    return () => {
      cancelled = true;
      timeoutIds.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('load', onLoad);
    };
  }, [location.pathname, location.search, location.hash]);

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
              {/* Card Membro 1 (mantido no código; desativado até ter foto) */}
              {/*
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
              */}

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
          <ProjetoSection />

          <FuncionalidadesSection id="funcionalidades" />

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

