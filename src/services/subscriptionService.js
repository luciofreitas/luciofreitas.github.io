// Serviço para gerenciar assinaturas Pro
const SUBSCRIPTION_KEY = 'pf_pro_subscription';
const EXPIRY_WARNING_SHOWN_KEY = 'pf_pro_warning_shown';

/**
 * Ativa a assinatura Pro para um usuário
 * @param {string} userId - ID do usuário
 * @param {number} durationMonths - Duração em meses (padrão: 1)
 * @returns {Object} Dados da assinatura
 */
export function activateProSubscription(userId, durationMonths = 1) {
  if (!userId) {
    console.error('userId é obrigatório para ativar assinatura');
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  const subscription = {
    userId,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isActive: true,
    plan: 'pro',
    durationMonths
  };

  try {
    const allSubscriptions = JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY) || '{}');
    allSubscriptions[userId] = subscription;
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(allSubscriptions));
    
    // Mantém compatibilidade com código antigo
    localStorage.setItem('versaoProAtiva', 'true');
    
    // Remove flag de aviso mostrado (para próxima assinatura)
    localStorage.removeItem(`${EXPIRY_WARNING_SHOWN_KEY}_${userId}`);
    
    console.log('✅ Assinatura Pro ativada:', subscription);
    return subscription;
  } catch (error) {
    console.error('Erro ao ativar assinatura:', error);
    return null;
  }
}

/**
 * Obtém a assinatura de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Object|null} Dados da assinatura ou null
 */
export function getSubscription(userId) {
  if (!userId) return null;

  try {
    const allSubscriptions = JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY) || '{}');
    const subscription = allSubscriptions[userId];
    
    if (!subscription) return null;

    // Verifica se está expirada
    const now = new Date();
    const expiresAt = new Date(subscription.expiresAt);
    
    if (now > expiresAt) {
      subscription.isActive = false;
      subscription.expired = true;
      // Atualiza no localStorage
      allSubscriptions[userId] = subscription;
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(allSubscriptions));
      // Remove flag de compatibilidade
      localStorage.removeItem('versaoProAtiva');
    }

    return subscription;
  } catch (error) {
    console.error('Erro ao obter assinatura:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem assinatura Pro ativa
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
export function isProActive(userId) {
  if (!userId) return false;
  const subscription = getSubscription(userId);
  return subscription && subscription.isActive && !subscription.expired;
}

/**
 * Calcula quantos dias faltam para expirar
 * @param {string} userId - ID do usuário
 * @returns {number|null} Dias restantes ou null se não houver assinatura
 */
export function getDaysUntilExpiry(userId) {
  if (!userId) return null;

  const subscription = getSubscription(userId);
  if (!subscription || !subscription.isActive) return null;

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);
  const diffTime = expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Verifica se deve mostrar aviso de expiração (1 dia antes)
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
export function shouldShowExpiryWarning(userId) {
  if (!userId) return false;

  const daysLeft = getDaysUntilExpiry(userId);
  if (daysLeft === null || daysLeft > 1) return false;

  // Verifica se já mostrou o aviso hoje
  const warningKey = `${EXPIRY_WARNING_SHOWN_KEY}_${userId}`;
  const lastShown = localStorage.getItem(warningKey);
  
  if (lastShown) {
    const lastShownDate = new Date(lastShown);
    const now = new Date();
    // Se já mostrou hoje, não mostra novamente
    if (lastShownDate.toDateString() === now.toDateString()) {
      return false;
    }
  }

  return true;
}

/**
 * Marca que o aviso de expiração foi mostrado
 * @param {string} userId - ID do usuário
 */
export function markWarningAsShown(userId) {
  if (!userId) return;

  const warningKey = `${EXPIRY_WARNING_SHOWN_KEY}_${userId}`;
  localStorage.setItem(warningKey, new Date().toISOString());
}

/**
 * Cancela/desativa a assinatura
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
export function cancelSubscription(userId) {
  if (!userId) return false;

  try {
    const allSubscriptions = JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY) || '{}');
    if (allSubscriptions[userId]) {
      allSubscriptions[userId].isActive = false;
      allSubscriptions[userId].canceledAt = new Date().toISOString();
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(allSubscriptions));
      
      // Remove flag de compatibilidade
      localStorage.removeItem('versaoProAtiva');
      
      console.log('❌ Assinatura Pro cancelada para:', userId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return false;
  }
}

/**
 * Renova a assinatura (estende por mais X meses)
 * @param {string} userId - ID do usuário
 * @param {number} durationMonths - Duração adicional em meses
 * @returns {Object|null}
 */
export function renewSubscription(userId, durationMonths = 1) {
  if (!userId) return null;

  try {
    const allSubscriptions = JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY) || '{}');
    const currentSubscription = allSubscriptions[userId];

    if (!currentSubscription) {
      // Se não existe, cria uma nova
      return activateProSubscription(userId, durationMonths);
    }

    // Estende a data de expiração
    const expiresAt = new Date(currentSubscription.expiresAt);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    currentSubscription.expiresAt = expiresAt.toISOString();
    currentSubscription.isActive = true;
    currentSubscription.expired = false;
    currentSubscription.renewedAt = new Date().toISOString();

    allSubscriptions[userId] = currentSubscription;
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(allSubscriptions));
    
    // Restaura flag de compatibilidade
    localStorage.setItem('versaoProAtiva', 'true');
    
    // Remove flag de aviso
    localStorage.removeItem(`${EXPIRY_WARNING_SHOWN_KEY}_${userId}`);

    console.log('🔄 Assinatura Pro renovada:', currentSubscription);
    return currentSubscription;
  } catch (error) {
    console.error('Erro ao renovar assinatura:', error);
    return null;
  }
}

/**
 * Formata a data de expiração para exibição
 * @param {string} userId - ID do usuário
 * @returns {string}
 */
export function getFormattedExpiryDate(userId) {
  if (!userId) return '';

  const subscription = getSubscription(userId);
  if (!subscription) return '';

  const expiresAt = new Date(subscription.expiresAt);
  return expiresAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
