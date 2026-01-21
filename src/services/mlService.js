/**
 * Mercado Livre API Service
 * 
 * This service handles OAuth 2.0 authentication with Mercado Livre API
 * and provides methods to interact with the API.
 */

function normalizeBaseUrl(url) {
  const trimmed = (url || '').trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : '';
}

function isLikelyDevHostname(hostname) {
  const host = (hostname || '').trim();
  if (!host) return false;
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true;
  if (host.endsWith('.local') || host.endsWith('.lan')) return true;
  if (!host.includes('.')) return true;
  // RFC1918 private IPv4 ranges
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true;
  return false;
}

function getApiBaseUrl() {
  try {
    if (typeof window !== 'undefined') {
      try {
        // Local dev safety: if running on localhost/LAN dev hostnames, force the backend dev server.
        if (window.location && isLikelyDevHostname(window.location.hostname)) {
          return normalizeBaseUrl(`${window.location.protocol}//${window.location.hostname}:3001`);
        }
      } catch (e) {
        // ignore
      }

      if (window.__API_BASE) return normalizeBaseUrl(window.__API_BASE);
      if (window.__RUNTIME_CONFIG__ && window.__RUNTIME_CONFIG__.API_URL) {
        return normalizeBaseUrl(window.__RUNTIME_CONFIG__.API_URL);
      }
    }
  } catch (e) {
    // ignore and fallback
  }

  const env = normalizeBaseUrl(import.meta.env.VITE_API_URL || '');
  return env || 'https://luciofreitas-github-io.onrender.com';
}

let __mlServiceLoggedBase = false;

/**
 * Initiate OAuth authorization flow
 * Redirects user to Mercado Livre authorization page
 * 
 * @param {string} userId - User ID to associate with the connection
 */
export const initiateAuth = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Request authorization URL from backend
    const response = await fetch(`${getApiBaseUrl()}/api/ml/auth?userId=${encodeURIComponent(userId)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initiate ML auth');
    }

    const data = await response.json();
    
    // Store state for verification on callback
    if (data.state) {
      sessionStorage.setItem('ml_oauth_state', data.state);
    }

    // Redirect to ML authorization page
    window.location.href = data.authUrl;

  } catch (error) {
    console.error('Error initiating ML auth:', error);
    throw error;
  }
};

/**
 * Handle OAuth callback by exchanging code for tokens
 * 
 * @param {string} code - Authorization code from ML
 * @param {string} redirectUri - Redirect URI used in authorization
 * @returns {Promise<Object>} Token data
 */
export const handleCallback = async (code, redirectUri) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/ml/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, redirectUri })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to exchange code for token');
    }

    const tokenData = await response.json();

    // Store tokens
    storeTokens(tokenData);

    return tokenData;

  } catch (error) {
    console.error('Error handling ML callback:', error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 * 
 * @returns {Promise<Object>} New token data
 */
export const refreshToken = async () => {
  try {
    const tokenData = getStoredTokens();
    
    if (!tokenData || !tokenData.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${getApiBaseUrl()}/api/ml/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: tokenData.refreshToken })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to refresh token');
    }

    const newTokenData = await response.json();

    // Update stored tokens
    storeTokens(newTokenData);

    return newTokenData;

  } catch (error) {
    console.error('Error refreshing ML token:', error);
    // If refresh fails, clear tokens
    clearTokens();
    throw error;
  }
};

/**
 * Get user info from Mercado Livre
 * 
 * @returns {Promise<Object>} User data
 */
export const getUserInfo = async () => {
  try {
    const tokenData = await getValidToken();

    const response = await fetch(`${getApiBaseUrl()}/api/ml/user`, {
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get user info');
    }

    return await response.json();

  } catch (error) {
    console.error('Error getting ML user info:', error);
    throw error;
  }
};

/**
 * Disconnect Mercado Livre account
 * Clears stored tokens
 */
export const disconnect = async () => {
  try {
    const tokenData = getStoredTokens();
    
    if (tokenData && tokenData.accessToken) {
      // Optionally call revoke endpoint
      try {
        await fetch(`${getApiBaseUrl()}/api/ml/revoke`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.accessToken}`
          }
        });
      } catch (err) {
        // Ignore revoke errors - we'll clear locally anyway
        console.warn('Failed to revoke ML token:', err);
      }
    }

    // Clear local storage
    clearTokens();

  } catch (error) {
    console.error('Error disconnecting ML:', error);
    // Clear tokens even if error
    clearTokens();
    throw error;
  }
};

