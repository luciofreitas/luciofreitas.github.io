// API utility with JSON fallback for GitHub Pages
import { glossarioMockData } from '../data/glossarioData.js';
// Mercado Livre integration disabled for now.
// Kept (commented) so it can be re-enabled later without starting from zero.
// import * as mlService from '../services/mlService.js';

const ML_INTEGRATION_ENABLED = false;

function isLikelyDevHostname(hostname) {
  const host = (hostname || '').trim();
  if (!host) return false;
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true;
  if (host.endsWith('.local') || host.endsWith('.lan')) return true;
  if (!host.includes('.')) return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true;
  return false;
}

function extractApplicationsFromMLProduct(mlProduct) {
  const applications = [];

  if (mlProduct && mlProduct.attributes && Array.isArray(mlProduct.attributes)) {
    const marca = mlProduct.attributes.find(a => a.id === 'BRAND' || a.id === 'VEHICLE_BRAND');
    const modelo = mlProduct.attributes.find(a => a.id === 'MODEL' || a.id === 'VEHICLE_MODEL');
    const ano = mlProduct.attributes.find(a => a.id === 'VEHICLE_YEAR');

    if (marca || modelo || ano) {
      const app = [
        marca?.value_name,
        modelo?.value_name,
        ano?.value_name
      ].filter(Boolean).join(' ');

      if (app) applications.push(app);
    }
  }

  return applications;
}

class ApiService {
  constructor() {
    this.isLocal = isLikelyDevHostname(window.location.hostname);
    // Prefer runtime-injected base (window.__API_BASE). Build-time env or localhost fallback
    // should only be used at runtime to avoid embedding dev-only URLs into the production bundle.
    this.getBaseUrl = () => {
      if (typeof window === 'undefined') return '';
      // If we're running on a developer machine, construct the backend URL at runtime.
      // This intentionally runs before window.__API_BASE so LAN-hosted dev sessions
      // don't accidentally hit the production backend.
      if (isLikelyDevHostname(window.location.hostname)) {
        return `${window.location.protocol}//${window.location.hostname}:3001`;
      }
      if (window.__API_BASE) return window.__API_BASE;
    // Avoid using import.meta.env here to prevent Vite from inlining a build-time
    // value (like a localhost fallback) into the production bundle. If no
    // runtime injector is present, return empty and let callers handle fallbacks.
    return '';
    };

    // Ensure instance methods keep `this` even when passed as callbacks.
    try {
      this.convertMLProductToPeca = this.convertMLProductToPeca.bind(this);
      this.extractApplicationsFromMLProduct = this.extractApplicationsFromMLProduct.bind(this);
      this.buildMLSearchQuery = this.buildMLSearchQuery.bind(this);
      this.buscarPecasML = this.buscarPecasML.bind(this);
    } catch (e) {
      // ignore
    }

    // Extra safety: wrap methods with arrow functions so `this` is always preserved
    // even if some caller stores a reference and calls it later.
    try {
      const self = this;
      this.convertMLProductToPeca = (...args) => ApiService.prototype.convertMLProductToPeca.apply(self, args);
      this.extractApplicationsFromMLProduct = (...args) => ApiService.prototype.extractApplicationsFromMLProduct.apply(self, args);
    } catch (e) {
      // ignore
    }
  }

  async fetchWithFallback(apiPath, fallbackData = null) {
    // Detecta produção estática (ex: GitHub Pages, Vercel, etc.)
    const isStaticProd =
      typeof window !== 'undefined' &&
      !isLikelyDevHostname(window.location.hostname) &&
      (
        window.location.hostname.endsWith('github.io') ||
        window.location.hostname === 'garagemsmart.com.br' ||
        window.location.hostname.endsWith('vercel.app') ||
        window.location.hostname.endsWith('onrender.com')
      );

    // Se for produção estática, sempre usa fallback JSON local
    if (isStaticProd) {
      const jsonPath = this.getJsonFallbackPath(apiPath);
      if (jsonPath) {
        try {
          const response = await fetch(jsonPath);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.warn(`JSON fallback failed for ${apiPath}:`, error);
        }
      }
      // Se não houver fallback, retorna vazio ou fallbackData
      if (fallbackData) return fallbackData;
      return { data: [], message: 'No data available' };
    }

    // Try API first (backend quando disponível)
    const fullUrl = this.getBaseUrl() + apiPath;
    try {
      const response = await fetch(fullUrl);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`API call failed for ${fullUrl}, falling back to local data:`, error);
    }

