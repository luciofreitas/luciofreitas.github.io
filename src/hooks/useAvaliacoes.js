import { useState, useEffect } from 'react';
import { avaliacoesIniciais } from '../data/glossarioData';

export const useAvaliacoes = () => {
  const [avaliacoes, setAvaliacoes] = useState(avaliacoesIniciais);
  const [votosUsuario, setVotosUsuario] = useState({});

  // Carregar avaliações do localStorage na inicialização
  useEffect(() => {
    const votosArmazenados = JSON.parse(localStorage.getItem('votosGuias') || '{}');
    const avaliacoesArmazenadas = JSON.parse(localStorage.getItem('avaliacoesGuias') || '{}');
    
    setVotosUsuario(votosArmazenados);
    
    // Mesclar avaliações armazenadas com as iniciais
    setAvaliacoes(prev => ({
      ...prev,
      ...avaliacoesArmazenadas
    }));
  }, []);

  // Função para avaliar um guia
  const avaliarGuia = (guiaId, estrelas) => {
    // Verifica se o usuário já votou neste guia
    if (votosUsuario[guiaId]) {
      alert('Você já avaliou este guia!');
      return;
    }

    // Atualiza as avaliações
    setAvaliacoes(prev => {
      const avaliacaoAtual = prev[guiaId] || { total: 0, soma: 0, media: 0 };
      const novoTotal = avaliacaoAtual.total + 1;
      const novaSoma = avaliacaoAtual.soma + estrelas;
      const novaMedia = novaSoma / novoTotal;

      const novasAvaliacoes = {
        ...prev,
        [guiaId]: {
          total: novoTotal,
          soma: novaSoma,
          media: Number(novaMedia.toFixed(1))
        }
      };

      // Salvar no localStorage
      localStorage.setItem('avaliacoesGuias', JSON.stringify(novasAvaliacoes));
      
      return novasAvaliacoes;
    });

    // Registra o voto do usuário
    const novosVotos = {
      ...votosUsuario,
      [guiaId]: estrelas
    };
    setVotosUsuario(novosVotos);
    localStorage.setItem('votosGuias', JSON.stringify(novosVotos));
  };

  return {
    avaliacoes,
    votosUsuario,
    avaliarGuia
  };
};