/**
 * Check if Mercado Livre is connected
 * 
 * @returns {boolean} True if connected
 */
export const isConnected = () => {
  const tokenData = getStoredTokens();
  return !!(tokenData && tokenData.accessToken);
};

/**
 * Get connection status with details
 * 
 * @returns {Object} Connection status
 */
export const getConnectionStatus = () => {
  const tokenData = getStoredTokens();
  
  if (!tokenData || !tokenData.accessToken) {
    return {
      connected: false,
      expired: false
    };
  }

  const isExpired = tokenData.expiresAt && Date.now() > tokenData.expiresAt;

  return {
    connected: true,
    expired: isExpired,
    connectedAt: tokenData.connectedAt,
    expiresAt: tokenData.expiresAt,
    userId: tokenData.userId
  };
};

/**
 * Get server-side connection status.
 * This uses the app's Supabase access token (not the Mercado Livre token).
 *
 * @param {Object} options
 * @param {string} options.authToken - Supabase access token
 * @param {string} [options.userId] - optional (dev convenience)
 */
export const getServerConnectionStatus = async ({ authToken, userId } = {}) => {
  try {
    const params = new URLSearchParams();
    if (userId) params.set('userId', String(userId));
    const qs = params.toString();

    const response = await fetch(`${getApiBaseUrl()}/api/ml/status${qs ? `?${qs}` : ''}`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : undefined
    });

    if (!response.ok) {
      return { connected: false, expired: false };
    }

    const data = await response.json().catch(() => ({}));
    return {
      connected: !!data.connected,
      expired: !!data.expired,
      connectedAt: data.connectedAt || null,
      expiresAt: data.expiresAt || null,
      userId: data.userId || null,
      scope: data.scope || null
    };
  } catch (e) {
    return { connected: false, expired: false };
  }
};

/**
 * Disconnect ML account server-side (deletes stored tokens).
 * Uses the app's Supabase access token (not the Mercado Livre token).
 */
export const disconnectServer = async ({ authToken, userId } = {}) => {
  const params = new URLSearchParams();
  if (userId) params.set('userId', String(userId));
  const qs = params.toString();
  await fetch(`${getApiBaseUrl()}/api/ml/disconnect${qs ? `?${qs}` : ''}`, {
    method: 'POST',
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : undefined
  }).catch(() => null);

  // Clear any legacy local tokens too
  try { localStorage.removeItem('ml_token_data'); } catch (e) {}
  try { sessionStorage.removeItem('ml_oauth_state'); } catch (e) {}
};

// Helper functions

/**
 * Get valid access token, refreshing if necessary
 * 
 * @returns {Promise<Object>} Token data
 */
const getValidToken = async () => {
  let tokenData = getStoredTokens();

  if (!tokenData || !tokenData.accessToken) {
    throw new Error('Not connected to Mercado Livre');
  }

  // Check if token is expired or about to expire (5 min buffer)
  const expiringThreshold = Date.now() + (5 * 60 * 1000);
  if (tokenData.expiresAt && tokenData.expiresAt < expiringThreshold) {
    console.log('Token expired or expiring soon, refreshing...');
    tokenData = await refreshToken();
  }

  return tokenData;
};

/**
 * Store tokens in localStorage
 * 
 * @param {Object} tokenData - Token data to store
 */
const storeTokens = (tokenData) => {
  const dataToStore = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + (tokenData.expires_in * 1000),
    tokenType: tokenData.token_type,
    scope: tokenData.scope,
    userId: tokenData.user_id,
    connectedAt: new Date().toISOString()
  };

  localStorage.setItem('ml_token_data', JSON.stringify(dataToStore));
  console.log('ML tokens stored successfully');
};

/**
 * Get stored tokens from localStorage
 * 
 * @returns {Object|null} Token data or null if not found
 */
export const getStoredTokens = () => {
  try {
    const data = localStorage.getItem('ml_token_data');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error parsing stored ML tokens:', error);
    return null;
  }
};

/**
 * Clear stored tokens
 */
const clearTokens = () => {
  localStorage.removeItem('ml_token_data');
  sessionStorage.removeItem('ml_oauth_state');
  console.log('ML tokens cleared');
};

// ========================================
// Product Search Functions (Public API)
// ========================================