    // Fallback to local JSON data
    if (fallbackData) {
      return fallbackData;
    }

    // Try to load JSON file directly
    try {
      const jsonPath = this.getJsonFallbackPath(apiPath);
      if (jsonPath) {
        const response = await fetch(jsonPath);
        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.warn(`JSON fallback failed for ${apiPath}:`, error);
    }

    // Return empty response if all fails
    return { data: [], message: 'No data available' };
  }

  getJsonFallbackPath(apiPath) {
    const pathMap = {
      '/api/glossario-dashboard': null,
      '/api/luzes-painel': '/data/luzes_painel.json',
      '/api/pecas/meta': '/data/parts_meta.json',
    };
    return pathMap[apiPath] || null;
  }

  // Specific methods for each API endpoint
  async getGlossarioDashboard() {
    // Use statically imported local data as fallback
    return this.fetchWithFallback('/api/glossario-dashboard', glossarioMockData);
  }

  async getLuzesPainel() {
    // Prefer runtime API, but fall back to the statically imported mock data
    // (do not read /data/luzes_painel.json to avoid conflicting static JSON files)
    const result = await this.fetchWithFallback('/api/luzes-painel', glossarioMockData);
    try {
      if (result === glossarioMockData) {
        console.info('[apiService] getLuzesPainel -> using glossarioMockData fallback');
      } else {
        console.info('[apiService] getLuzesPainel -> data returned by API/backend or JSON file', Array.isArray(result) ? `items=${result.length}` : typeof result);
      }
    } catch (e) {
      // no-op
    }
    return result;
  }

  async getPecasMeta() {
    // Buscar metadados diretamente do backend
    try {
      const base = this.getBaseUrl ? this.getBaseUrl() : '';
      const url = (base ? `${base}` : '') + '/api/pecas/meta';
      const response = await fetch(url);
      if (response.ok) {
        const meta = await response.json();
        return {
          grupos: meta.grupos || [],
          pecas: meta.pecas || [],
          fabricantes: meta.fabricantes || [],
          marcas: meta.marcas || [],
          modelos: meta.modelos || [],
          anos: meta.anos || [],
        };
      }
    } catch (e) {
      // fallback para Supabase/local se necessário
    }

    // Try Supabase next (runtime-config or env must provide credentials)
    try {
      const mod = await import('../supabase');
      const _supabase = mod.default || mod.supabase;
      const isConfigured = mod.isConfigured;

      if (_supabase && isConfigured && !_supabase._notConfigured) {
        try {
          // Fetch only the columns needed to build dropdown lists.
          const { data: partsData, error } = await _supabase.from('parts').select('category,name,manufacturer');
          if (!error && partsData && Array.isArray(partsData)) {
            return {
              grupos: [...new Set(partsData.map(p => p.category).filter(Boolean))].sort(),
              // Keep category for filtering "Peça" by "Grupo" in the UI
              pecas: partsData.filter(p => p && p.name && p.category).map(p => ({
                name: p.name,
                category: p.category,
                manufacturer: p.manufacturer
              })),
              fabricantes: [...new Set(partsData.map(p => p.manufacturer).filter(Boolean))].sort(),
              marcas: [],
              modelos: [],
              anos: []
            };
          }
          if (error) console.warn('Supabase returned error for parts:', error);
        } catch (err) {
          console.warn('Error querying Supabase for parts:', err);
        }
      }
    } catch (err) {
      console.debug('Supabase client not available or failed to import:', err && err.message ? err.message : err);
    }

    // Last resort: fallback to the full local JSON (heavier)
    try {
      const response = await fetch('/data/parts_db.json');
      if (response.ok) {
        const partsData = await response.json();

        const grupos = [...new Set(partsData.map(p => p.category).filter(Boolean))].sort();
        const fabricantes = [...new Set(partsData.map(p => p.manufacturer).filter(Boolean))].sort();

        const modelos = new Set();
        const anos = new Set();
        const todasMarcasVeiculos = new Set();

        partsData.forEach(part => {
          if (part.applications && Array.isArray(part.applications)) {
            part.applications.forEach(app => {
              if (typeof app === 'string') {
                const parts = app.trim().split(/\s+/);
                if (parts.length >= 2) {
                  const marca = parts[0];
                  const modelo = parts[1];
                  todasMarcasVeiculos.add(marca);
                  modelos.add(`${marca} ${modelo}`);
                  const yearsMatch = app.match(/\b(19|20)\d{2}\b/g);
                  if (yearsMatch) yearsMatch.forEach(year => anos.add(year));
                }
              } else if (typeof app === 'object') {
                if (app.model) modelos.add(app.model);
                if (app.year) anos.add(app.year);
                if (app.make) todasMarcasVeiculos.add(app.make);
              }
            });
          }
        });

        // Keep category for filtering "Peça" by "Grupo" in the UI
        const pairSet = new Set();
        const pecas = [];
        for (const p of (Array.isArray(partsData) ? partsData : [])) {
          const name = p && p.name ? String(p.name) : '';
          const category = p && p.category ? String(p.category) : '';
          if (!name || !category) continue;
          const key = `${category}||${name}`;
          if (pairSet.has(key)) continue;
          pairSet.add(key);
          pecas.push({ name, category, manufacturer: p.manufacturer });
        }

        return {
          grupos,
          pecas,
          marcas: [...todasMarcasVeiculos].sort(),
          modelos: [...modelos].sort(),
          anos: [...anos].sort(),
          fabricantes
        };
      }
    } catch (error) {
      console.warn('Error loading parts_db.json:', error);
    }

    return this.fetchWithFallback('/api/pecas/meta');
  }

