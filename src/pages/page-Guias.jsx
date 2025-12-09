import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ComponenteEstrelas, RatingStars } from '../components';
import { useAvaliacoes } from '../hooks/useAvaliacoes';
import { outrosGuias } from '../data/glossarioData';
import { guiasService } from '../services/guiasService';
import { AuthContext } from '../App';
import '../styles/pages/page-Guias.css';

function PageGuias() {
  const navigate = useNavigate();
  const { usuarioLogado } = useContext(AuthContext) || {};

  // Hook customizado para avaliações dos guias fixos
  const { avaliacoes, votosUsuario, avaliarGuia } = useAvaliacoes(usuarioLogado?.email);

  // Estado para guias customizados
  const [guiasCustomizados, setGuiasCustomizados] = useState([]);

  // Estado para pesquisa
  const [termoPesquisa, setTermoPesquisa] = useState('');

  // Verificar se é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  // Carregar guias customizados
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const guiasVisiveis = await guiasService.getVisibleGuias(usuarioLogado?.email);
        if (mounted) setGuiasCustomizados(guiasVisiveis || []);
      } catch (e) {
        console.error('Erro ao carregar guias visíveis:', e);
        if (mounted) setGuiasCustomizados([]);
      }
    })();
    return () => { mounted = false; };
  }, [usuarioLogado]);

  // Guia do glossário (Luzes do Painel)
  const glossarioGuia = {
    id: 'glossario-automotivo',
    titulo: 'Luzes do Painel',
    subtitulo: 'Entenda os avisos do seu veículo',
    descricao: 'Aprenda sobre as luzes de aviso do painel e o que fazer quando elas acendem.',
    icone: '⚠️',
    categoria: 'Diagnóstico',
    rota: '/guias/luzes-do-painel'
  };

  // Combinar todos os guias fixos
  const guiasFixos = [glossarioGuia, ...outrosGuias];

  // Handler para avaliar guia customizado
  const handleAvaliarGuiaCustomizado = (guiaId, rating) => {
    if (!usuarioLogado?.email) {
      alert('Faça login para avaliar guias');
      return;
    }
    // Update the shared "avaliacoes" state so votosUsuario (from the hook)
    // is updated and the UI shows the user's vote immediately.
    try {
      avaliarGuia(guiaId, rating);
    } catch (err) {
      console.warn('avaliarGuia hook failed:', err);
    }

    // Also persist rating to the guiasService (local/DB) for community guides
    (async () => {
      try {
        const guiaAtualizado = await guiasService.addRating(guiaId, usuarioLogado.email, rating);
        // If server returned aggregate info, merge it into local list
        setGuiasCustomizados(prev => prev.map(g => g.id === guiaId ? { ...g, ...(guiaAtualizado || {}) } : g));
      } catch (err) {
        console.warn('guiaService.addRating failed:', err);
      }
    })();

    // Recarregar guias para atualizar rating and any status changes
    (async () => {
      try {
        const guiasAtualizados = await guiasService.getVisibleGuias(usuarioLogado?.email);
        setGuiasCustomizados(guiasAtualizados || []);
      } catch (err) {
        console.error('Erro ao recarregar guias após avaliação:', err);
      }
    })();

    // Optimistic UI update: increment the ratings count locally so the total
    // avaliações appears immediately (before the background reload completes).
    setGuiasCustomizados(prev => prev.map(g => {
      if (g.id !== guiaId) return g;
      const alreadyVoted = (g.ratings || []).some(r => r.userEmail === usuarioLogado.email);
      if (alreadyVoted) return g; // avoid dup
      const novoRating = { userEmail: usuarioLogado.email, rating, timestamp: new Date().toISOString() };
      return {
        ...g,
        ratings: [...(g.ratings || []), novoRating]
      };
    }));
  };

  // Handler para incrementar visualizações
  const handleVerGuiaCustomizado = (guiaId) => {
    guiasService.incrementViews(guiaId);
    navigate(`/guia/${guiaId}`);
  };

  // Função para filtrar guias baseado no termo de pesquisa
  const filtrarGuias = (guias) => {
    if (!termoPesquisa.trim()) return guias;
    
    const termo = termoPesquisa.toLowerCase().trim();
    return guias.filter(guia => {
      return (
        guia.titulo?.toLowerCase().includes(termo) ||
        guia.subtitulo?.toLowerCase().includes(termo) ||
        guia.descricao?.toLowerCase().includes(termo) ||
        guia.categoria?.toLowerCase().includes(termo)
      );
    });
  };

  // Filtrar guias fixos e customizados
  const guiasFixosFiltrados = filtrarGuias(guiasFixos);
  const guiasCustomizadosFiltrados = filtrarGuias(guiasCustomizados);

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
                  Assinantes <strong>Pro</strong> podem <span className="highlight-orange">criar</span> e <span className="highlight-orange">compartilhar</span> guias customizados com a comunidade.
                  <a 
                    className="btn-seja-pro-inline"
                    href="#/versao-pro"
                  >
                    Versão Pro →
                  </a>
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

          {/* Barra de Pesquisa */}
          <div className="guias-search-section">
            <div className="search-container">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Pesquisar guias por título, descrição ou categoria..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="search-input"
              />
              {termoPesquisa && (
                <button
                  className="clear-search-btn"
                  onClick={() => setTermoPesquisa('')}
                  title="Limpar pesquisa"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Guias Oficiais */}
          <h3 className="section-title">📖 Guias Oficiais</h3>
          {guiasFixosFiltrados.length > 0 ? (
            <div className="guias-grid">
              {guiasFixosFiltrados.map(guia => (
              <div key={guia.id} className="guia-card guia-oficial">
                <div className="guia-header">
                  <div className="guia-icone">{guia.icone}</div>
                  <div className="guia-categoria oficial">{guia.categoria}</div>
                </div>
                
                <div className="guia-content">
                  <div className="guia-info">
                    <h3 className="guia-titulo">{guia.titulo}</h3>
                    <p className="guia-descricao">{guia.subtitulo}</p>
                  </div>
                  
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
          ) : termoPesquisa && (
            <div className="search-no-results">
              <p>Nenhum guia oficial encontrado para "{termoPesquisa}"</p>
            </div>
          )}

          {/* Guias da Comunidade - sempre exibe o título */}
          <h3 className="section-title">� Guias da Comunidade</h3>
          {guiasCustomizadosFiltrados.length > 0 ? (
            <div className="guias-grid">
              {guiasCustomizadosFiltrados.map(guia => {
                const isAutor = usuarioLogado?.email === guia.autorEmail;
                const averageRating = guiasService.calculateAverageRating(guia);
                const isOculto = guia.status === 'oculto';

                return (
                  <div key={guia.id} className={`guia-card guia-comunidade ${isOculto ? 'guia-oculto' : ''} ${(!isPro && !isAutor) ? 'locked' : ''}`}>
                    <div className="guia-header">
                      <div className="guia-icone">📄</div>
                      <div className="guia-categoria comunidade">{guia.categoria || 'MECÂNICA GERAL'}</div>
                      {isAutor && (
                        <div className="guia-author-badge" title="Você é o autor deste guia">
                          👤 Seu Guia
                        </div>
                      )}
                    </div>

                    {guia.imagem && (
                      <div className="guia-imagem">
                        <img src={guia.imagem} alt={guia.titulo} />
                      </div>
                    )}
                    
                    <div className="guia-content">
                      <div className="guia-info">
                        <h3 className="guia-titulo">{guia.titulo}</h3>
                        <p className="guia-descricao">{guia.descricao || 'Guia da comunidade'}</p>
                        
                        {isOculto && isAutor && (
                          <div className="guia-status-warning">
                            ⚠️ Este guia está oculto devido a avaliações baixas. Edite-o para melhorar!
                          </div>
                        )}
                      </div>

                      <div className="guia-avaliacao">
                        {(() => {
                          const stats = guiasService.getGuiaStats(guia);
                          return (
                            <ComponenteEstrelas
                              guiaId={guia.id}
                              mediaAtual={Number((stats.averageRating || 0).toFixed(1))}
                              totalVotos={stats.totalRatings}
                              votosUsuario={votosUsuario}
                              onAvaliar={(id, rating) => handleAvaliarGuiaCustomizado(id, rating)}
                              somenteLeitura={isAutor || !usuarioLogado}
                            />
                          );
                        })()}
                        {guia.views > 0 && (
                          <span className="guia-views">👁️ {guia.views} visualizações</span>
                        )}
                      </div>
                    </div>

                    <div className="guia-footer">
                      {isAutor && (
                        <button 
                          className="btn-editar-guia"
                          onClick={() => navigate(`/criar-guia/${guia.id}`)}
                        >
                          ✏️ Editar
                        </button>
                      )}

                      {/* Locked CTA for non-Pro users (visual only) */}
                      {(!isPro && !isAutor) ? (
                        <div className="guia-locked-wrapper">
                          <button className="btn-locked" onClick={() => navigate('/versao-pro')}>
                            🔒 Somente Pro — Assine para abrir
                          </button>
                        </div>
                      ) : (
                        <span 
                          className="guia-cta" 
                          onClick={() => handleVerGuiaCustomizado(guia.id)}
                        >
                          Ver guia completo →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : termoPesquisa ? (
            <div className="search-no-results">
              <p>Nenhum guia da comunidade encontrado para "{termoPesquisa}"</p>
            </div>
          ) : (
            <p className="guias-empty-message">
              Nenhum guia da comunidade criado ainda. {isPro ? 'Seja o primeiro!' : 'Seja Pro para criar o primeiro guia!'}
            </p>
          )}

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
