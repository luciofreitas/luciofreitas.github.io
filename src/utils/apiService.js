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
      const { glossarioMockData } = await import('../data/glossarioData.js');
      return this.fetchWithFallback('/api/glossario-dashboard', glossarioMockData);
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

        // Process data to match API format - map English fields to Portuguese
        const grupos = [...new Set(partsData.map(p => p.category).filter(Boolean))].sort();
        const fabricantes = [...new Set(partsData.map(p => p.manufacturer).filter(Boolean))].sort();

        // Extract years and models from applications (they are strings like "Fiat Uno 2010-2011-2012-2013-2014-2015")
        const modelos = new Set();
        const anos = new Set();
        const todasMarcasVeiculos = new Set();

        let appCount = 0;

        partsData.forEach(part => {
          if (part.applications && Array.isArray(part.applications)) {
            part.applications.forEach(app => {
              appCount++;
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

        const result = {
          grupos: grupos,
          pecas: partsData,
          marcas: [...todasMarcasVeiculos].sort(),
          modelos: [...modelos].sort(),
          anos: [...anos].sort(),
          fabricantes: fabricantes
        };

        return result;
      }
    } catch (error) {
      console.warn('Error loading parts_db.json:', error);
    }
    return this.fetchWithFallback('/api/pecas/meta');
  }

  async filtrarPecas(filtros) {
  // filter called with provided filtros
    // Try API first
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
          filtered = filtered.filter(p => p.category === filtros.grupo);
        }
        if (filtros.peca) {
          filtered = filtered.filter(p => p.name === filtros.peca);
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
        return { results: filtered };
      } else {
        console.error('ApiService: Failed to load /data/parts_db.json:', response.status);
      }
    } catch (error) {
      console.warn('Error filtering local data:', error);
    }

    return { results: [] };
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
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;