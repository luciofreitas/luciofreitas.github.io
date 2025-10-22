import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Menu } from '../components';
import { RatingStars } from '../components';
import { guiasService } from '../services/guiasService';
import { AuthContext } from '../App';
import '../styles/pages/page-VisualizarGuia.css';

function PageVisualizarGuia() {
  const { guiaId } = useParams();
  const navigate = useNavigate();
  const { usuarioLogado } = useContext(AuthContext) || {};
  const [guia, setGuia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Buscar o guia (async) e aplicar verificações de permissão
    let mounted = true;
    let timeoutId = null;

    const load = async () => {
      try {
        setLoadError(null);
        setLoading(true);
        // timeout: se demorar mais que 8s, mostrar erro para o usuário
        timeoutId = setTimeout(() => {
          if (!mounted) return;
          setLoadError('Tempo de carregamento excedido. Verifique sua conexão e tente novamente.');
          setLoading(false);
        }, 8000);

        const guiaEncontrado = await guiasService.getGuiaById(guiaId);

        if (!mounted) return;

        clearTimeout(timeoutId);

        if (!guiaEncontrado) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Verificar se o guia está oculto e se o usuário não é o autor
        if (guiaEncontrado.status === 'oculto' && usuarioLogado?.email !== guiaEncontrado.autorEmail) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Garantir campos mínimos
        guiaEncontrado.descricao = guiaEncontrado.descricao || '';
        guiaEncontrado.conteudo = guiaEncontrado.conteudo || '';
        guiaEncontrado.ratings = guiaEncontrado.ratings || [];
        guiaEncontrado.views = guiaEncontrado.views || 0;

        setGuia(guiaEncontrado);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar guia:', err);
        if (mounted) {
          setLoadError('Erro ao carregar o guia. Veja o console para detalhes.');
          setLoading(false);
        }
      }
    };

    load();

    return () => { mounted = false; if (timeoutId) clearTimeout(timeoutId); };
  }, [guiaId, usuarioLogado]);

  const handleRetry = () => {
    setNotFound(false);
    setLoadError(null);
    setLoading(true);
    // Force reload by invoking effect (change a state) - simplest is to call load via a small helper
    // We'll call guiasService.getGuiaById directly here and re-use the existing logic by navigating to same route
    // which will retrigger the effect because of guiaId dependency. Instead, just trigger a re-render.
    // Use a small state flip to force effect re-run if needed.
    // For simplicity, reload the page (safe and quick for this troubleshooting step).
    window.location.reload();
  };

  const handleAvaliar = (rating) => {
    if (!usuarioLogado?.email) {
      alert('Faça login para avaliar este guia');
      navigate('/login');
      return;
    }

    // Não permite autor avaliar próprio guia
    if (usuarioLogado.email === guia.autorEmail) {
      alert('Você não pode avaliar seu próprio guia');
      return;
    }

    // addRating é síncrono no fallback localStorage e já retorna o guia atualizado
    // usar o retorno imediato evita chamar a versão async getGuiaById sem await
    (async () => {
      try {
        const guiaAtualizado = await guiasService.addRating(guiaId, usuarioLogado.email, rating);
        // If API returned aggregate info, merge it into guia
        setGuia(prev => ({ ...(prev || {}), ...(guiaAtualizado || {}) }));
      } catch (err) {
        console.error('Erro ao avaliar guia:', err);
      }
    })();
  };

  if (loading) {
    return (
      <>
        <Menu />
        <div className="page-wrapper menu-page">
          <div className="page-content">
            <div className="loading-message">Carregando guia...</div>
          </div>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <Menu />
        <div className="page-wrapper menu-page">
          <div className="page-content">
            <div className="not-found-message">
              <h2>⚠️ Problema ao carregar</h2>
              <p>{loadError}</p>
              <div style={{ marginTop: '1rem' }}>
                <button className="btn-voltar" onClick={handleRetry}>Tentar novamente</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Menu />
        <div className="page-wrapper menu-page">
          <div className="page-content">
            <div className="not-found-message">
              <h2>❌ Guia não encontrado</h2>
              <p>O guia que você está procurando não existe ou não está mais disponível.</p>
              <button className="btn-voltar" onClick={() => navigate('/guias')}>
                ← Voltar para Guias
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isAutor = usuarioLogado?.email === guia.autorEmail;
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');
  const averageRating = guiasService.calculateAverageRating(guia);

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page">
        <div className="page-content visualizar-guia">
          {/* Botão voltar */}
          <Link to="/guias" className="voltar-link">← Voltar para Guias</Link>

          {/* Cabeçalho do guia */}
          <div className="guia-header-full">
            <div className="guia-meta">
              <span className="guia-categoria-badge">{guia.categoria}</span>
              {isAutor && (
                <span className="guia-author-badge">👤 Seu Guia</span>
              )}
            </div>
            
            <h1 className="guia-titulo-full">{guia.titulo}</h1>
            
            <div className="guia-info">
              <span className="guia-autor">Por: {guia.autorNome || 'Anônimo'}</span>
              <span className="guia-data">
                Criado em: {new Date(guia.criadoEm).toLocaleDateString('pt-BR')}
              </span>
              {guia.views > 0 && (
                <span className="guia-views">👁️ {guia.views} visualizações</span>
              )}
            </div>

            {/* Sistema de avaliação */}
            <div className="guia-rating-section">
              <RatingStars
                rating={averageRating}
                totalRatings={(guia.ratings && guia.ratings.length) || 0}
                onRate={handleAvaliar}
                readOnly={isAutor || !usuarioLogado}
                size="large"
              />
            </div>
          </div>

          {/* Imagem do guia (se houver) */}
          {guia.imagem && (
            <div className="guia-imagem-full">
              <img src={guia.imagem} alt={guia.titulo} />
            </div>
          )}

          {/* Descrição */}
          <div className="guia-descricao-section">
            <h3>📝 Descrição</h3>
            <p className="guia-descricao-texto">{(!isPro && !isAutor) ? (guia.descricao ? guia.descricao.split('\n').slice(0,2).join('\n') + '...' : '') : guia.descricao}</p>
          </div>

          {/* Conteúdo principal */}
          <div className="guia-conteudo-section">
            <h3>📖 Conteúdo</h3>
            <div className="guia-conteudo-texto">
              {(() => {
                const paragraphs = guia.conteudo.split('\n').filter(Boolean);
                if(!isPro && !isAutor){
                  return paragraphs.slice(0,3).map((p, idx) => <p key={idx}>{p}</p>).concat(
                    <div key="locked-cta" className="visual-lock-cta">
                      <button className="btn-locked" onClick={() => navigate('/versao-pro')}>🔒 Somente Pro — Assine para ler o conteúdo completo</button>
                    </div>
                  );
                }
                return paragraphs.map((paragrafo, index) => (
                  paragrafo.trim() && <p key={index}>{paragrafo}</p>
                ));
              })()}
            </div>
          </div>

          {/* Botão de editar (apenas para o autor) */}
          {isAutor && (
            <div className="guia-actions">
              <button 
                className="btn-editar-guia-full"
                onClick={() => navigate(`/criar-guia/${guiaId}`)}
              >
                ✏️ Editar este guia
              </button>
            </div>
          )}

          {/* Aviso se o guia estiver oculto */}
          {guia.status === 'oculto' && isAutor && (
            <div className="guia-warning-oculto">
              <h3>⚠️ Guia Oculto</h3>
              <p>
                Este guia está oculto devido a avaliações baixas (média abaixo de 2.5 estrelas). 
                Edite o conteúdo para melhorar e aumentar a nota!
              </p>
            </div>
          )}

          {/* Rodapé com informações */}
          <div className="guia-footer-info">
            <p>
              💡 <strong>Dica:</strong> Se este guia foi útil para você, não esqueça de avaliá-lo!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default PageVisualizarGuia;