  async filtrarPecas(filtros) {
    // Try Supabase first (if configured)
    try {
      const mod = await import('../supabase');
      const _supabase = mod.default || mod.supabase;
      const isConfigured = mod.isConfigured;

      if (_supabase && isConfigured && !_supabase._notConfigured) {
        const pecaFiltro = (filtros.peca || filtros.categoria || '').toString().toLowerCase().trim();
        let query = _supabase.from('parts').select('*');

        if (filtros.grupo) {
          query = query.eq('category', filtros.grupo);
        }

        if (pecaFiltro) {
          // Case-insensitive exact-ish match (no wildcards)
          query = query.ilike('name', pecaFiltro);
        }

        if (filtros.fabricante) {
          query = query.ilike('manufacturer', `%${String(filtros.fabricante).toLowerCase()}%`);
        }

        const { data: partsData, error } = await query;

        if (!error && Array.isArray(partsData)) {
          let filtered = partsData;

          // Apply the remaining filters client-side (applications shape may vary)
          if (filtros.marca) {
            filtered = filtered.filter(p =>
              p.applications && Array.isArray(p.applications) && p.applications.some(app => {
                if (typeof app === 'string') {
                  return app.toLowerCase().includes(String(filtros.marca).toLowerCase());
                }
                if (app && typeof app === 'object') {
                  const make = (app.make || '').toString().toLowerCase();
                  return make.includes(String(filtros.marca).toLowerCase());
                }
                return false;
              })
            );
          }

          if (filtros.modelo) {
            filtered = filtered.filter(p =>
              p.applications && Array.isArray(p.applications) && p.applications.some(app => {
                if (typeof app === 'string') {
                  return app.toLowerCase().includes(String(filtros.modelo).toLowerCase());
                }
                if (app && typeof app === 'object') {
                  const model = (app.model || '').toString().toLowerCase();
                  return model.includes(String(filtros.modelo).toLowerCase());
                }
                return false;
              })
            );
          }

          if (filtros.ano) {
            filtered = filtered.filter(p =>
              p.applications && Array.isArray(p.applications) && p.applications.some(app => {
                if (typeof app === 'string') {
                  return app.includes(String(filtros.ano));
                }
                if (app && typeof app === 'object') {
                  const year = (app.year || '').toString();
                  return year.includes(String(filtros.ano));
                }
                return false;
              })
            );
          }

          // If Supabase is reachable and query succeeds, return its result even if empty.
          // JSON fallback should only be used when Supabase is unavailable or errors.
          return { pecas: filtered, total: filtered.length, source: 'supabase' };
        }

        if (error) {
          console.warn('[apiService] Supabase filter error; falling back to local JSON:', error);
        }
      }
    } catch (err) {
      console.debug('Supabase client not available or failed to import:', err && err.message ? err.message : err);
    }

    // Try API (local/dev) next
    if (this.isLocal) {
      try {
        const response = await fetch('/api/pecas/filtrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filtros)
        });
        if (response.ok) {
          const result = await response.json();
          return result;
        } else {
          console.warn('ApiService: API response not ok:', response.status);
        }
      } catch (error) {
        console.warn('API filter call failed, using local data:', error);
      }
    }
    // Fallback: filter local data
    try {
      const response = await fetch('/data/parts_db.json');
  if (response.ok) {
  const partsData = await response.json();
  let filtered = partsData;

        // Apply filters - map Portuguese terms to English fields
        if (filtros.grupo) {
          const beforeCount = filtered.length;
          console.log('🔍 Filtrando por grupo:', filtros.grupo);
          console.log('📊 Categorias disponíveis:', [...new Set(filtered.map(p => p.category))]);
          filtered = filtered.filter(p => {
            console.log(`Comparando: "${p.category}" === "${filtros.grupo}"`, p.category === filtros.grupo);
            return p.category === filtros.grupo;
          });
          console.log(`✅ Filtrado: ${beforeCount} → ${filtered.length} peças`);
        }
        // Support both 'peca' and 'categoria' keys (page sends 'categoria')
        const pecaFiltro = (filtros.peca || filtros.categoria || '').toString().toLowerCase().trim();
        if (pecaFiltro) {
          filtered = filtered.filter(p => {
            const nome = (p.name || '').toString().toLowerCase().trim();
            return nome === pecaFiltro;
          });
        }
        if (filtros.marca) {
          // Filter by vehicle brand (extracted from applications)
          filtered = filtered.filter(p => 
            p.applications && p.applications.some(app => {
              if (typeof app === 'string') {
                return app.toLowerCase().includes(filtros.marca.toLowerCase());
              }
              return false;
            })
          );
        }
        if (filtros.modelo) {
          filtered = filtered.filter(p => 
            p.applications && p.applications.some(app => {
              if (typeof app === 'string') {
                return app.toLowerCase().includes(filtros.modelo.toLowerCase());
              }
              return false;
            })
          );
        }
        if (filtros.ano) {
          filtered = filtered.filter(p => 
            p.applications && p.applications.some(app => {
              if (typeof app === 'string') {
                return app.includes(filtros.ano);
              }
              return false;
            })
          );
        }
        if (filtros.fabricante) {
          // Filter by part manufacturer
          filtered = filtered.filter(p => 
            p.manufacturer && p.manufacturer.toLowerCase().includes(filtros.fabricante.toLowerCase())
          );
        }
        return { pecas: filtered, total: filtered.length };
      } else {
        console.error('ApiService: Failed to load /data/parts_db.json:', response.status);
      }
    } catch (error) {
      console.warn('Error filtering local data:', error);
    }

