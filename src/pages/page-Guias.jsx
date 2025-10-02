import React from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/Menu';
import ComponenteEstrelas from '../components/ComponenteEstrelas';
import { useAvaliacoes } from '../hooks/useAvaliacoes';
import { outrosGuias } from '../data/glossarioData';
import '../styles/pages/page-Guias.css';

function PageGuias() {
  const navigate = useNavigate();

  // Hook customizado para avaliações
  const { avaliacoes, votosUsuario, avaliarGuia } = useAvaliacoes();

  // Guia do glossário (Luzes do Painel)
  const glossarioGuia = {
    id: 'glossario-automotivo',
    titulo: 'Luzes do Painel',
    subtitulo: 'Entenda os avisos do seu veículo',
    descricao: 'Aprenda sobre as luzes de aviso do painel e o que fazer quando elas acendem.',
    icone: '⚠️',
    categoria: 'Diagnóstico',
    rota: '/luzes-do-painel'
  };

  // Combinar todos os guias
  const todosGuias = [glossarioGuia, ...outrosGuias];

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page">
        <div className="page-content">
          <h2 className="page-title">Guias</h2>
          
          <div className="guias-intro-wrapper">
            <div className="guias-intro">
              <p>
                Encontre guias completos sobre manutenção, diagnóstico, peças e tudo relacionado ao seu veículo.
              </p>
            </div>
          </div>

          {/* Grid de Cards dos Guias */}
          <div className="guias-grid">
            {/* Todos os cards agora navegam para páginas dedicadas */}
            {todosGuias.map(guia => (
              <div key={guia.id} className="guia-card">
                <div className="guia-header">
                  <div className="guia-icone">{guia.icone}</div>
                  <div className="guia-categoria">{guia.categoria}</div>
                </div>
                
                <div className="guia-content">
                  <h3 className="guia-titulo">{guia.titulo}</h3>
                  <p className="guia-subtitulo">{guia.subtitulo}</p>
                  <p className="guia-descricao">{guia.descricao}</p>
                  
                  {/* Sistema de Avaliação */}
                  <div className="guia-avaliacao">
                    <ComponenteEstrelas 
                      guiaId={guia.id}
                      mediaAtual={avaliacoes[guia.id]?.media || 0}
                      totalVotos={avaliacoes[guia.id]?.total || 0}
                      votosUsuario={votosUsuario}
                      onAvaliar={avaliarGuia}
                    />
                  </div>
                </div>

                <div className="guia-footer">
                  <span className="guia-cta" onClick={() => navigate(guia.rota)}>
                    Ver guia completo →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Informações adicionais */}
          <div className="guias-footer">
            <div className="info-section">
              <h3>💡 Dica</h3>
              <p>
                Nossos guias são atualizados regularmente com as melhores práticas 
                e informações mais recentes do setor automotivo. Marque esta página 
                nos favoritos para consultar sempre que precisar!
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default PageGuias;
