import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Menu from '../components/Menu';
import RatingStars from '../components/RatingStars';
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

  useEffect(() => {
    // Buscar o guia (async) e aplicar verificações de permissão
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const guiaEncontrado = await guiasService.getGuiaById(guiaId);

        if (!mounted) return;

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
          setNotFound(true);
          setLoading(false);
        }
      }
    })();

    return () => { mounted = false; };
  }, [guiaId, usuarioLogado]);

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

    guiasService.addRating(guiaId, usuarioLogado.email, rating);
    
    // Atualizar o guia
    const guiaAtualizado = guiasService.getGuiaById(guiaId);
    setGuia(guiaAtualizado);
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
                totalRatings={guia.ratings.length}
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
            <p className="guia-descricao-texto">{guia.descricao}</p>
          </div>

          {/* Conteúdo principal */}
          <div className="guia-conteudo-section">
            <h3>📖 Conteúdo</h3>
            <div className="guia-conteudo-texto">
              {guia.conteudo.split('\n').map((paragrafo, index) => (
                paragrafo.trim() && <p key={index}>{paragrafo}</p>
              ))}
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
