const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fetch = require('node-fetch');

// Mercado Livre OAuth 2.0 Configuration
const ML_CLIENT_ID = process.env.MERCADO_LIVRE_CLIENT_ID;
const ML_CLIENT_SECRET = process.env.MERCADO_LIVRE_CLIENT_SECRET;
const ML_REDIRECT_URI = process.env.MERCADO_LIVRE_REDIRECT_URI || 'https://projeto-automotivo-bc7ae.firebaseapp.com/__/auth/handler';
const ML_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const ML_API_BASE = 'https://api.mercadolibre.com';

// In-memory store for OAuth states (for CSRF protection)
// In production, use Redis or database
const oauthStates = new Map();

/**
 * Initiate OAuth flow
 * GET /api/ml/auth?userId=<userId>
 */
router.get('/auth', (req, res) => {
  try {
    if (!ML_CLIENT_ID) {
      return res.status(503).json({ error: 'ML credentials not configured' });
    }

    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.set(state, { userId, createdAt: Date.now() });

    // Clean old states (older than 10 minutes)
    const now = Date.now();
    for (const [key, value] of oauthStates.entries()) {
      if (now - value.createdAt > 10 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }

    // Build authorization URL
    const authUrl = new URL(ML_AUTH_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', ML_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', ML_REDIRECT_URI);
    authUrl.searchParams.set('state', state);

    console.log(`ML OAuth initiated for userId=${userId}, state=${state}`);

    res.json({ 
      authUrl: authUrl.toString(),
      state 
    });
  } catch (error) {
    console.error('ML auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle OAuth callback
 * GET /api/ml/callback?code=<code>&state=<state>
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check for OAuth error
    if (error) {
      console.error('ML OAuth error:', error);
      return res.redirect(`https://garagemsmart.com.br/#/configuracoes?ml_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'code and state required' });
    }

    // Verify state (CSRF protection)
    const storedState = oauthStates.get(state);
    if (!storedState) {
      return res.status(400).json({ error: 'Invalid state' });
    }

    oauthStates.delete(state);

    // Exchange code for access token
    const tokenResponse = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code: code,
        redirect_uri: ML_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('ML token exchange failed:', errorText);
      return res.redirect(`https://garagemsmart.com.br/#/configuracoes?ml_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    console.log(`ML OAuth successful for userId=${storedState.userId}`);

    // Redirect to frontend with success - usando garagemsmart.com.br
    const redirectUrl = `https://garagemsmart.com.br/#/ml/callback?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}&expires_in=${tokenData.expires_in}&userId=${storedState.userId}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('ML callback error:', error);
    res.redirect(`https://garagemsmart.com.br/#/configuracoes?ml_error=internal_error`);
  }
});

/**
 * Exchange authorization code for access token
 * POST /api/ml/token
 * Body: { code, redirectUri }
 */
router.post('/token', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'code required' });
    }

    const tokenResponse = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri || ML_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('ML token exchange failed:', errorText);
      return res.status(500).json({ error: 'Token exchange failed', details: errorText });
    }

    const tokenData = await tokenResponse.json();

    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      user_id: tokenData.user_id
    });
  } catch (error) {
    console.error('ML token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Refresh access token
 * POST /api/ml/refresh
 * Body: { refresh_token }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token required' });
    }

    const tokenResponse = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        refresh_token: refresh_token
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('ML token refresh failed:', errorText);
      return res.status(500).json({ error: 'Token refresh failed', details: errorText });
    }

    const tokenData = await tokenResponse.json();

    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });
  } catch (error) {
    console.error('ML refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user info from ML
 * GET /api/ml/user
 * Headers: Authorization: Bearer <access_token>
 */
router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const accessToken = authHeader.split(' ')[1];

    const userResponse = await fetch(`${ML_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('ML user info failed:', errorText);
      return res.status(userResponse.status).json({ error: 'Failed to get user info' });
    }

    const userData = await userResponse.json();
    res.json(userData);
  } catch (error) {
    console.error('ML user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Revoke access token
 * POST /api/ml/revoke
 * Headers: Authorization: Bearer <access_token>
 */
router.post('/revoke', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const accessToken = authHeader.split(' ')[1];

    // Mercado Livre doesn't have a revoke endpoint, but we can invalidate locally
    // The token will naturally expire
    
    res.json({ success: true, message: 'Token will expire naturally' });
  } catch (error) {
    console.error('ML revoke error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
