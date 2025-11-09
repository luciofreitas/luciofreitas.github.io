/**
 * Mercado Livre API Service
 * 
 * This service handles OAuth 2.0 authentication with Mercado Livre API
 * and provides methods to interact with the API.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    const response = await fetch(`${API_URL}/api/ml/auth?userId=${encodeURIComponent(userId)}`);
    
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
    const response = await fetch(`${API_URL}/api/ml/token`, {
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

    const response = await fetch(`${API_URL}/api/ml/refresh`, {
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

    const response = await fetch(`${API_URL}/api/ml/user`, {
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
        await fetch(`${API_URL}/api/ml/revoke`, {
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

export default {
  initiateAuth,
  handleCallback,
  refreshToken,
  getUserInfo,
  disconnect,
  isConnected,
  getConnectionStatus,
  getStoredTokens
};
