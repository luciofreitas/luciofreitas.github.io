// Serviço para gerenciar carros do usuário no localStorage
const STORAGE_KEY = 'pf_user_cars';

/**
 * Obtém todos os carros de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Array} Lista de carros
 */
export function getCars(userId) {
  if (!userId) return [];
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
 */
export function saveCars(userId, cars) {
  if (!userId) return;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[userId] = cars;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Erro ao salvar carros:', error);
  }
}

/**
 * Adiciona um novo carro
 * @param {string} userId - ID do usuário
 * @param {Object} car - Dados do carro (marca, modelo, ano, etc.)
 * @returns {Object} Carro adicionado com ID
 */
export function addCar(userId, car) {
  if (!userId || !car) return null;
  try {
    const cars = getCars(userId);
    const newCar = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...car,
      createdAt: new Date().toISOString()
    };
    cars.push(newCar);
    saveCars(userId, cars);
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
 */
export function removeCar(userId, carId) {
  if (!userId || !carId) return;
  try {
    const cars = getCars(userId).filter(c => c.id !== carId);
    saveCars(userId, cars);
  } catch (error) {
    console.error('Erro ao remover carro:', error);
  }
}

/**
 * Atualiza um carro
 * @param {string} userId - ID do usuário
 * @param {string} carId - ID do carro
 * @param {Object} updates - Dados a atualizar
 */
export function updateCar(userId, carId, updates) {
  if (!userId || !carId || !updates) return;
  try {
    const cars = getCars(userId).map(c => 
      c.id === carId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    saveCars(userId, cars);
  } catch (error) {
    console.error('Erro ao atualizar carro:', error);
  }
}

/**
 * Marca um carro como padrão/favorito
 * @param {string} userId - ID do usuário
 * @param {string} carId - ID do carro
 */
export function setDefaultCar(userId, carId) {
  if (!userId || !carId) return;
  try {
    const cars = getCars(userId).map(c => ({
      ...c,
      isDefault: c.id === carId
    }));
    saveCars(userId, cars);
  } catch (error) {
    console.error('Erro ao definir carro padrão:', error);
  }
}

/**
 * Obtém o carro padrão do usuário
 * @param {string} userId - ID do usuário
 * @returns {Object|null} Carro padrão ou null
 */
export function getDefaultCar(userId) {
  if (!userId) return null;
  try {
    const cars = getCars(userId);
    return cars.find(c => c.isDefault) || null;
  } catch (error) {
    console.error('Erro ao obter carro padrão:', error);
    return null;
  }
}
