const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fetch = require('node-fetch');
const path = require('path');

// Local fallback data (used when Mercado Livre blocks requests)
let localParts = [];
try {
  // parts_db.json lives in backend/parts_db.json
  localParts = require(path.join(__dirname, '..', 'parts_db.json')) || [];
} catch (e) {
  localParts = [];
}

// Simple in-memory caches to reduce calls to Mercado Livre
const searchCache = new Map(); // key -> { expiresAt, data }
const detailsCache = new Map();
const SEARCH_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DETAILS_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Helper: proxied fetch to ML with consistent headers, optional Authorization forwarding,
// retry with exponential backoff and improved logging.
async function proxiedFetch(url, req, options = {}) {
  const maxRetries = typeof options.retries === 'number' ? options.retries : 2;
  const baseDelay = 400; // ms

  // Build headers
  const headers = Object.assign({}, options.headers || {});
  headers['Accept'] = headers['Accept'] || 'application/json';
  headers['User-Agent'] = headers['User-Agent'] || 'Garagem-Smart-App/1.0';
  headers['Accept-Language'] = headers['Accept-Language'] || 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7';
  // Optionally set Referer to your frontend domain (if available via env)
  try {
    const referer = process.env.FRONTEND_BASE_URL || 'https://luciofreitas.github.io';
    headers['Referer'] = headers['Referer'] || referer;
  } catch (e) {}

  // Forward Authorization from incoming request if present and requested
  if (req && req.headers && req.headers.authorization) {
    headers['Authorization'] = headers['Authorization'] || req.headers.authorization;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, Object.assign({}, options, { headers, method: options.method || 'GET' }));
      // If status is 5xx, consider retrying
      if (res.status >= 500 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err) {
      // network error - retry if attempts left
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

// Simple local search fallback using backend/parts_db.json
function doLocalSearch(q, limit = 50, offset = 0) {
  try {
    if (!q) return { results: [], paging: { total: 0, limit, offset }, total: 0 };
    const needle = String(q).toLowerCase();
    const matched = localParts.filter(p => JSON.stringify(p).toLowerCase().indexOf(needle) !== -1);
    const total = matched.length;
    const results = matched.slice(Number(offset || 0), Number(offset || 0) + Number(limit || 50));
    return {
      results: results || [],
      paging: { total, limit: Number(limit || 50), offset: Number(offset || 0) },
      filters: [],
      available_filters: [],
      total
    };
  } catch (e) {
    return { results: [], paging: { total: 0, limit, offset }, total: 0 };
  }
}

// Simple local product detail fallback by id (search in JSON fields)
function doLocalProductDetail(id) {
  try {
    if (!id) return null;
    const found = localParts.find(p => String(p.id) === String(id) || String(p.id).toLowerCase() === String(id).toLowerCase());
    return found || null;
  } catch (e) {
    return null;
  }
}

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

// Helper: persist ML tokens into Supabase (server-side). Table: ml_tokens
async function saveMlTokens(userId, tokenData){
  try{
    if(!userId || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
    const expiresAt = tokenData.expires_in ? (Date.now() + (parseInt(tokenData.expires_in,10) * 1000)) : null;
    const payload = {
      user_id: String(userId),
      access_token: tokenData.access_token || null,
      refresh_token: tokenData.refresh_token || null,
      expires_in: tokenData.expires_in ? parseInt(tokenData.expires_in,10) : null,
      expires_at: expiresAt,
      token_type: tokenData.token_type || null,
      scope: tokenData.scope || null,
      updated_at: new Date().toISOString()
    };
    // Upsert by user_id
    const { data, error } = await supabaseAdmin.from('ml_tokens').upsert([payload], { onConflict: 'user_id' });
    if(error){
      console.warn('Failed to save ML tokens to Supabase:', error.message || error);
      return null;
    }
    return data;
  }catch(e){
    console.warn('saveMlTokens error:', e && e.message ? e.message : e);
    return null;
  }
}

// Helper: fetch ML tokens from Supabase by userId
async function getMlTokens(userId){
  try{
    if(!userId || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabaseAdmin.from('ml_tokens').select('*').eq('user_id', String(userId)).limit(1).maybeSingle();
    if(error){
      console.warn('getMlTokens supabase error:', error && error.message ? error.message : error);
      return null;
    }
    return data || null;
  }catch(e){
    console.warn('getMlTokens error:', e && e.message ? e.message : e);
    return null;
  }
}

// Helper: try to resolve a userId and ML token from the incoming request.
// Priority: Authorization Bearer <supabase_access_token> -> query.userId -> header x-user-id
async function getMlTokensFromReq(req){
  try{
    // 1) If client passed a Supabase access token in Authorization header, validate it and use that user
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if(bearer && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY){
      try{
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(process.env.SUPABASE_URL.replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(bearer);
        if(!userErr && userData && userData.user && userData.user.id){
          const userId = userData.user.id;
          const tokenRow = await getMlTokens(userId);
          if(tokenRow) return { userId, tokenRow };
        }
      }catch(e){ /* ignore and fallback */ }
    }

    // 2) Query param or header (convenience for testing)
    const qUser = req.query && req.query.userId ? String(req.query.userId) : null;
    const hUser = req.headers['x-user-id'] ? String(req.headers['x-user-id']) : null;
    const candidate = qUser || hUser;
    if(candidate){
      const tokenRow = await getMlTokens(candidate);
      if(tokenRow) return { userId: candidate, tokenRow };
    }

    return { userId: null, tokenRow: null };
  }catch(e){
    console.warn('getMlTokensFromReq error:', e && e.message ? e.message : e);
    return { userId: null, tokenRow: null };
  }
}

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

    // Persist tokens server-side if we have Supabase configured
    try {
      await saveMlTokens(storedState.userId, tokenData);
    } catch (e) {
      console.warn('Failed to persist ML tokens after callback:', e && e.message ? e.message : e);
    }

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
    // Support two modes:
    // 1) Exchange code -> token (client sends { code, redirectUri })
    // 2) Persist already-obtained token (client sends { access_token, refresh_token, expires_in, userId })
    // Accept both snake_case and camelCase from different clients
    const {
      code,
      redirectUri,
      access_token,
      refresh_token,
      expires_in,
      userId,
      // camelCase alternatives
      accessToken,
      refreshToken,
      expiresIn,
      user_id
    } = req.body || {};

    // Normalize incoming token fields (prefer snake_case but accept camelCase)
    const accessTokenFinal = access_token || accessToken || null;
    const refreshTokenFinal = refresh_token || refreshToken || null;
    const expiresInFinal = typeof expires_in !== 'undefined' ? expires_in : (typeof expiresIn !== 'undefined' ? expiresIn : null);
    const userIdFinal = userId || user_id || null;

    // If client already has token (e.g., OAuth handled elsewhere), persist directly
    if (accessTokenFinal) {
      try {
        const tokenData = { access_token: accessTokenFinal, refresh_token: refreshTokenFinal, expires_in: expiresInFinal };
        if (userIdFinal) await saveMlTokens(userIdFinal, tokenData);
      } catch (e) { console.warn('Failed to persist ML token from client:', e && e.message ? e.message : e); }
      return res.json({ ok: true });
    }

    // If neither an authorization code nor an access token was provided, return a more descriptive error
    if (!code) {
      // Allow explicit debug request via header X-Debug-Key: let-me-debug or X-Debug: true
      const headerDebug = (String(req.headers['x-debug-key'] || '').toLowerCase() === 'let-me-debug')
        || (String(req.headers['x-debug'] || '').toLowerCase() === 'true');
      const debugPayload = headerDebug ? (req.rawBody || req.body) : ((process.env.NODE_ENV !== 'production') ? (req.rawBody || req.body) : undefined);
      return res.status(400).json({ error: 'code or access_token required', received: debugPayload });
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
    // Optionally persist tokens server-side if client provided userId
    try {
      const userId = req.body.userId || null;
      if (userId) await saveMlTokens(userId, tokenData);
    } catch (e) { console.warn('Failed to persist ML token on /token:', e && e.message ? e.message : e); }

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

/**
 * Search products on Mercado Livre (Public API - no auth required)
 * GET /api/ml/products/search?q=<query>&limit=<limit>&offset=<offset>
 * 
 * Example: GET /api/ml/products/search?q=pastilha%20freio%20gol&limit=50
 */
router.get('/products/search', async (req, res) => {
  try {
    const { q, limit = 50, offset = 0, category } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Build search URL
    const searchUrl = new URL(`${ML_API_BASE}/sites/MLB/search`);
    searchUrl.searchParams.set('q', q);
    searchUrl.searchParams.set('limit', limit);
    searchUrl.searchParams.set('offset', offset);
    
    // Filter by category if provided
    if (category) {
      searchUrl.searchParams.set('category', category);
    }

    // Resolve token (if any) and build cache key per-user to avoid leaking authenticated results
    const tokenInfo = await getMlTokensFromReq(req);
    const cacheKey = `${searchUrl.toString()}::user:${tokenInfo.userId || 'public'}`;
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    // Make request to ML API via proxiedFetch (adds headers, retries, forwards Authorization)
    let response;
    try {
      const extraHeaders = {};
      if (tokenInfo && tokenInfo.tokenRow && tokenInfo.tokenRow.access_token) {
        extraHeaders['Authorization'] = `Bearer ${tokenInfo.tokenRow.access_token}`;
      }
      response = await proxiedFetch(searchUrl.toString(), req, { method: 'GET', headers: extraHeaders });
    } catch (err) {
      console.error('ML search fetch failed:', err && err.message ? err.message : err);
      return res.status(502).json({ error: 'Mercado Livre fetch failed', message: String(err) });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '<no body>');
      console.error('ML search error:', response.status, errorText);
      // If blocked by PolicyAgent (403) provide local fallback so UI doesn't break
      try {
        const parsed = JSON.parse(errorText || '{}');
        if (response.status === 403 && parsed && parsed.code && String(parsed.code).startsWith('PA_')) {
          console.warn('ML blocked by policy; returning local fallback for search');
          const local = doLocalSearch(q, limit, offset);
          return res.json(local);
        }
      } catch (e) { /* ignore parse errors */ }
      return res.status(response.status).json({ 
        error: 'Mercado Livre API error',
        details: errorText 
      });
    }

    const data = await response.json();
    
    // Normalize and cache result
    const payload = {
      results: data.results || [],
      paging: data.paging || {},
      filters: data.filters || [],
      available_filters: data.available_filters || [],
      total: data.paging?.total || 0
    };
    try {
      searchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_TTL_MS, data: payload });
    } catch (e) { /* ignore cache set errors */ }

    res.json(payload);

  } catch (error) {
    console.error('ML products search error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Get product details by ID (Public API - no auth required)
 * GET /api/ml/products/:id
 * 
 * Example: GET /api/ml/products/MLB123456789
 */
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Get product details
    const productUrl = `${ML_API_BASE}/items/${id}`;

    // Resolve token (if any) and build cache key per-user to avoid leaking authenticated results
    const tokenInfo = await getMlTokensFromReq(req);
    // Cache key includes user to keep auth/non-auth caches separate
    const cacheKey = `${productUrl}::user:${tokenInfo.userId || 'public'}`;
    const cached = detailsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    let response;
    try {
      const extraHeaders = {};
      if (tokenInfo && tokenInfo.tokenRow && tokenInfo.tokenRow.access_token) {
        extraHeaders['Authorization'] = `Bearer ${tokenInfo.tokenRow.access_token}`;
      }
      response = await proxiedFetch(productUrl, req, { method: 'GET', headers: extraHeaders });
    } catch (err) {
      console.error('ML product fetch failed:', err && err.message ? err.message : err);
      return res.status(502).json({ error: 'Mercado Livre fetch failed', message: String(err) });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '<no body>');
      console.error('ML product details error:', response.status, errorText);
      // If blocked by PolicyAgent (403) provide local fallback for product detail
      try {
        const parsed = JSON.parse(errorText || '{}');
        if (response.status === 403 && parsed && parsed.code && String(parsed.code).startsWith('PA_')) {
          console.warn('ML blocked by policy; returning local fallback for product detail');
          const local = doLocalProductDetail(id);
          if (local) return res.json(local);
          return res.status(404).json({ error: 'Product not found (local fallback)' });
        }
      } catch (e) { /* ignore parse errors */ }
      return res.status(response.status).json({ 
        error: 'Product not found',
        details: errorText 
      });
    }

    const product = await response.json();
    try { detailsCache.set(cacheKey, { expiresAt: Date.now() + DETAILS_TTL_MS, data: product }); } catch (e) {}
    return res.json(product);

  } catch (error) {
    console.error('ML product details error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * Search by category (Public API - no auth required)
 * GET /api/ml/products/category/:categoryId
 * 
 * Example: GET /api/ml/products/category/MLB1747?limit=50
 */
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    // Build category search URL
    const searchUrl = new URL(`${ML_API_BASE}/sites/MLB/search`);
    searchUrl.searchParams.set('category', categoryId);
    searchUrl.searchParams.set('limit', limit);
    searchUrl.searchParams.set('offset', offset);

    // Resolve token (if any) and build cache key per-user to avoid leaking authenticated results
    const tokenInfo = await getMlTokensFromReq(req);
    const cacheKey = `${searchUrl.toString()}::user:${tokenInfo.userId || 'public'}`;
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    let response;
    try {
      const extraHeaders = {};
      if (tokenInfo && tokenInfo.tokenRow && tokenInfo.tokenRow.access_token) {
        extraHeaders['Authorization'] = `Bearer ${tokenInfo.tokenRow.access_token}`;
      }
      response = await proxiedFetch(searchUrl.toString(), req, { method: 'GET', headers: extraHeaders });
    } catch (err) {
      console.error('ML category fetch failed:', err && err.message ? err.message : err);
      return res.status(502).json({ error: 'Mercado Livre fetch failed', message: String(err) });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '<no body>');
      console.error('ML category search error:', response.status, errorText);
      // If blocked by PolicyAgent (403) provide local fallback for category search
      try {
        const parsed = JSON.parse(errorText || '{}');
        if (response.status === 403 && parsed && parsed.code && String(parsed.code).startsWith('PA_')) {
          console.warn('ML blocked by policy; returning local fallback for category search');
          const local = doLocalSearch(q, limit, offset);
          return res.json(local);
        }
      } catch (e) { /* ignore parse errors */ }
      return res.status(response.status).json({ 
        error: 'Mercado Livre API error',
        details: errorText 
      });
    }

    const data = await response.json();
    const payload = {
      results: data.results || [],
      paging: data.paging || {},
      filters: data.filters || [],
      available_filters: data.available_filters || [],
      total: data.paging?.total || 0
    };
    try { searchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_TTL_MS, data: payload }); } catch (e) {}
    return res.json(payload);

  } catch (error) {
    console.error('ML category search error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;

// Development-only debug endpoint: call ML /users/me using stored token for resolved user
// GET /api/ml/debug/me?userId=<userId>
router.get('/debug/me', async (req, res) => {
  try {
    // Only allow when X-Debug-Key header is present or not in production
    const headerDebug = (String(req.headers['x-debug-key'] || '').toLowerCase() === 'let-me-debug')
      || (String(req.headers['x-debug'] || '').toLowerCase() === 'true');
    if (!headerDebug && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'debug not allowed in production' });
    }

    const tokenInfo = await getMlTokensFromReq(req);
    if (!tokenInfo || !tokenInfo.tokenRow || !tokenInfo.tokenRow.access_token) {
      return res.status(404).json({ error: 'no token found for user', userId: tokenInfo && tokenInfo.userId });
    }

    const url = `${ML_API_BASE}/users/me`;
    const response = await proxiedFetch(url, req, { method: 'GET', headers: { Authorization: `Bearer ${tokenInfo.tokenRow.access_token}` } });
    const body = await response.text().catch(() => '<no body>');
    return res.status(response.status).json({ status: response.status, body: body });
  } catch (e) {
    console.error('debug/me error:', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'internal debug error' });
  }
});