// Cache to prevent infinite loops on API errors
let lastMLError = null;
let consecutiveErrors = 0;
const ML_ERROR_COOLDOWN = 30000; // 30 seconds cooldown after error
const MAX_CONSECUTIVE_ERRORS = 3; // After 3 consecutive errors, stop trying for longer
const EXTENDED_COOLDOWN = 300000; // 5 minutes after multiple failures

/**
 * Search products on Mercado Livre
 * Public API - does not require authentication
 * 
 * @param {string} query - Search query (e.g., "pastilha freio gol")
 * @param {Object} options - Search options
 * @param {number} options.limit - Number of results (default: 50)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @param {string} options.category - Category ID to filter
 * @returns {Promise<Object>} Search results
 */
export const searchProducts = async (query, options = {}) => {
  try {
    // Check if we're in cooldown period after an error
    const cooldownPeriod = consecutiveErrors >= MAX_CONSECUTIVE_ERRORS ? EXTENDED_COOLDOWN : ML_ERROR_COOLDOWN;
    
    if (lastMLError && (Date.now() - lastMLError) < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - (Date.now() - lastMLError)) / 1000);
      console.warn(`⏸️ ML API em cooldown. Tentando novamente em ${remainingTime}s. Usando dados locais.`);
      throw new Error('ML API temporarily unavailable, using local data');
    }

    if (!query) {
      throw new Error('Search query is required');
    }

    const { limit = 50, offset = 0, category } = options;

    // Build query params
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (category) {
      params.set('category', category);
    }

    const qs = params.toString();
    // In local dev, never call the hosted backend for ML search. Prefer local backend or soft-fail.
    const base = (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : getApiBaseUrl();

    if (!__mlServiceLoggedBase) {
      __mlServiceLoggedBase = true;
      try { console.log('[mlService] using API base', base); } catch (e) {}
    }
    const response = await fetch(`${base}/api/ml/products/search${qs ? `?${qs}` : ''}`);

    if (!response.ok) {
      // Set error timestamp to prevent repeated failed requests
      lastMLError = Date.now();
      consecutiveErrors++;

      // Soft-fail for block/rate-limit/unavailable: let UI keep working.
      if ([403, 429, 503].includes(response.status)) {
        return {
          products: [],
          total: 0,
          paging: { total: 0, offset: 0, limit: 0 },
          filters: [],
          availableFilters: [],
          warning: 'Busca no Mercado Livre indisponível no momento.'
        };
      }
      
      const errorData = await response.json().catch(() => ({ error: 'API error' }));
      
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`🔴 ML API falhou ${consecutiveErrors} vezes consecutivas. Pausando por 5 minutos.`);
      } else {
        console.warn(`⚠️ ML API erro ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}. Pausando por 30s.`);
      }
      
      throw new Error(errorData.error || 'Failed to search products');
    }

    // Clear error on success
    lastMLError = null;
    consecutiveErrors = 0;

    const data = await response.json();

    return {
      products: data.results || [],
      total: data.total || 0,
      paging: data.paging || {},
      filters: data.filters || [],
      availableFilters: data.available_filters || []
    };

  } catch (error) {
    // Soft-fail on network errors / local backend down so the UI can fall back to local data.
    console.warn('Error searching ML products (soft):', error && error.message ? error.message : error);
    return {
      products: [],
      total: 0,
      paging: { total: 0, offset: 0, limit: 0 },
      filters: [],
      availableFilters: [],
      warning: 'Busca no Mercado Livre indisponível no momento.'
    };
  }
};

/**
 * Get product details by ID
 * Public API - does not require authentication
 * 
 * @param {string} productId - ML product ID (e.g., "MLB123456789")
 * @returns {Promise<Object>} Product details
 */
export const getProductDetails = async (productId) => {
  try {
    // Check cooldown
    if (lastMLError && (Date.now() - lastMLError) < ML_ERROR_COOLDOWN) {
      throw new Error('ML API temporarily unavailable');
    }

    if (!productId) {
      throw new Error('Product ID is required');
    }

    const response = await fetch(`${getApiBaseUrl()}/api/ml/products/${productId}`);

    if (!response.ok) {
      lastMLError = Date.now();
      const errorData = await response.json().catch(() => ({ error: 'API error' }));
      throw new Error(errorData.error || 'Failed to get product details');
    }

    lastMLError = null;
    return await response.json();

  } catch (error) {
    console.error('Error getting ML product details:', error);
    throw error;
  }
};

