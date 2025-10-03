// guiasService.js - Serviço para gerenciar guias customizados dos usuários Pro

const STORAGE_KEY = 'user_custom_guias';
const EVALUATION_PERIOD_DAYS = 7; // Período de avaliação em dias
const MIN_RATING_THRESHOLD = 3.0; // Nota mínima para manter visível

class GuiasService {
  constructor() {
    this.guias = this.loadGuias();
  }

  // Carregar guias do localStorage
  loadGuias() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
      return [];
    }
  }

  // Salvar guias no localStorage
  saveGuias() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.guias));
    } catch (error) {
      console.error('Erro ao salvar guias:', error);
    }
  }

  // Criar novo guia
  createGuia(guiaData, autorEmail) {
    const newGuia = {
      id: `guia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      autorEmail: autorEmail,
      titulo: guiaData.titulo,
      descricao: guiaData.descricao,
      categoria: guiaData.categoria,
      conteudo: guiaData.conteudo,
      imagem: guiaData.imagem || null,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      ratings: [], // Array de { userEmail, rating, timestamp }
      status: 'ativo', // 'ativo', 'oculto', 'editando'
      views: 0
    };

    this.guias.push(newGuia);
    this.saveGuias();
    return newGuia;
  }

  // Atualizar guia existente
  updateGuia(guiaId, guiaData, autorEmail) {
    const index = this.guias.findIndex(g => g.id === guiaId);
    
    if (index === -1) {
      throw new Error('Guia não encontrado');
    }

    const guia = this.guias[index];
    
    // Verificar se o usuário é o autor
    if (guia.autorEmail !== autorEmail) {
      throw new Error('Apenas o autor pode editar este guia');
    }

    // Atualizar dados
    this.guias[index] = {
      ...guia,
      titulo: guiaData.titulo || guia.titulo,
      descricao: guiaData.descricao || guia.descricao,
      categoria: guiaData.categoria || guia.categoria,
      conteudo: guiaData.conteudo || guia.conteudo,
      imagem: guiaData.imagem !== undefined ? guiaData.imagem : guia.imagem,
      atualizadoEm: new Date().toISOString(),
      status: 'ativo' // Volta para ativo após edição
    };

    this.saveGuias();
    return this.guias[index];
  }

  // Deletar guia
  deleteGuia(guiaId, autorEmail) {
    const guia = this.guias.find(g => g.id === guiaId);
    
    if (!guia) {
      throw new Error('Guia não encontrado');
    }

    if (guia.autorEmail !== autorEmail) {
      throw new Error('Apenas o autor pode deletar este guia');
    }

    this.guias = this.guias.filter(g => g.id !== guiaId);
    this.saveGuias();
    return true;
  }

  // Adicionar avaliação a um guia
  addRating(guiaId, userEmail, rating) {
    const index = this.guias.findIndex(g => g.id === guiaId);
    
    if (index === -1) {
      throw new Error('Guia não encontrado');
    }

    const guia = this.guias[index];
    
    // Remover avaliação anterior do mesmo usuário
    guia.ratings = guia.ratings.filter(r => r.userEmail !== userEmail);
    
    // Adicionar nova avaliação
    guia.ratings.push({
      userEmail,
      rating,
      timestamp: new Date().toISOString()
    });

    // Verificar se precisa ocultar o guia
    this.checkAndUpdateStatus(index);
    
    this.saveGuias();
    return this.guias[index];
  }

  // Calcular média de avaliações
  calculateAverageRating(guia) {
    if (!guia.ratings || guia.ratings.length === 0) {
      return 0;
    }

    const sum = guia.ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / guia.ratings.length;
  }

  // Verificar se está dentro do período de avaliação
  isWithinEvaluationPeriod(guia) {
    const createdDate = new Date(guia.criadoEm);
    const now = new Date();
    const daysPassed = (now - createdDate) / (1000 * 60 * 60 * 24);
    return daysPassed <= EVALUATION_PERIOD_DAYS;
  }

  // Verificar e atualizar status do guia
  checkAndUpdateStatus(guiaIndex) {
    const guia = this.guias[guiaIndex];
    
    // Se ainda está no período de avaliação
    if (this.isWithinEvaluationPeriod(guia)) {
      const avgRating = this.calculateAverageRating(guia);
      
      // Se tem avaliações e média é baixa
      if (avgRating !== null && avgRating < MIN_RATING_THRESHOLD) {
        this.guias[guiaIndex].status = 'oculto';
      }
    }
  }

  // Obter todos os guias visíveis (filtrados por status e usuário)
  getVisibleGuias(currentUserEmail = null) {
    return this.guias.filter(guia => {
      // Autor sempre vê seus próprios guias
      if (currentUserEmail && guia.autorEmail === currentUserEmail) {
        return true;
      }

      // Outros usuários só veem guias ativos
      return guia.status === 'ativo';
    });
  }

  // Obter guia por ID
  getGuiaById(guiaId) {
    // Recarregar do localStorage para garantir dados atualizados
    this.guias = this.loadGuias();
    return this.guias.find(g => g.id === guiaId);
  }

  // Obter guias por autor
  getGuiasByAutor(autorEmail) {
    return this.guias.filter(g => g.autorEmail === autorEmail);
  }

  // Incrementar visualizações
  incrementViews(guiaId) {
    const index = this.guias.findIndex(g => g.id === guiaId);
    
    if (index !== -1) {
      this.guias[index].views = (this.guias[index].views || 0) + 1;
      this.saveGuias();
    }
  }

  // Obter estatísticas do guia
  getGuiaStats(guia) {
    const avgRating = this.calculateAverageRating(guia);
    const isInEvaluation = this.isWithinEvaluationPeriod(guia);
    const daysRemaining = isInEvaluation 
      ? Math.ceil(EVALUATION_PERIOD_DAYS - (new Date() - new Date(guia.criadoEm)) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      averageRating: avgRating,
      totalRatings: guia.ratings ? guia.ratings.length : 0,
      views: guia.views || 0,
      isInEvaluationPeriod: isInEvaluation,
      evaluationDaysRemaining: daysRemaining,
      status: guia.status
    };
  }
}

// Exportar instância única (singleton)
export const guiasService = new GuiasService();
export { MIN_RATING_THRESHOLD, EVALUATION_PERIOD_DAYS };
