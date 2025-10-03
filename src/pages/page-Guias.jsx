import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/Menu';
import ComponenteEstrelas from '../components/ComponenteEstrelas';
import RatingStars from '../components/RatingStars';
import { useAvaliacoes } from '../hooks/useAvaliacoes';
import { outrosGuias } from '../data/glossarioData';
import { guiasService } from '../services/guiasService';
import { AuthContext } from '../App';
import '../styles/pages/page-Guias.css';

function PageGuias() {
  const navigate = useNavigate();
  const { usuarioLogado } = useContext(AuthContext) || {};

  // Hook customizado para avaliações dos guias fixos
  const { avaliacoes, votosUsuario, avaliarGuia } = useAvaliacoes();

  // Estado para guias customizados
  const [guiasCustomizados, setGuiasCustomizados] = useState([]);

  // Verificar se é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  // Carregar guias customizados
  useEffect(() => {
    const guiasVisiveis = guiasService.getVisibleGuias(usuarioLogado?.email);
    setGuiasCustomizados(guiasVisiveis);
  }, [usuarioLogado]);

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

  // Combinar todos os guias fixos
  const guiasFixos = [glossarioGuia, ...outrosGuias];

  // Handler para avaliar guia customizado
  const handleAvaliarGuiaCustomizado = (guiaId, rating) => {
    if (!usuarioLogado?.email) {
      alert('Faça login para avaliar guias');
      return;
    }
    guiasService.addRating(guiaId, usuarioLogado.email, rating);
    // Recarregar guias para atualizar rating
    const guiasAtualizados = guiasService.getVisibleGuias(usuarioLogado?.email);
    setGuiasCustomizados(guiasAtualizados);
  };

  // Handler para incrementar visualizações
  const handleVerGuiaCustomizado = (guiaId) => {
    guiasService.incrementViews(guiaId);
    navigate(`/guia/${guiaId}`);
  };

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

          {/* Aviso sobre criação de guias */}
          {!isPro && (
            <div className="guias-pro-notice">
              <div className="pro-notice-icon">⭐</div>
              <div className="pro-notice-content">
                <h3>Crie seus próprios guias!</h3>
                <p>
                  Assinantes <strong>Pro</strong> podem criar e compartilhar guias customizados com a comunidade.
                  <button 
                    className="btn-seja-pro-inline"
                    onClick={() => navigate('/seja-pro')}
                  >
                    Seja Pro →
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Botão para criar guia (apenas Pro) */}
          {isPro && (
            <div className="criar-guia-section">
              <button 
                className="btn-criar-guia"
                onClick={() => navigate('/criar-guia')}
              >
                ✏️ Criar Novo Guia
              </button>
            </div>
          )}

          {/* Grid de Cards dos Guias Fixos */}
          <h3 className="section-title">📖 Guias Oficiais</h3>
          <div className="guias-grid">
            {/* Todos os cards agora navegam para páginas dedicadas */}
            {guiasFixos.map(guia => (
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

          {/* Grid de Cards dos Guias Fixos */}
          <h3 className="section-title">📖 Guias Oficiais</h3>
          <div className="guias-grid">
            {/* Todos os cards agora navegam para páginas dedicadas */}
            {guiasFixos.map(guia => (
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
