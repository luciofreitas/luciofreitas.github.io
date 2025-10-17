// guiasService.js - Serviço para gerenciar guias customizados dos usuários Pro
// Migrado para usar API com fallback para localStorage

const STORAGE_KEY = 'user_custom_guias';
const EVALUATION_PERIOD_DAYS = 7; // Período de avaliação em dias
const MIN_RATING_THRESHOLD = 3.0; // Nota mínima para manter visível
const PREVIEW_LENGTH = 200; // chars for preview

// Helper para detectar ambiente local
const isLocal = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

function makePreviewText(text){
  if(!text) return '';
  if(text.length <= PREVIEW_LENGTH) return text;
  return text.slice(0, PREVIEW_LENGTH).replace(/\s+\S*$/, '') + '...';
}

class GuiasService {
  constructor() {
    this.guias = [];
  }

  // Carregar guias do backend ou localStorage
  async loadGuias() {
    // Tentar API primeiro (tanto localhost quanto produção)
    try {
      // Resolve base URL at runtime only. Prefer index.html injector (window.__API_BASE).
      // Construct localhost URL only when running on a developer machine.
      const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
        || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
      const url = `${baseUrl}/api/guias`;
      console.debug('[guiasService] loadGuias: baseUrl=', baseUrl);
      console.debug('[guiasService] loadGuias: attempting fetch', url);
      const response = await fetch(url);
      console.debug('[guiasService] loadGuias: response status', response.status);
      if (response.ok) {
        this.guias = await response.json();
        console.debug('[guiasService] loadGuias: received', this.guias && this.guias.length, 'items', this.guias.map(g=>g.id).slice(0,10));
        return this.guias;
      } else {
        let text = '';
        try { text = await response.text(); } catch(e) { text = '<failed to read response text>'; }
        console.warn('[guiasService] loadGuias: non-ok response', response.status, response.statusText, text);
      }
    } catch (error) {
      console.warn('API loadGuias failed, falling back to localStorage:', error);
    }

    // Fallback localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.guias = stored ? JSON.parse(stored) : [];
      return this.guias;
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
      return [];
    }
  }

  // Salvar guias no localStorage (fallback apenas)
  saveGuias() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.guias));
    } catch (error) {
      console.error('Erro ao salvar guias:', error);
    }
  }

  // Criar novo guia
  async createGuia(guiaData, autorEmail) {
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

    // Tentar API primeiro (tanto localhost quanto produção)
    try {
      const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
        || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
      const url = `${baseUrl}/api/guias`;
      console.debug('[guiasService] createGuia: POST', url, newGuia);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuia)
      });
      console.debug('[guiasService] createGuia: response status', response.status);
      if (response.ok) {
        const result = await response.json();
        console.debug('[guiasService] createGuia: created', result);
        await this.loadGuias(); // Recarregar lista
        return newGuia;
      } else {
        console.warn('[guiasService] createGuia: non-ok response', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('API createGuia failed, falling back to localStorage:', error);
    }

    // Fallback localStorage
    this.guias.push(newGuia);
    this.saveGuias();
    return newGuia;
  }

  // Atualizar guia existente
  async updateGuia(guiaId, guiaData, autorEmail) {
    const index = this.guias.findIndex(g => g.id === guiaId);
    
    if (index === -1) {
      throw new Error('Guia não encontrado');
    }

    const guia = this.guias[index];
    
    // Verificar se o usuário é o autor
    if (guia.autorEmail !== autorEmail) {
      throw new Error('Apenas o autor pode editar este guia');
    }

    // Preparar dados atualizados
    const updatedGuia = {
      ...guia,
      titulo: guiaData.titulo || guia.titulo,
      descricao: guiaData.descricao || guia.descricao,
      categoria: guiaData.categoria || guia.categoria,
      conteudo: guiaData.conteudo || guia.conteudo,
      imagem: guiaData.imagem !== undefined ? guiaData.imagem : guia.imagem,
      atualizadoEm: new Date().toISOString(),
      status: 'ativo' // Volta para ativo após edição
    };

    // Tentar API primeiro (tanto localhost quanto produção)
    try {
      const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
        || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
      const response = await fetch(`${baseUrl}/api/guias/${guiaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGuia)
      });
      if (response.ok) {
        await this.loadGuias(); // Recarregar lista
        return updatedGuia;
      }
    } catch (error) {
      console.warn('API updateGuia failed, falling back to localStorage:', error);
    }

    // Fallback localStorage
    this.guias[index] = updatedGuia;
    this.saveGuias();
    return this.guias[index];
  }

  // Deletar guia
  async deleteGuia(guiaId, autorEmail) {
    const guia = this.guias.find(g => g.id === guiaId);
    
    if (!guia) {
      throw new Error('Guia não encontrado');
    }

    if (guia.autorEmail !== autorEmail) {
      throw new Error('Apenas o autor pode deletar este guia');
    }

    // Tentar API primeiro (tanto localhost quanto produção)
    try {
      const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
        || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
      const response = await fetch(`${baseUrl}/api/guias/${guiaId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await this.loadGuias(); // Recarregar lista
        return true;
      }
    } catch (error) {
      console.warn('API deleteGuia failed, falling back to localStorage:', error);
    }

    // Fallback localStorage
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
  async getVisibleGuias(currentUserEmail = null) {
    await this.loadGuias(); // Recarregar do backend/localStorage
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
  async getGuiaById(guiaId) {
    // Recarregar do backend/localStorage para garantir dados atualizados
    await this.loadGuias();
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
