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
      this.suggestFiltersAI = this.suggestFiltersAI.bind(this);
    } catch (e) {
      // ignore
    }

    // Extra safety: wrap methods with arrow functions so `this` is always preserved
    // even if some caller stores a reference and calls it later.
    try {
      const self = this;
      this.convertMLProductToPeca = (...args) => ApiService.prototype.convertMLProductToPeca.apply(self, args);
      this.extractApplicationsFromMLProduct = (...args) => ApiService.prototype.extractApplicationsFromMLProduct.apply(self, args);
      this.suggestFiltersAI = (...args) => ApiService.prototype.suggestFiltersAI.apply(self, args);
    } catch (e) {
      // ignore
    }
  }

  // Build a URL for assets under /public (ex: data/*.json) that works on:
  // - localhost dev
  // - GitHub Pages subpaths
  // - HashRouter routes (pathname stays at the app root)
  // Avoid using relative URLs like './data/x.json' because they can break
  // when the app is served from a subpath or the current document isn't '/'.
  publicAssetUrl(relPath) {
    try {
      if (typeof window === 'undefined') return relPath;
      const clean = String(relPath || '').replace(/^\//, '').replace(/^\.\//, '');
      const base = `${window.location.origin}${window.location.pathname}`;
      return new URL(clean, base).toString();
    } catch (e) {
      return relPath;
    }
  }

  isStaticProd() {
    try {
      if (typeof window === 'undefined') return false;
      const host = window.location && window.location.hostname ? window.location.hostname : '';
      if (isLikelyDevHostname(host)) return false;
      return (
        host.endsWith('github.io') ||
        host === 'garagemsmart.com.br' ||
        host.endsWith('vercel.app') ||
        host.endsWith('onrender.com')
      );
    } catch (e) {
      return false;
    }
  }

  async suggestFiltersAI({ query, context } = {}) {
    const q = String(query || '').trim();

    // In static production builds, the backend may not be reachable.
    if (this.isStaticProd()) {
      return {
        filters: {},
        questions: ['Sugestão por IA requer o backend ativo (não disponível nesta versão estática).'],
        confidence: 0
      };
    }

    const base = this.getBaseUrl ? this.getBaseUrl() : '';
    if (!base) {
      return {
        filters: {},
        questions: ['Backend não detectado. Inicie o servidor para usar a sugestão por IA.'],
        confidence: 0
      };
    }

    try {
      const resp = await fetch(`${base}/api/ai/suggest-filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: q, context: context || {} })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        const msg = (data && (data.error || data.message)) ? (data.error || data.message) : `HTTP ${resp.status}`;
        throw new Error(msg);
      }
      return data || { filters: {}, questions: [], confidence: 0 };
    } catch (e) {
      console.warn('[apiService] suggestFiltersAI failed:', e && e.message ? e.message : e);
      return {
        filters: {},
        questions: ['Não foi possível acessar a IA agora. Verifique se o backend está rodando.'],
        confidence: 0
      };
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
          const response = await fetch(this.publicAssetUrl(jsonPath));
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
        const response = await fetch(this.publicAssetUrl(jsonPath));
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
      '/api/luzes-painel': 'data/luzes_painel.json',
      '/api/pecas/meta': 'data/parts_meta.json',
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
    const buildMetaFromPartsDb = async () => {
      const response = await fetch(this.publicAssetUrl('data/parts_db.json'));
      if (!response.ok) throw new Error(`Failed to load /data/parts_db.json: ${response.status}`);
      const partsData = await response.json();

      const grupos = [...new Set((partsData || []).map(p => p && p.category).filter(Boolean))].sort();
      const fabricantes = [...new Set((partsData || []).map(p => p && p.manufacturer).filter(Boolean))].sort();

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

      const modelos = new Set();
      const anos = new Set();
      const todasMarcasVeiculos = new Set();

      const modelsByBrand = {};
      const yearsByBrandModel = {};
      const fabricantesByGrupo = {};
      const fabricantesByGrupoPeca = {};

      const addToMapSet = (obj, key, value) => {
        if (!key || !value) return;
        if (!obj[key]) obj[key] = new Set();
        obj[key].add(value);
      };

      const parseAppString = (appStr) => {
        const s = String(appStr || '').trim();
        if (!s) return null;
        const parts = s.split(/\s+/);
        if (parts.length < 2) return null;
        const make = parts[0];
        const model = parts[1];
        const yearsMatch = s.match(/\b(19|20)\d{2}\b/g) || [];
        return { make, model, years: yearsMatch };
      };
      (Array.isArray(partsData) ? partsData : []).forEach(part => {
        // Manufacturer relationships
        try {
          const cat = part && part.category ? String(part.category).trim() : '';
          const nm = part && part.name ? String(part.name).trim() : '';
          const mf = part && part.manufacturer ? String(part.manufacturer).trim() : '';
          if (cat && mf) addToMapSet(fabricantesByGrupo, cat, mf);
          if (cat && nm && mf) addToMapSet(fabricantesByGrupoPeca, `${cat}||${nm}`, mf);
        } catch (e) {
          // ignore
        }

        if (part && part.applications && Array.isArray(part.applications)) {
          part.applications.forEach(app => {
            if (typeof app === 'string') {
              const parsed = parseAppString(app);
              if (!parsed) return;
              const marca = parsed.make;
              const modelo = parsed.model;
              todasMarcasVeiculos.add(marca);
              modelos.add(`${marca} ${modelo}`);
              addToMapSet(modelsByBrand, marca, modelo);
              if (Array.isArray(parsed.years)) {
                for (const y of parsed.years) {
                  if (!y) continue;
                  anos.add(y);
                  addToMapSet(yearsByBrandModel, `${marca}||${modelo}`, String(y));
                }
              }
            } else if (typeof app === 'object') {
              if (app.model) modelos.add(app.model);
              if (app.year) anos.add(app.year);
              if (app.make) todasMarcasVeiculos.add(app.make);

              if (app.make && app.model) {
                addToMapSet(modelsByBrand, String(app.make), String(app.model));
                const yr = app.year ? String(app.year) : '';
                if (yr) addToMapSet(yearsByBrandModel, `${String(app.make)}||${String(app.model)}`, yr);
              }
            }
          });
        }
      });

      const normalizeSetMap = (obj) => {
        const out = {};
        for (const k of Object.keys(obj || {})) {
          const arr = Array.from(obj[k] || []).filter(Boolean).map(String);
          out[k] = arr.sort();
        }
        return out;
      };

      return {
        grupos,
        pecas,
        marcas: [...todasMarcasVeiculos].sort(),
        modelos: [...modelos].sort(),
        anos: [...anos].sort(),
        fabricantes,
        motores: [],
        versoes: [],
        relationships: {
          modelsByBrand: normalizeSetMap(modelsByBrand),
          yearsByBrandModel: normalizeSetMap(yearsByBrandModel),
          fabricantesByGrupo: normalizeSetMap(fabricantesByGrupo),
          fabricantesByGrupoPeca: normalizeSetMap(fabricantesByGrupoPeca)
        }
      };
    };

    const enrichWithLocalRelationships = async (meta) => {
      try {
        const hasRels =
          meta &&
          meta.relationships &&
          typeof meta.relationships === 'object' &&
          meta.relationships.modelsByBrand &&
          Object.keys(meta.relationships.modelsByBrand || {}).length > 0;
        if (hasRels) return meta;

        const built = await buildMetaFromPartsDb();
        const merged = {
          ...(meta || {}),
          relationships: built.relationships || {},
        };

        // If backend/Supabase didn't provide these lists, keep them usable.
        if (!Array.isArray(merged.marcas) || merged.marcas.length === 0) merged.marcas = built.marcas || [];
        if (!Array.isArray(merged.modelos) || merged.modelos.length === 0) merged.modelos = built.modelos || [];
        if (!Array.isArray(merged.anos) || merged.anos.length === 0) merged.anos = built.anos || [];

        return merged;
      } catch (e) {
        return meta;
      }
    };

    // Buscar metadados diretamente do backend
    try {
      const base = this.getBaseUrl ? this.getBaseUrl() : '';
      const url = (base ? `${base}` : '') + '/api/pecas/meta';
      const response = await fetch(url);
      if (response.ok) {
        const meta = await response.json();
        const normalized = {
          grupos: meta.grupos || [],
          pecas: meta.pecas || [],
          fabricantes: meta.fabricantes || [],
          marcas: meta.marcas || [],
          modelos: meta.modelos || [],
          anos: meta.anos || [],
          motores: meta.motores || [],
          versoes: meta.versoes || [],
          relationships: meta.relationships || undefined,
        };

        // If backend is reachable but doesn't have parts data populated yet,
        // don't block the UI: fall back to Supabase/local JSON.
        const hasAny =
          (Array.isArray(normalized.grupos) && normalized.grupos.length > 0) ||
          (Array.isArray(normalized.pecas) && normalized.pecas.length > 0) ||
          (Array.isArray(normalized.fabricantes) && normalized.fabricantes.length > 0);

        if (hasAny) return await enrichWithLocalRelationships(normalized);
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
            // Optional: heuristic hint dropdowns (bounded)
            let motores = [];
            let versoes = [];
            try {
              const limit = 5000;
              const motorSet = new Set();
              const versaoSet = new Set();

              const { data: motorRows, error: motorErr } = await _supabase
                .from('parts')
                .select('fit_motor_hint')
                .not('fit_motor_hint', 'is', null)
                .limit(limit);
              if (!motorErr && Array.isArray(motorRows)) {
                for (const r of motorRows) {
                  const m = r && r.fit_motor_hint ? String(r.fit_motor_hint).trim() : '';
                  if (m) motorSet.add(m);
                }
              }

              const { data: versaoRows, error: versaoErr } = await _supabase
                .from('parts')
                .select('fit_versao_hint')
                .not('fit_versao_hint', 'is', null)
                .limit(limit);
              if (!versaoErr && Array.isArray(versaoRows)) {
                for (const r of versaoRows) {
                  const v = r && r.fit_versao_hint ? String(r.fit_versao_hint).trim() : '';
                  if (v) versaoSet.add(v);
                }
              }

              motores = Array.from(motorSet).sort();
              versoes = Array.from(versaoSet).sort();
            } catch (e) {
              // ignore (columns might not exist)
            }

            // Basic relationships we can infer without applications
            const fabricantesByGrupo = {};
            const fabricantesByGrupoPeca = {};
            const addToMapSet = (obj, key, value) => {
              if (!key || !value) return;
              if (!obj[key]) obj[key] = new Set();
              obj[key].add(value);
            };

            for (const p of (Array.isArray(partsData) ? partsData : [])) {
              const cat = p && p.category ? String(p.category).trim() : '';
              const nm = p && p.name ? String(p.name).trim() : '';
              const mf = p && p.manufacturer ? String(p.manufacturer).trim() : '';
              if (cat && mf) addToMapSet(fabricantesByGrupo, cat, mf);
              if (cat && nm && mf) addToMapSet(fabricantesByGrupoPeca, `${cat}||${nm}`, mf);
            }

            const normalizeSetMap = (obj) => {
              const out = {};
              for (const k of Object.keys(obj || {})) {
                out[k] = Array.from(obj[k] || []).filter(Boolean).map(String).sort();
              }
              return out;
            };

            const result = {
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
              anos: [],
              motores,
              versoes,
              relationships: {
                modelsByBrand: {},
                yearsByBrandModel: {},
                fabricantesByGrupo: normalizeSetMap(fabricantesByGrupo),
                fabricantesByGrupoPeca: normalizeSetMap(fabricantesByGrupoPeca)
              }
            };

            return await enrichWithLocalRelationships(result);
          }
          if (error) console.warn('Supabase returned error for parts:', error);
        } catch (err) {
          console.warn('Error querying Supabase for parts:', err);
        }
      }
    } catch (err) {
      console.debug('Supabase client not available or failed to import:', err && err.message ? err.message : err);
    }

    // Last resort: build from the full local JSON (heavier)
    try {
      return await buildMetaFromPartsDb();
    } catch (error) {
      console.warn('Error building meta from /data/parts_db.json:', error);
    }

    // Final fallback: static parts_meta.json (may not contain group mapping). If it returns
    // a string list of "pecas", try to enrich it with category info from parts_db.json.
    const meta = await this.fetchWithFallback('/api/pecas/meta');
    try {
      if (meta && Array.isArray(meta.pecas) && meta.pecas.length && typeof meta.pecas[0] === 'string') {
        return await buildMetaFromPartsDb();
      }
    } catch (e) {
      // ignore and return what we have
    }
    return meta;
  }

  async filtrarPecas(filtros) {
    const normalizeForSearch = (s) => {
      try {
        return String(s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .trim();
      } catch (e) {
        return String(s || '').toLowerCase().trim();
      }
    };

    const qMarca = normalizeForSearch(filtros?.marca);
    const qModelo = normalizeForSearch(filtros?.modelo);
    const qAno = normalizeForSearch(filtros?.ano);
    const qMotor = normalizeForSearch(filtros?.motor);
    const qVersao = normalizeForSearch(filtros?.versao);
    const qCombustivel = normalizeForSearch(filtros?.combustivel);
    const qCambio = normalizeForSearch(filtros?.cambio);
    const qCarroceria = normalizeForSearch(filtros?.carroceria);

    const matchOptional = (appValue, q) => {
      if (!q) return true;
      if (appValue === undefined || appValue === null || String(appValue).trim() === '') return true; // permissive when data missing
      return normalizeForSearch(appValue).includes(q);
    };

    const getFirst = (obj, keys) => {
      if (!obj || typeof obj !== 'object') return null;
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
      }
      return null;
    };

    const matchesApplication = (app) => {
      if (!app) return false;
      if (typeof app === 'string') {
        const s = normalizeForSearch(app);
        if (qMarca && !s.includes(qMarca)) return false;
        if (qModelo && !s.includes(qModelo)) return false;
        if (qAno && !s.includes(qAno)) return false;
        // Advanced fields are not reliably parsable from free-form strings -> don't exclude
        return true;
      }
      if (typeof app === 'object') {
        const make = normalizeForSearch(getFirst(app, ['make', 'marca', 'brand']));
        const model = normalizeForSearch(getFirst(app, ['model', 'modelo']));
        const year = normalizeForSearch(getFirst(app, ['year', 'ano']));
        if (qMarca && (!make || !make.includes(qMarca))) return false;
        if (qModelo && (!model || !model.includes(qModelo))) return false;
        if (qAno && (!year || !year.includes(qAno))) return false;

        const motor = getFirst(app, ['motor', 'engine']);
        const versao = getFirst(app, ['versao', 'trim', 'version']);
        const combustivel = getFirst(app, ['combustivel', 'fuel', 'fuel_type']);
        const cambio = getFirst(app, ['cambio', 'transmission', 'gearbox']);
        const carroceria = getFirst(app, ['carroceria', 'body', 'body_type']);

        if (!matchOptional(motor, qMotor)) return false;
        if (!matchOptional(versao, qVersao)) return false;
        if (!matchOptional(combustivel, qCombustivel)) return false;
        if (!matchOptional(cambio, qCambio)) return false;
        if (!matchOptional(carroceria, qCarroceria)) return false;

        return true;
      }
      return false;
    };

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

          // Apply vehicle filters client-side (applications shape may vary)
          if (qMarca || qModelo || qAno || qMotor || qVersao || qCombustivel || qCambio || qCarroceria) {
            filtered = filtered.filter(p =>
              p.applications && Array.isArray(p.applications) && p.applications.some(matchesApplication)
            );
          }

          // Apply heuristic hint filters on the part itself (permissive when hint missing)
          if (qMotor || qVersao || qCombustivel || qCambio || qCarroceria) {
            const matchHint = (hintValue, q) => {
              if (!q) return true;
              if (hintValue === undefined || hintValue === null || String(hintValue).trim() === '') return true;
              return normalizeForSearch(hintValue).includes(q);
            };

            filtered = filtered.filter(p => {
              if (!matchHint(p.fit_motor_hint, qMotor)) return false;
              if (!matchHint(p.fit_versao_hint, qVersao)) return false;
              if (!matchHint(p.fit_combustivel_hint, qCombustivel)) return false;
              if (!matchHint(p.fit_cambio_hint, qCambio)) return false;
              if (!matchHint(p.fit_carroceria_hint, qCarroceria)) return false;
              return true;
            });

            const scorePart = (p) => {
              let score = 0;
              if (qMotor && p.fit_motor_hint && normalizeForSearch(p.fit_motor_hint).includes(qMotor)) score += 2;
              if (qVersao && p.fit_versao_hint && normalizeForSearch(p.fit_versao_hint).includes(qVersao)) score += 2;
              if (qCombustivel && p.fit_combustivel_hint && normalizeForSearch(p.fit_combustivel_hint).includes(qCombustivel)) score += 1;
              if (qCambio && p.fit_cambio_hint && normalizeForSearch(p.fit_cambio_hint).includes(qCambio)) score += 1;
              if (qCarroceria && p.fit_carroceria_hint && normalizeForSearch(p.fit_carroceria_hint).includes(qCarroceria)) score += 1;
              return score;
            };

            filtered = filtered
              .map((p, idx) => ({ p, idx, s: scorePart(p) }))
              .sort((a, b) => (b.s - a.s) || (a.idx - b.idx))
              .map(x => x.p);
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
      const response = await fetch(this.publicAssetUrl('data/parts_db.json'));
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
              if (app && typeof app === 'object') {
                return matchesApplication(app);
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
              if (app && typeof app === 'object') {
                return matchesApplication(app);
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
              if (app && typeof app === 'object') {
                return matchesApplication(app);
              }
              return false;
            })
          );
        }

        // Advanced vehicle filters: only apply when we can interpret structured applications.
        if (qMotor || qVersao || qCombustivel || qCambio || qCarroceria) {
          filtered = filtered.filter(p =>
            p.applications && Array.isArray(p.applications) && p.applications.some(matchesApplication)
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
        const detailedResponse = await fetch(this.publicAssetUrl('data/parts_detailed.json'));
        if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json();
        const detailedPiece = detailedData.find(p => {
          const match = p.id === id || p.id === parseInt(id) || p.id === String(id);
          return match;
        });
        if (detailedPiece) return detailedPiece;
      }
      
      // Fallback to basic data if not found in detailed
      const response = await fetch(this.publicAssetUrl('data/parts_db.json'));
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