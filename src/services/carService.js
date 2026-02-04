// Serviço para gerenciar carros do usuário (DB + localStorage fallback)
const STORAGE_KEY = 'pf_user_cars';

function stripDefaultFlags(cars) {
  try {
    const list = Array.isArray(cars) ? cars : [];
    return list.map((c) => {
      if (!c || typeof c !== 'object') return c;
      // Remove legacy UI-only flags (feature removed)
      // eslint-disable-next-line no-unused-vars
      const { isDefault, ...rest } = c;
      return rest;
    });
  } catch (e) {
    return Array.isArray(cars) ? cars : [];
  }
}

function normalizeUserKey(userId) {
  try {
    return String(userId || '').trim().toLowerCase();
  } catch (e) { return String(userId || ''); }
}

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
    const response = await fetch(`${baseUrl}/api/users/${encodeURIComponent(userId)}/cars-auto`);
    if (response.ok) {
      const cars = await response.json();
      return stripDefaultFlags(cars);
    }

    // If we got an HTTP response but it isn't ok, prefer not to silently fall back in production.
    if (!isLocal()) {
      const text = await response.text().catch(() => '');
      throw new Error(`API getCars failed: ${response.status} ${text || response.statusText}`);
    }
  } catch (error) {
    if (!isLocal()) {
      console.warn('API getCars failed:', error);
      return [];
    }
    console.warn('API getCars failed, falling back to localStorage:', error);
  }
  
  // Fallback para localStorage (normalize user key)
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const key = normalizeUserKey(userId);
    return stripDefaultFlags(all[key] || []);
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

  // Sanitize legacy flags before persisting.
  const sanitizedCars = stripDefaultFlags(cars);
  
  // Tentar API primeiro (tanto em localhost quanto em produção)
  try {
    const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
      || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
    const response = await fetch(`${baseUrl}/api/users/${encodeURIComponent(userId)}/cars`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cars: sanitizedCars })
    });
    if (response.ok) {
      return true;
    }
    const text = await response.text().catch(() => '');
    const err = new Error(`API saveCars failed: ${response.status} ${text || response.statusText}`);
    if (!isLocal()) throw err;
  } catch (error) {
    if (!isLocal()) {
      console.warn('API saveCars failed:', error);
      throw error;
    }
    console.warn('API saveCars failed, falling back to localStorage:', error);
  }
  
  // Fallback para localStorage (normalize user key)
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const key = normalizeUserKey(userId);
    all[key] = sanitizedCars;
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
  
  // Tentar API automática primeiro
  try {
    const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
      || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
    
    const response = await fetch(`${baseUrl}/api/users/${encodeURIComponent(userId)}/cars-auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(car)
    });
    
    if (response.ok) {
      const addedCar = await response.json();
      console.log('🚗 Car added via API automatically:', addedCar);
      return addedCar;
    }

    // If server responded but not ok, don't silently diverge in production.
    const text = await response.text().catch(() => '');
    const err = new Error(`API addCar failed: ${response.status} ${text || response.statusText}`);
    if (!isLocal()) throw err;
  } catch (error) {
    if (!isLocal()) {
      console.warn('Auto API addCar failed:', error);
      throw error;
    }
    console.warn('Auto API addCar failed, falling back to localStorage:', error);
  }
  
  // Fallback localStorage
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
  if (!userId || !carId) {
    console.error('🗑️ removeCar: Missing userId or carId', { userId, carId });
    return false;
  }
  
  console.log(`🗑️ AUTO-REMOVE: Attempting to remove car ${carId} for user ${userId}`);
  
  // Tentar API automática primeiro 
  try {
    const baseUrl = (typeof window !== 'undefined' && window.__API_BASE)
      || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:3001` : '');
    
    const url = `${baseUrl}/api/users/${encodeURIComponent(userId)}/cars-auto/${encodeURIComponent(carId)}`;
    console.log(`🗑️ DELETE URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE'
    });
    
    console.log(`🗑️ DELETE Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('🗑️ Car deleted via API automatically:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error('🗑️ DELETE API failed:', response.status, errorText);
      if (!isLocal()) throw new Error(`API removeCar failed: ${response.status} ${errorText || response.statusText}`);
    }
  } catch (error) {
    if (!isLocal()) {
      console.error('🗑️ API removeCar failed:', error);
      throw error;
    }
    console.error('🗑️ API removeCar failed, falling back to localStorage:', error);
  }
  
  // Fallback localStorage
  console.log('🗑️ Falling back to localStorage removal');
  try {
    const cars = await getCars(userId);
    console.log(`🗑️ Current cars in localStorage: ${cars.length}`);
    const filtered = cars.filter(c => c.id !== carId);
    console.log(`🗑️ Cars after filtering: ${filtered.length}`);
    await saveCars(userId, filtered);
    console.log('🗑️ Car removed from localStorage successfully');
    return true;
  } catch (error) {
    console.error('🗑️ Erro ao remover carro do localStorage:', error);
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
