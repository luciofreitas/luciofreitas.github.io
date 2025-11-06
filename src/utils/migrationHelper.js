/**
 * Script de migração de dados do histórico de manutenção
 * Migra de localStorage antigo (manutencoes_email) para novo formato (pf_maintenances)
 */

export function migrateMaintenanceData() {
  try {
    // Pega todos os dados do localStorage
    const allKeys = Object.keys(localStorage);
    const oldMaintenanceKeys = allKeys.filter(key => key.startsWith('manutencoes_'));
    
    if (oldMaintenanceKeys.length === 0) {
      console.log('✅ Nenhum dado antigo de manutenção encontrado');
      return { migrated: 0, total: 0 };
    }

    // Pega ou cria o objeto de manutenções do novo formato
    let newMaintenances = {};
    try {
      newMaintenances = JSON.parse(localStorage.getItem('pf_maintenances') || '{}');
    } catch (e) {
      newMaintenances = {};
    }

    let totalMigrated = 0;
    let totalItems = 0;

    // Migra cada chave antiga
    oldMaintenanceKeys.forEach(oldKey => {
      // Extrai o email do usuário da chave antiga (manutencoes_email@example.com)
      const userId = oldKey.replace('manutencoes_', '');
      
      try {
        const oldData = JSON.parse(localStorage.getItem(oldKey) || '[]');
        
        if (Array.isArray(oldData) && oldData.length > 0) {
          // Se já existem manutenções no novo formato, mescla sem duplicar
          const existingData = newMaintenances[userId] || [];
          const existingIds = new Set(existingData.map(m => m.id));
          
          const newItems = oldData.filter(item => !existingIds.has(item.id));
          
          newMaintenances[userId] = [...existingData, ...newItems];
          totalMigrated += newItems.length;
          totalItems += oldData.length;
          
          console.log(`📦 Migrado ${newItems.length} manutenções para ${userId}`);
        }
      } catch (e) {
        console.error(`❌ Erro ao migrar ${oldKey}:`, e);
      }
    });

    // Salva no novo formato
    if (totalMigrated > 0) {
      localStorage.setItem('pf_maintenances', JSON.stringify(newMaintenances));
      console.log(`✅ Migração concluída: ${totalMigrated} de ${totalItems} manutenções migradas`);
    }

    return { migrated: totalMigrated, total: totalItems };
  } catch (error) {
    console.error('❌ Erro na migração de dados:', error);
    return { migrated: 0, total: 0, error };
  }
}

/**
 * Migra dados de carros antigos (carros_email) para o novo formato
 * Apenas para referência - os carros já devem estar no Supabase
 */
export function migrateOldCarsData() {
  try {
    const allKeys = Object.keys(localStorage);
    const oldCarKeys = allKeys.filter(key => key.startsWith('carros_'));
    
    if (oldCarKeys.length === 0) {
      console.log('✅ Nenhum dado antigo de carros encontrado');
      return { found: 0 };
    }

    console.log(`⚠️ Encontrados ${oldCarKeys.length} registros antigos de carros`);
    console.log('💡 Os carros devem ser cadastrados novamente em "Meus Carros"');
    console.log('📝 IDs dos veículos nas manutenções antigas podem precisar ser atualizados');

    // Lista os carros antigos para referência
    oldCarKeys.forEach(oldKey => {
      const userId = oldKey.replace('carros_', '');
      try {
        const oldCars = JSON.parse(localStorage.getItem(oldKey) || '[]');
        console.log(`👤 ${userId}: ${oldCars.length} carros encontrados`);
      } catch (e) {
        console.error(`❌ Erro ao ler ${oldKey}:`, e);
      }
    });

    return { found: oldCarKeys.length };
  } catch (error) {
    console.error('❌ Erro ao verificar carros antigos:', error);
    return { found: 0, error };
  }
}

// Executa migração automaticamente quando importado
if (typeof window !== 'undefined') {
  // Só executa uma vez
  const migrationKey = 'pf_maintenance_migration_v1';
  if (!localStorage.getItem(migrationKey)) {
    console.log('🔄 Iniciando migração de dados...');
    const result = migrateMaintenanceData();
    const carsCheck = migrateOldCarsData();
    
    // Marca como migrado
    localStorage.setItem(migrationKey, JSON.stringify({
      date: new Date().toISOString(),
      maintenances: result,
      carsFound: carsCheck.found
    }));
    
    console.log('✅ Migração concluída e registrada');
  }
}