/**
 * Search products by category
 * Public API - does not require authentication
 * 
 * @param {string} categoryId - ML category ID
 * @param {Object} options - Search options
 * @param {number} options.limit - Number of results (default: 50)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} Search results
 */
export const searchByCategory = async (categoryId, options = {}) => {
  try {
    // Check cooldown
    if (lastMLError && (Date.now() - lastMLError) < ML_ERROR_COOLDOWN) {
      throw new Error('ML API temporarily unavailable');
    }

    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    const { limit = 50, offset = 0 } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    const qs = params.toString();
    const response = await fetch(`${getApiBaseUrl()}/api/ml/products/category/${categoryId}${qs ? `?${qs}` : ''}`);

    if (!response.ok) {
      lastMLError = Date.now();
      const errorData = await response.json().catch(() => ({ error: 'API error' }));
      throw new Error(errorData.error || 'Failed to search by category');
    }

    lastMLError = null;
    const data = await response.json();

    return {
      products: data.results || [],
      total: data.total || 0,
      paging: data.paging || {},
      filters: data.filters || [],
      availableFilters: data.available_filters || []
    };

  } catch (error) {
    console.error('Error searching ML by category:', error);
    throw error;
  }
};

/**
 * Get product compatibilities (fitment) by item id.
 * Notes:
 * - Depending on the listing, Mercado Livre may require an authenticated token to access compatibilities.
 * - Backend will try to use the stored token for the current app user (if available).
 *
 * @param {string} productId - ML item id (e.g., "MLB123456789")
 * @param {Object} options
 * @param {string} options.userId - App user id to resolve stored ML token server-side
 * @returns {Promise<Object>} Compatibilities response
 */
export const getProductCompatibilities = async (productId, options = {}) => {
  try {
    // Check cooldown
    if (lastMLError && (Date.now() - lastMLError) < ML_ERROR_COOLDOWN) {
      throw new Error('ML API temporarily unavailable');
    }

    if (!productId) {
      throw new Error('Product ID is required');
    }

    const params = new URLSearchParams();
    if (options.userId) params.set('userId', String(options.userId));

    const qs = params.toString();
    const headers = {};
    // Pass Supabase access token so the backend can resolve the user and use stored ML tokens.
    if (options.authToken) headers['Authorization'] = `Bearer ${String(options.authToken)}`;

    const response = await fetch(`${getApiBaseUrl()}/api/ml/products/${encodeURIComponent(productId)}/compatibilities${qs ? `?${qs}` : ''}`, {
      headers: Object.keys(headers).length ? headers : undefined
    });

    if (!response.ok) {
      lastMLError = Date.now();
      if ([401, 403, 404, 429, 503].includes(response.status)) {
        return { products: [], warning: 'Compatibilidade não disponível para este anúncio.' };
      }
      const errorData = await response.json().catch(() => ({ error: 'API error' }));
      throw new Error(errorData.error || 'Failed to get product compatibilities');
    }

    lastMLError = null;
    return await response.json();
  } catch (error) {
    console.warn('Error getting ML product compatibilities (soft):', error && error.message ? error.message : error);
    return { products: [], warning: 'Compatibilidade não disponível para este anúncio.' };
  }
};

/**
 * Build automotive part search query
 * Helper to create optimized search queries for car parts
 * 
 * @param {Object} partInfo - Part information
 * @param {string} partInfo.partName - Part name (e.g., "pastilha de freio")
 * @param {string} partInfo.brand - Car brand (e.g., "volkswagen")
 * @param {string} partInfo.model - Car model (e.g., "gol")
 * @param {string} partInfo.year - Car year (e.g., "2015")
 * @returns {string} Optimized search query
 */
export const buildPartSearchQuery = (partInfo) => {
  const { partName, brand, model, year } = partInfo;
  
  let query = partName || '';
  
  if (brand) {
    query += ` ${brand}`;
  }
  
  if (model) {
    query += ` ${model}`;
  }
  
  if (year) {
    query += ` ${year}`;
  }
  
  return query.trim();
};

export default {
  // Authentication
  initiateAuth,
  handleCallback,
  refreshToken,
  getUserInfo,
  disconnect,
  isConnected,
  getConnectionStatus,
  getStoredTokens,
  
  // Product Search (Public)
  searchProducts,
  getProductDetails,
  getProductCompatibilities,
  searchByCategory,
  buildPartSearchQuery
};
