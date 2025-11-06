// Serviço para gerenciar manutenções (localStorage por enquanto, migrar para Supabase depois)
const STORAGE_KEY = 'pf_maintenances';

/**
 * Obtém todas as manutenções de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de manutenções
 */
export async function getMaintenances(userId) {
  if (!userId) return [];
  
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[userId] || [];
  } catch (error) {
    console.error('Erro ao carregar manutenções:', error);
    return [];
  }
}

/**
 * Salva a lista de manutenções de um usuário
 * @param {string} userId - ID do usuário
 * @param {Array} maintenances - Lista de manutenções
 * @returns {Promise<boolean>} Sucesso ou não
 */
export async function saveMaintenances(userId, maintenances) {
  if (!userId) return false;
  
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[userId] = maintenances;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch (error) {
    console.error('Erro ao salvar manutenções:', error);
    return false;
  }
}

/**
 * Adiciona uma nova manutenção
 * @param {string} userId - ID do usuário
 * @param {Object} maintenance - Dados da manutenção
 * @returns {Promise<Object|null>} Manutenção adicionada com ID
 */
export async function addMaintenance(userId, maintenance) {
  if (!userId || !maintenance) return null;
  
  try {
    const maintenances = await getMaintenances(userId);
    const newMaintenance = {
      ...maintenance,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updated = [...maintenances, newMaintenance];
    await saveMaintenances(userId, updated);
    return newMaintenance;
  } catch (error) {
    console.error('Erro ao adicionar manutenção:', error);
    return null;
  }
}

/**
 * Atualiza uma manutenção existente
 * @param {string} userId - ID do usuário
 * @param {string} maintenanceId - ID da manutenção
 * @param {Object} updatedData - Dados atualizados
 * @returns {Promise<boolean>} Sucesso ou não
 */
export async function updateMaintenance(userId, maintenanceId, updatedData) {
  if (!userId || !maintenanceId) return false;
  
  try {
    const maintenances = await getMaintenances(userId);
    const updated = maintenances.map(m => 
      m.id === maintenanceId ? { ...m, ...updatedData, updatedAt: new Date().toISOString() } : m
    );
    
    await saveMaintenances(userId, updated);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    return false;
  }
}

/**
 * Remove uma manutenção
 * @param {string} userId - ID do usuário
 * @param {string} maintenanceId - ID da manutenção
 * @returns {Promise<boolean>} Sucesso ou não
 */
export async function deleteMaintenance(userId, maintenanceId) {
  if (!userId || !maintenanceId) return false;
  
  try {
    const maintenances = await getMaintenances(userId);
    const updated = maintenances.filter(m => m.id !== maintenanceId);
    
    await saveMaintenances(userId, updated);
    return true;
  } catch (error) {
    console.error('Erro ao deletar manutenção:', error);
    return false;
  }
}

/**
 * Obtém manutenções de um veículo específico
 * @param {string} userId - ID do usuário
 * @param {string} carId - ID do veículo
 * @returns {Promise<Array>} Lista de manutenções do veículo
 */
export async function getMaintenancesByCar(userId, carId) {
  if (!userId || !carId) return [];
  
  try {
    const allMaintenances = await getMaintenances(userId);
    return allMaintenances.filter(m => m.veiculoId === carId);
  } catch (error) {
    console.error('Erro ao carregar manutenções do veículo:', error);
    return [];
  }
}
