import React from 'react';
import MenuLogin from './components/MenuLogin';
import './page-NossoProjeto.css';

export default function NossoProjeto() {
  return (
    <>
  <MenuLogin />
  <div className="page-wrapper">
    <div className="page-content" id="nosso-projeto">
      <h2 className="page-title">Nosso Projeto</h2>
          
          <div className="nossoprojeto-intro">
            <p>
              Conheça o Peça Fácil - nossa solução para compatibilidade automotiva.
            </p>
          </div>

          <div className="nosso-projeto-content">
            <p className="nosso-projeto-body">
              O Peça Fácil é uma plataforma que organiza e apresenta informações de compatibilidade de peças automotivas, simplificando
              decisões de compra e manutenção para usuários e profissionais. Financeiramente, o projeto reduz custos ao diminuir compras
              equivocadas e devoluções: ao indicar peças realmente compatíveis, evitamos gastos com itens inadequados e tempo perdido em
              trocas, o que se traduz em economia direta para consumidores e oficinas e em menor capital parado para o comércio de peças.
              Em termos de tempo, oferecemos uma busca mais rápida e precisa — técnicos e consumidores não precisam mais pesquisar múltiplas
              fontes ou consultar catálogos confusos: a plataforma centraliza as opções compatíveis, encurtando o ciclo de identificação e
              aquisição da peça necessária. Quanto à confiabilidade das informações, o sistema combina dados técnicos e referências de mercado
              para apresentar resultados transparentes e verificáveis; mantemos rastreabilidade das fontes e atualizações constantes para
              reduzir dúvidas e aumentar a segurança nas escolhas. Nosso compromisso é entregar uma ferramenta prática, confiável e acessível,
              que gere economia de tempo e dinheiro e ajude a profissionalizar a tomada de decisão no setor automotivo.
            </p>
          </div>
    </div>
  </div>
    </>
  );
}
