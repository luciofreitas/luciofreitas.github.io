import React from 'react';
import MenuLogin from '../components/MenuLogin';
import '../styles/pages/page-NossoProjeto.css';

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
              O Peça Fácil é uma plataforma completa e intuitiva desenvolvida para transformar a forma como você cuida do seu veículo. 
              Nascemos da necessidade de simplificar o complexo universo automotivo, oferecendo ferramentas práticas que colocam o 
              conhecimento técnico ao alcance de todos — desde consumidores finais até profissionais do setor.
              <br /><br />
              <strong>Busca Inteligente de Peças:</strong> Nossa ferramenta de busca foi projetada para eliminar a frustração de encontrar 
              a peça certa. Utilizando um sistema de compatibilidade preciso, você seleciona marca, modelo e ano do seu veículo e recebe 
              apenas as peças que realmente servem. Acabaram-se as compras erradas, devoluções e tempo perdido — cada resultado é verificado 
              e validado para garantir compatibilidade total.
              <br /><br />
              <strong>Tabela FIPE Atualizada:</strong> Tenha acesso instantâneo aos valores de referência do mercado automotivo brasileiro. 
              Nossa Tabela FIPE apresenta preços médios atualizados de centenas de modelos, com filtros por marca, ano e busca por modelo. 
              Seja para comprar, vender ou simplesmente acompanhar a valorização do seu veículo, você tem informações confiáveis a um clique 
              de distância.
              <br /><br />
              <strong>Alertas de Recalls:</strong> A segurança é nossa prioridade. Disponibilizamos uma base completa de recalls automotivos, 
              permitindo que você verifique se o seu veículo possui alguma convocação ativa das montadoras. Mantenha-se informado sobre 
              campanhas de segurança, defeitos identificados e procedimentos de correção — porque dirigir com tranquilidade faz toda a diferença.
              <br /><br />
              <strong>Guias Automotivos Completos:</strong> Oferecemos uma biblioteca rica de guias práticos que cobrem desde conceitos básicos 
              até procedimentos técnicos avançados. Aprenda sobre manutenção preventiva, instalação de componentes, diagnóstico de problemas 
              comuns e muito mais. Nossos guias são escritos em linguagem acessível, com ilustrações e explicações passo a passo para que você 
              ganhe autonomia e confiança no cuidado com seu veículo.
              <br /><br />
              <strong>Conexão com Oficinas Parceiras:</strong> Construímos uma rede de parceiros confiáveis — oficinas, mecânicos e fornecedores 
              verificados que compartilham nosso compromisso com qualidade e transparência. Ao precisar de um serviço especializado, você encontra 
              profissionais qualificados próximos a você, com avaliações reais de outros usuários e a certeza de um atendimento ético.
              <br /><br />
              <strong>Histórico de Manutenção Organizado:</strong> Com o Peça Fácil, você mantém um registro completo de todas as manutenções, 
              trocas de peças e serviços realizados no seu veículo. Esse histórico digital facilita o acompanhamento de revisões periódicas, 
              aumenta o valor de revenda e garante que nenhum cuidado essencial seja esquecido.
              <br /><br />
              <strong>Versão Pro:</strong> Para quem busca ainda mais recursos, nossa Versão Pro oferece funcionalidades exclusivas como 
              notificações personalizadas de recalls, acesso antecipado a novos guias técnicos, suporte prioritário e ferramentas avançadas 
              de gestão de frota — ideal para oficinas, revendedoras e entusiastas que levam a sério o cuidado automotivo.
              <br /><br />
              Em resumo, o Peça Fácil centraliza informações técnicas, preços de mercado, alertas de segurança e conhecimento especializado 
              em uma única plataforma moderna e acessível. Nosso compromisso é entregar economia de tempo e dinheiro, decisões mais informadas 
              e a confiança de que você está fazendo as escolhas certas para o seu veículo. Seja bem-vindo a uma nova era de autonomia e 
              transparência no setor automotivo.
            </p>
          </div>
    </div>
  </div>
    </>
  );
}
