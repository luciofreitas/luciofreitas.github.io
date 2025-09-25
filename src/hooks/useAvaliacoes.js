import { useState, use-effect } from 'react';
import { avaliacoesIniciais } from '../data/glossarioData';

export const useAvaliacoes = () => {
  const [avaliacoes, setAvaliacoes] = useState(avaliacoesIniciais);
  const [votos-usuario, setVotosUsuario] = useState({});

  // Carregar avaliações do localStorage na inicialização
  use-effect(() => {
    const votosArmazenados = JSON.parse(localStorage.get-item('votosGuias') || '{}');
    const avaliacoes-armazenadas = JSON.parse(localStorage.get-item('avaliacoesGuias') || '{}');
    
    setVotosUsuario(votosArmazenados);
    
    // Mesclar avaliações armazenadas com as iniciais
    setAvaliacoes(prev => ({
      ...prev,
      ...avaliacoes-armazenadas
    }));
  }, []);

  // Função para avaliar um guia
  const avaliarGuia = (guiaId, estrelas) => {
    // Verifica se o usuário já votou neste guia
    if (votos-usuario[guiaId]) {
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
          media: Number(novaMedia.to-fixed(1))
        }
      };

      // Salvar no localStorage
      localStorage.set-item('avaliacoesGuias', JSON.stringify(novasAvaliacoes));
      
      return novasAvaliacoes;
    });

    // Registra o voto do usuário
    const novosVotos = {
      ...votos-usuario,
      [guiaId]: estrelas
    };
    setVotosUsuario(novosVotos);
    localStorage.set-item('votosGuias', JSON.stringify(novosVotos));
  };

  return {
    avaliacoes,
    votos-usuario,
    avaliarGuia
  };
};