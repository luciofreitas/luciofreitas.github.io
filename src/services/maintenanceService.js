// Serviço para gerenciar manutenções (localStorage por enquanto, migrar para Supabase depois)
const STORAGE_KEY = 'pf_maintenances';

function getApiBase() {
  try {
    return window.__API_BASE ? String(window.__API_BASE) : '';
  } catch (e) {
    return '';
  }
}

async function getSupabaseAccessToken() {
  try {
    const mod = await import('../supabase');
    const sb = mod.default || mod.supabase;
    if (!sb || !sb.auth || typeof sb.auth.getSession !== 'function') return null;
    const { data } = await sb.auth.getSession();
    const token = data && data.session && data.session.access_token ? data.session.access_token : null;
    return token ? String(token) : null;
  } catch (e) {
    return null;
  }
}

function getLegacyAccessTokenFromUsuarioLogado() {
  try {
    const raw = localStorage.getItem('usuario-logado');
    if (!raw) return null;
    const u = JSON.parse(raw);
    const legacyToken = u && u.legacy_token ? String(u.legacy_token) : null;
    if (legacyToken && legacyToken.startsWith('gs_')) return legacyToken;

    const token = u && u.access_token ? String(u.access_token) : null;
    if (!token) return null;
    // Legacy sessions created by backend /api/auth/login start with gs_
    return token.startsWith('gs_') ? token : null;
  } catch (e) {
    return null;
  }
}

function getLocalMaintenancesForUser(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const key = normalizeUserKey(userId);
    const list = all && all[key] ? all[key] : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function setLocalMaintenancesForUser(userId, maintenances) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const key = normalizeUserKey(userId);
    all[key] = Array.isArray(maintenances) ? maintenances : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    // ignore
  }
}

function maintenanceSignature(m) {
  try {
    const pick = (v) => String(v == null ? '' : v).trim().toLowerCase();
    return [
      pick(m.data),
      pick(m.tipo),
      pick(m.descricao),
      pick(m.codigoProduto || m.codigo_produto),
      pick(m.kmAtual || m.km_atual),
      pick(m.oficina),
      pick(m.valor),
      pick(m.observacoes),
      pick(m.veiculoId || m.car_id || ''),
      pick(m.veiculoLabel || m.vehicle_label || '')
    ].join('|');
  } catch (e) {
    return '';
  }
}

async function bestEffortSyncLocalToServer({ apiBase, token, userId, serverList }) {
  try {
    if (!apiBase || !token || !userId) return;
    const localList = getLocalMaintenancesForUser(userId);
    if (!localList.length) return;

    const serverSig = new Set((serverList || []).map(maintenanceSignature).filter(Boolean));
    const remaining = [];
    let posted = 0;

    for (const localItem of localList) {
      const sig = maintenanceSignature(localItem);
      if (sig && serverSig.has(sig)) {
        // already present on server; drop from local
        continue;
      }

      // Limit sync work per call to avoid long waits
      if (posted >= 20) {
        remaining.push(localItem);
        continue;
      }

      // Only attempt to sync items that look like local-only records
      const idStr = localItem && localItem.id != null ? String(localItem.id) : '';
      const looksLocal = /^\d{10,}$/.test(idStr) || idStr.startsWith('m_');
      if (!looksLocal) {
        remaining.push(localItem);
        continue;
      }

      try {
        const payload = { ...localItem };
        delete payload.id;
        delete payload.createdAt;
        delete payload.updatedAt;

        const body = await fetchJson(`${apiBase}/api/maintenances`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        const created = body && body.maintenance ? body.maintenance : null;
        if (created) {
          const createdSig = maintenanceSignature(created);
          if (createdSig) serverSig.add(createdSig);
          posted += 1;
          continue; // synced; drop from local
        }
        remaining.push(localItem);
      } catch (e) {
        remaining.push(localItem);
      }
    }

    if (remaining.length !== localList.length) {
      setLocalMaintenancesForUser(userId, remaining);
    }
  } catch (e) {
    // ignore sync failures
  }
}

async function getApiAccessToken() {
  const sb = await getSupabaseAccessToken();
  if (sb) return sb;
  return getLegacyAccessTokenFromUsuarioLogado();
}

async function fetchJson(url, options) {
  const resp = await fetch(url, options);
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = body && body.error ? String(body.error) : `HTTP ${resp.status}`;
    const err = new Error(msg);
    err.status = resp.status;
    err.body = body;
    throw err;
  }
  return body;
}

function normalizeUserKey(userId) {
  try { return String(userId || '').trim().toLowerCase(); } catch (e) { return String(userId || ''); }
}

/**
 * Obtém todas as manutenções de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de manutenções
 */
export async function getMaintenances(userId) {
  if (!userId) return [];

  // Prefer server-side history when available
  try {
    const apiBase = getApiBase();
    const base = apiBase || '';
    const token = await getApiAccessToken();
    if (token) {
      const body = await fetchJson(`${base}/api/maintenances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const list = body && Array.isArray(body.maintenances) ? body.maintenances : [];
      // If the user previously created maintenances offline/without server auth,
      // attempt a best-effort sync now that we have an API token.
      await bestEffortSyncLocalToServer({ apiBase: base, token, userId, serverList: list });
      return list;
    }
  } catch (e) {
    // fallback to localStorage
  }

  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const key = normalizeUserKey(userId);
    return all[key] || [];
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
    const key = normalizeUserKey(userId);
    all[key] = maintenances;
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

  // Prefer server-side history when available
  try {
    const apiBase = getApiBase();
    const base = apiBase || '';
    const token = await getApiAccessToken();
    if (token) {
      const body = await fetchJson(`${base}/api/maintenances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(maintenance)
      });
      return body && body.maintenance ? body.maintenance : null;
    }
  } catch (e) {
    // fallback to localStorage
  }

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

  // Prefer server-side history when available
  try {
    const apiBase = getApiBase();
    const base = apiBase || '';
    const token = await getApiAccessToken();
    if (token) {
      await fetchJson(`${base}/api/maintenances/${encodeURIComponent(String(maintenanceId))}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData)
      });
      return true;
    }
  } catch (e) {
    // fallback to localStorage
  }

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

  // Prefer server-side history when available
  try {
    const apiBase = getApiBase();
    const base = apiBase || '';
    const token = await getApiAccessToken();
    if (token) {
      await fetchJson(`${base}/api/maintenances/${encodeURIComponent(String(maintenanceId))}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return true;
    }
  } catch (e) {
    // fallback to localStorage
  }

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
    // compare as strings to be tolerant
    return allMaintenances.filter(m => String(m.veiculoId) === String(carId));
  } catch (error) {
    console.error('Erro ao carregar manutenções do veículo:', error);
    return [];
  }
}

// Histórico da oficina (para conta profissional) - depende do backend.
export async function getOfficeMaintenances() {
  const apiBase = getApiBase();
  const base = apiBase || '';
  const token = await getApiAccessToken();
  if (!token) {
    try { console.warn('[maintenanceService] getOfficeMaintenances: missing API token'); } catch (e) {}
    throw new Error('Sessão não autenticada. Faça login novamente para ver o histórico da oficina.');
  }
  const body = await fetchJson(`${base}/api/professional/maintenances`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const list = body && Array.isArray(body.maintenances) ? body.maintenances : [];
  return Array.isArray(list) ? list : [];
}
