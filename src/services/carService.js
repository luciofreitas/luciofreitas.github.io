// Serviço para gerenciar carros do usuário (DB + localStorage fallback)
const STORAGE_KEY = 'pf_user_cars';

// Helper para detectar se estamos em ambiente local
const isLocal = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

/**
 * Obtém todos os carros de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de carros
 */
export async function getCars(userId) {
  if (!userId) return [];
  
  // Tentar API primeiro (tanto em localhost quanto em produção)
    try {
      const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
        || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
      const response = await fetch(`${baseUrl}/api/users/${encodeURIComponent(userId)}/cars`);
    if (response.ok) {
      const cars = await response.json();
      return cars;
    }
  } catch (error) {
    console.warn('API getCars failed, falling back to localStorage:', error);
  }
  
  // Fallback para localStorage
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[userId] || [];
  } catch (error) {
    console.error('Erro ao carregar carros:', error);
    return [];
  }
}

/**
 * Salva a lista de carros de um usuário
 * @param {string} userId - ID do usuário
 * @param {Array} cars - Lista de carros
 * @returns {Promise<boolean>} Sucesso ou não
 */
export async function saveCars(userId, cars) {
  if (!userId) return false;
  
  // Tentar API primeiro (tanto em localhost quanto em produção)
    try {
      const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
        || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
      const response = await fetch(`${baseUrl}/api/users/${encodeURIComponent(userId)}/cars`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cars })
    });
    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.warn('API saveCars failed, falling back to localStorage:', error);
  }
  
  // Fallback para localStorage
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[userId] = cars;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch (error) {
    console.error('Erro ao salvar carros:', error);
    return false;
  }
}

/**
 * Adiciona um novo carro
 * @param {string} userId - ID do usuário
 * @param {Object} car - Dados do carro (marca, modelo, ano, etc.)
 * @returns {Promise<Object|null>} Carro adicionado com ID
 */
export async function addCar(userId, car) {
  if (!userId || !car) return null;
  try {
    const cars = await getCars(userId);
    const newCar = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...car,
      createdAt: new Date().toISOString()
    };
    cars.push(newCar);
    await saveCars(userId, cars);
    return newCar;
  } catch (error) {
    console.error('Erro ao adicionar carro:', error);
    return null;
  }
}

/**
 * Remove um carro
 * @param {string} userId - ID do usuário
 * @param {string} carId - ID do carro
 * @returns {Promise<boolean>} Sucesso ou não
 */
export async function removeCar(userId, carId) {
  if (!userId || !carId) return false;
  
  // Tentar API primeiro (tanto em localhost quanto em produção)
    try {
      const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
        || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
      const response = await fetch(`${baseUrl}/api/users/${encodeURIComponent(userId)}/cars/${encodeURIComponent(carId)}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.warn('API removeCar failed, falling back to localStorage:', error);
  }
  
  // Fallback localStorage
  try {
    const cars = await getCars(userId);
    const filtered = cars.filter(c => c.id !== carId);
    await saveCars(userId, filtered);
    return true;
  } catch (error) {
    console.error('Erro ao remover carro:', error);
    return false;
  }
}

/**
 * Atualiza um carro
 * @param {string} userId - ID do usuário
 * @param {string} carId - ID do carro
 * @param {Object} updates - Dados a atualizar
 * @returns {Promise<boolean>} Sucesso ou não
 */
export async function updateCar(userId, carId, updates) {
  if (!userId || !carId || !updates) return false;
  try {
    const cars = await getCars(userId);
    const updated = cars.map(c => 
      c.id === carId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    await saveCars(userId, updated);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar carro:', error);
    return false;
  }
}

/**
 * Marca um carro como padrão/favorito
 * @param {string} userId - ID do usuário
 * @param {string} carId - ID do carro
 * @returns {Promise<boolean>} Sucesso ou não
 */
export async function setDefaultCar(userId, carId) {
  if (!userId || !carId) return false;
  try {
    const cars = await getCars(userId);
    const updated = cars.map(c => ({
      ...c,
      isDefault: c.id === carId
    }));
    await saveCars(userId, updated);
    return true;
  } catch (error) {
    console.error('Erro ao definir carro padrão:', error);
    return false;
  }
}

/**
 * Obtém o carro padrão do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object|null>} Carro padrão ou null
 */
export async function getDefaultCar(userId) {
  if (!userId) return null;
  try {
    const cars = await getCars(userId);
    return cars.find(c => c.isDefault) || null;
  } catch (error) {
    console.error('Erro ao obter carro padrão:', error);
    return null;
  }
}
