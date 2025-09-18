// API utility with JSON fallback for GitHub Pages
class ApiService {
  constructor() {
    this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.baseUrl = this.isLocal ? '' : '';
  }

  async fetchWithFallback(apiPath, fallbackData = null) {
    // Try API first (works locally with backend)
    if (this.isLocal) {
      try {
        const response = await fetch(apiPath);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn(`API call failed for ${apiPath}, falling back to local data:`, error);
      }
    }

    // Fallback to local JSON data for GitHub Pages
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
      '/api/glossario-dashboard': '/src/data/glossarioData.js',
      '/api/luzes-painel': '/data/luzes_painel.json',
      '/api/pecas/meta': '/data/parts_db.json',
    };
    return pathMap[apiPath] || null;
  }

  // Specific methods for each API endpoint
  async getGlossarioDashboard() {
    // Import local data as fallback
    try {
      const { glossarioData } = await import('../data/glossarioData.js');
      return this.fetchWithFallback('/api/glossario-dashboard', glossarioData);
    } catch {
      return this.fetchWithFallback('/api/glossario-dashboard');
    }
  }

  async getLuzesPainel() {
    // Load luzes_painel.json as fallback
    try {
      const response = await fetch('/data/luzes_painel.json');
      const fallbackData = response.ok ? await response.json() : null;
      return this.fetchWithFallback('/api/luzes-painel', fallbackData);
    } catch {
      return this.fetchWithFallback('/api/luzes-painel');
    }
  }

  async getPecasMeta() {
    // Load parts_db.json as fallback
    try {
      const response = await fetch('/data/parts_db.json');
      if (response.ok) {
        const partsData = await response.json();
        // Process data to match API format
        const grupos = [...new Set(partsData.map(p => p.grupo).filter(Boolean))].sort();
        const pecas = [...new Set(partsData.map(p => p.nome).filter(Boolean))].sort();
        const marcas = [...new Set(partsData.flatMap(p => 
          (p.applications || []).map(app => {
            if (typeof app === 'string') return app.split(/\s+/)[0];
            return app.vehicle ? String(app.vehicle).split(/\s+/)[0] : null;
          }).filter(Boolean)
        ))].sort();
        
        return { grupos, pecas, marcas, modelos: [], anos: [], fabricantes: [] };
      }
    } catch (error) {
      console.warn('Error loading parts_db.json:', error);
    }
    return this.fetchWithFallback('/api/pecas/meta');
  }

  async filtrarPecas(filtros) {
    // Try API first
    if (this.isLocal) {
      try {
        const response = await fetch('/api/pecas/filtrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filtros)
        });
        if (response.ok) {
          return await response.json();
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

        // Apply filters
        if (filtros.grupo) {
          filtered = filtered.filter(p => p.grupo === filtros.grupo);
        }
        if (filtros.peca) {
          filtered = filtered.filter(p => p.nome === filtros.peca);
        }
        if (filtros.marca) {
          filtered = filtered.filter(p => 
            (p.applications || []).some(app => {
              const brand = typeof app === 'string' ? 
                app.split(/\s+/)[0] : 
                String(app.vehicle || '').split(/\s+/)[0];
              return brand.toLowerCase().includes(filtros.marca.toLowerCase());
            })
          );
        }

        return { results: filtered };
      }
    } catch (error) {
      console.warn('Error filtering local data:', error);
    }

    return { results: [] };
  }

  async getPecaById(id) {
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

    // Fallback: find in local data
    try {
      const response = await fetch('/data/parts_db.json');
      if (response.ok) {
        const partsData = await response.json();
        const piece = partsData.find(p => p.id === id || p.id === parseInt(id));
        return piece || { error: 'Peça não encontrada' };
      }
    } catch (error) {
      console.warn('Error finding piece in local data:', error);
    }

    return { error: 'Peça não encontrada' };
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;