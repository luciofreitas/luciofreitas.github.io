import { useState, useEffect } from 'react';
import { avaliacoesIniciais } from '../data/glossarioData';

export const useAvaliacoes = (userEmail) => {
  const [avaliacoes, setAvaliacoes] = useState(avaliacoesIniciais);
  const [votosUsuario, setVotosUsuario] = useState({});

  // Key for per-user votes in localStorage
  const votosKey = `votosGuias_${userEmail || 'guest'}`;

  // Carregar avaliações do localStorage na inicialização e sempre que o userEmail mudar
  useEffect(() => {
    try {
      const votosArmazenados = JSON.parse(localStorage.getItem(votosKey) || '{}');
      const avaliacoesArmazenadas = JSON.parse(localStorage.getItem('avaliacoesGuias') || '{}');

      setVotosUsuario(votosArmazenados);

      // Mesclar avaliações armazenadas com as iniciais
      setAvaliacoes(prev => ({
        ...prev,
        ...avaliacoesArmazenadas
      }));
    } catch (e) {
      console.warn('[useAvaliacoes] failed to parse stored votes/avaliacoes', e);
    }
  }, [votosKey]);

  // Função para avaliar um guia
  const avaliarGuia = (guiaId, estrelas) => {
    // Permite sobrescrever um voto anterior: se já houver voto do usuário para este guia,
    // atualizamos a soma e a média em vez de bloquear.
    const votoAnterior = votosUsuario && Object.prototype.hasOwnProperty.call(votosUsuario, guiaId)
      ? votosUsuario[guiaId]
      : null;

    setAvaliacoes(prev => {
      const avaliacaoAtual = prev[guiaId] || { total: 0, soma: 0, media: 0 };

      let novoTotal = avaliacaoAtual.total;
      let novaSoma = avaliacaoAtual.soma;

      if (votoAnterior == null) {
        // Primeiro voto do usuário para este guia
        novoTotal = avaliacaoAtual.total + 1;
        novaSoma = avaliacaoAtual.soma + estrelas;
      } else {
        // Usuário está alterando o voto: soma ajustada, total permanece
        novaSoma = avaliacaoAtual.soma - Number(votoAnterior) + Number(estrelas);
      }

      const novaMedia = novoTotal > 0 ? novaSoma / novoTotal : 0;

      const novasAvaliacoes = {
        ...prev,
        [guiaId]: {
          total: novoTotal,
          soma: novaSoma,
          media: Number(novaMedia.toFixed(1))
        }
      };

      // Salvar no localStorage
      try {
        localStorage.setItem('avaliacoesGuias', JSON.stringify(novasAvaliacoes));
      } catch (e) {
        console.warn('[useAvaliacoes] failed to save avaliacoes to localStorage', e);
      }

      return novasAvaliacoes;
    });

    // Registra/atualiza o voto do usuário (sobrescreve se necessário)
    const novosVotos = {
      ...votosUsuario,
      [guiaId]: estrelas
    };
    setVotosUsuario(novosVotos);
    try {
      localStorage.setItem(votosKey, JSON.stringify(novosVotos));
    } catch (e) {
      console.warn('[useAvaliacoes] failed to save votos to localStorage', e);
    }

    // Optimistic: enviar a nova avaliação ao backend (substituição/reavaliação)
    (async () => {
      try {
        console.debug('[useAvaliacoes] POST vote', { guiaId, estrelas, previous: votoAnterior });
        const base = (typeof window !== 'undefined' && window.__API_BASE) ? window.__API_BASE : '';
        const pathUrl = `${base}/api/guias/${encodeURIComponent(guiaId)}/ratings`;
        let resp = await fetch(pathUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: userEmail || null, rating: estrelas })
        });

        // If the server returned 404 or an HTML page (static server), attempt body-based fallback
        const contentType = resp.headers.get('content-type') || '';
        if (resp.status === 404 || /text\/.+html/i.test(contentType)) {
          console.debug('[useAvaliacoes] path-based POST failed or returned HTML, trying body-based fallback');
          const fallbackUrl = `${base}/api/guias/ratings`;
          resp = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guiaId, userEmail: userEmail || null, rating: estrelas })
          });
        }

        if (!resp.ok) {
          const text = await resp.text().catch(() => '<no body>');
          console.warn('[useAvaliacoes] backend rating failed', resp.status, text);
        } else {
          // opcional: re-sincronizar avaliacoes a partir do backend
        }
      } catch (err) {
        console.warn('[useAvaliacoes] failed to POST rating to backend, keeping local fallback:', err);
      }
    })();
  };

  return {
    avaliacoes,
    votosUsuario,
    avaliarGuia
  };
};