    return { pecas: [], total: 0 };
  }

  async getPecaById(id) {
  // getPecaById called
    
    // Try API first
    if (this.isLocal) {
      try {
        const response = await fetch(`/api/pecas/${id}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn(`API call failed for piece ${id}, using local data:`, error);
      }
    }

    // Fallback: find in local detailed data first, then basic data
      try {
        // Try detailed data first
        const detailedResponse = await fetch('/data/parts_detailed.json');
        if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json();
        const detailedPiece = detailedData.find(p => {
          const match = p.id === id || p.id === parseInt(id) || p.id === String(id);
          return match;
        });
        if (detailedPiece) return detailedPiece;
      }
      
      // Fallback to basic data if not found in detailed
      const response = await fetch('/data/parts_db.json');
      if (response.ok) {
  const partsData = await response.json();
  const piece = partsData.find(p => p.id === id || p.id === parseInt(id) || p.id === String(id));
  return piece || { error: 'Peça não encontrada' };
      }
    } catch (error) {
      console.warn('Error finding piece in local data:', error);
    }

    return { error: 'Peça não encontrada' };
  }

  // ========================================
  // Mercado Livre Product Search Methods
  // ========================================

  /**
   * Search parts on Mercado Livre
   * Primary method - uses ML API for real products
   * Falls back to local JSON if ML fails
   * 
   * @param {Object} filtros - Search filters
   * @returns {Promise<Object>} Products from ML or local JSON
   */
  async buscarPecasML(filtros) {
    // Mercado Livre integration disabled: use Supabase/JSON only.
    // NOTE: original ML logic preserved below for future re-enable.
    if (!ML_INTEGRATION_ENABLED) {
      const data = await this.filtrarPecas(filtros);
      return {
        ...(data || {}),
        source: (data && data.source) ? data.source : 'local'
      };
    }

    /*
    try {
      // Build search query from filters
      const query = this.buildMLSearchQuery(filtros);
      
      if (!query) {
        console.warn('No search query built from filters, using local data');
        return this.filtrarPecas(filtros);
      }

      console.log('🔍 Buscando produtos no Mercado Livre:', query);

      // Search on Mercado Livre
      const mlResult = await mlService.searchProducts(query, {
        limit: 50,
        offset: 0
      });

      if (mlResult && mlResult.products && mlResult.products.length > 0) {
        console.log(`✅ Encontrados ${mlResult.products.length} produtos no ML`);
        
        // Convert ML products to our format
        const pecasML = mlResult.products.map((p) => this.convertMLProductToPeca(p));
        
        return {
          pecas: pecasML,
          total: mlResult.total,
          source: 'mercado_livre',
          paging: mlResult.paging
        };
      }

      console.warn('Nenhum produto encontrado no ML, usando dados locais');
      return this.filtrarPecas(filtros);

    } catch (error) {
      console.error('Erro ao buscar no Mercado Livre, usando dados locais:', error);
      return this.filtrarPecas(filtros);
    }
    */
  }

  /**
   * Build search query for Mercado Livre from filters
   */
  buildMLSearchQuery(filtros) {
    const parts = [];

    // Part name/category is most important
    if (filtros.categoria || filtros.peca) {
      parts.push(filtros.categoria || filtros.peca);
    } else if (filtros.grupo) {
      parts.push(filtros.grupo);
    }

    // Add vehicle info
    if (filtros.marca) {
      parts.push(filtros.marca);
    }
    
    if (filtros.modelo) {
      parts.push(filtros.modelo);
    }
    
    if (filtros.ano) {
      parts.push(filtros.ano);
    }

    // Add manufacturer if specified
    if (filtros.fabricante) {
      parts.push(filtros.fabricante);
    }

    const query = parts.join(' ').trim();
    return query || null;
  }

  /**
   * Convert ML product format to our internal format
   */
  convertMLProductToPeca(mlProduct) {
    return {
      id: mlProduct.id,
      name: mlProduct.title,
      category: mlProduct.category_id || 'Peças Automotivas',
      manufacturer: mlProduct.seller?.nickname || 'Mercado Livre',
      price: mlProduct.price,
      currency: mlProduct.currency_id || 'BRL',
      condition: mlProduct.condition, // new, used
      thumbnail: mlProduct.thumbnail,
      pictures: mlProduct.pictures || [],
      permalink: mlProduct.permalink,
      available_quantity: mlProduct.available_quantity || 0,
      sold_quantity: mlProduct.sold_quantity || 0,
      shipping: {
        free_shipping: mlProduct.shipping?.free_shipping || false,
        store_pick_up: mlProduct.shipping?.store_pick_up || false
      },
      attributes: mlProduct.attributes || [],
      // ML specific fields
      ml_product: true,
      ml_id: mlProduct.id,
      original_price: mlProduct.original_price,
      listing_type_id: mlProduct.listing_type_id,
      // Compatibility info (if available in attributes)
      applications: extractApplicationsFromMLProduct(mlProduct)
    };
  }

  /**
   * Extract vehicle applications from ML product attributes
   */
  extractApplicationsFromMLProduct(mlProduct) {
    return extractApplicationsFromMLProduct(mlProduct);
  }

  /**
   * Get product details from Mercado Livre
   */
  async getPecaByIdML(mlId) {
    if (!ML_INTEGRATION_ENABLED) {
      return this.getPecaById(mlId);
    }

    /*
    try {
      console.log('🔍 Buscando detalhes do produto ML:', mlId);
      
      const product = await mlService.getProductDetails(mlId);
      
      if (product) {
        return this.convertMLProductToPeca(product);
      }

      // Fallback to local data
      return this.getPecaById(mlId);

    } catch (error) {
      console.error('Erro ao buscar detalhes no ML, usando dados locais:', error);
      return this.getPecaById(mlId);
    }
    */
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;