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
      console.log('Trying to fetch /data/parts_db.json...');
      const response = await fetch('/data/parts_db.json');
      console.log('Response status:', response.status, response.ok);
      
      if (response.ok) {
        const partsData = await response.json();
        console.log('Parts data loaded:', partsData.length, 'items');
        console.log('Sample item:', partsData[0]);
        
        // Process data to match API format - map English fields to Portuguese
        const grupos = [...new Set(partsData.map(p => p.category).filter(Boolean))].sort();
        const fabricantes = [...new Set(partsData.map(p => p.manufacturer).filter(Boolean))].sort();
        
        console.log('Processed data:', { grupos: grupos.length, pecas: partsData.length, fabricantes: fabricantes.length });
        console.log('Sample grupos:', grupos.slice(0, 5));
        console.log('Sample peça names:', partsData.slice(0, 5).map(p => p.name));
        console.log('Sample fabricantes:', fabricantes.slice(0, 5));
        
        // Extract years and models from applications (they are strings like "Fiat Uno 2010-2011-2012-2013-2014-2015")
        const modelos = new Set();
        const anos = new Set();
        const todasMarcasVeiculos = new Set();
        
        console.log('Processing applications...');
        let appCount = 0;
        
        partsData.forEach(part => {
          if (part.applications && Array.isArray(part.applications)) {
            part.applications.forEach(app => {
              appCount++;
              if (typeof app === 'string') {
                // Parse string like "Fiat Uno 2010-2011-2012-2013-2014-2015"
                const parts = app.trim().split(/\s+/);
                if (parts.length >= 2) {
                  const marca = parts[0]; // "Fiat"
                  const modelo = parts[1]; // "Uno"
                  todasMarcasVeiculos.add(marca);
                  modelos.add(`${marca} ${modelo}`);
                  
                  // Extract years - look for numbers that could be years (4 digits starting with 19 or 20)
                  const yearsMatch = app.match(/\b(19|20)\d{2}\b/g);
                  if (yearsMatch) {
                    yearsMatch.forEach(year => anos.add(year));
                  }
                }
              } else if (typeof app === 'object') {
                // Handle object format if it exists
                if (app.model) modelos.add(app.model);
                if (app.year) anos.add(app.year);
                if (app.make) todasMarcasVeiculos.add(app.make);
              }
            });
          }
        });
        
        console.log(`Processed ${appCount} applications`);
        console.log('Vehicle brands found:', [...todasMarcasVeiculos].slice(0, 10));
        console.log('Models found:', [...modelos].slice(0, 10));
        console.log('Years found:', [...anos].slice(0, 10));
        
        const result = { 
          grupos: grupos, 
          pecas: partsData, // Return full objects, not just names
          marcas: [...todasMarcasVeiculos].sort(), // Use vehicle brands for "marcas" dropdown
          modelos: [...modelos].sort(), 
          anos: [...anos].sort(), 
          fabricantes: fabricantes // fabricantes are the part manufacturers
        };
        
        console.log('Final result:', result);
        return result;
      }
    } catch (error) {
      console.warn('Error loading parts_db.json:', error);
    }
    return this.fetchWithFallback('/api/pecas/meta');
  }

  async filtrarPecas(filtros) {
    console.log('ApiService: filtrarPecas called with:', filtros);
    
    // Try API first
    if (this.isLocal) {
      try {
        console.log('ApiService: Trying API call...');
        const response = await fetch('/api/pecas/filtrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filtros)
        });
        if (response.ok) {
          const result = await response.json();
          console.log('ApiService: API response:', result);
          return result;
        } else {
          console.log('ApiService: API response not ok:', response.status);
        }
      } catch (error) {
        console.warn('API filter call failed, using local data:', error);
      }
    }

    // Fallback: filter local data
    console.log('ApiService: Using local data fallback...');
    try {
      const response = await fetch('/data/parts_db.json');
      if (response.ok) {
        const partsData = await response.json();
        console.log('ApiService: Loaded local parts data:', partsData.length, 'items');
        let filtered = partsData;

        // Apply filters - map Portuguese terms to English fields
        if (filtros.grupo) {
          console.log('ApiService: Filtering by grupo:', filtros.grupo);
          const beforeCount = filtered.length;
          filtered = filtered.filter(p => p.category === filtros.grupo);
          console.log('ApiService: After grupo filter:', filtered.length, 'items (was', beforeCount, ')');
        }
        if (filtros.peca) {
          console.log('ApiService: Filtering by peca:', filtros.peca);
          const beforeCount = filtered.length;
          filtered = filtered.filter(p => p.name === filtros.peca);
          console.log('ApiService: After peca filter:', filtered.length, 'items (was', beforeCount, ')');
        }
        if (filtros.marca) {
          console.log('ApiService: Filtering by marca:', filtros.marca);
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
          console.log('ApiService: Filtering by modelo:', filtros.modelo);
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
          console.log('ApiService: Filtering by ano:', filtros.ano);
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
          console.log('ApiService: Filtering by fabricante:', filtros.fabricante);
          // Filter by part manufacturer
          filtered = filtered.filter(p => 
            p.manufacturer && p.manufacturer.toLowerCase().includes(filtros.fabricante.toLowerCase())
          );
        }

        console.log('ApiService: Final filtered result:', filtered.length, 'items');
        console.log('ApiService: Sample results:', filtered.slice(0, 3));
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
    console.log('ApiService: getPecaById called with ID:', id, typeof id);
    
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
      console.log('ApiService: Trying to fetch /data/parts_detailed.json...');
      // Try detailed data first
      const detailedResponse = await fetch('/data/parts_detailed.json');
      console.log('ApiService: Detailed response status:', detailedResponse.status);
      if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json();
        console.log('ApiService: Detailed data loaded, items count:', detailedData.length);
        console.log('ApiService: Looking for ID:', id, 'in detailed data...');
        const detailedPiece = detailedData.find(p => {
          const match = p.id === id || p.id === parseInt(id) || p.id === String(id);
          console.log('ApiService: Checking piece ID:', p.id, 'against', id, '- Match:', match);
          return match;
        });
        if (detailedPiece) {
          console.log('ApiService: Found detailed piece:', detailedPiece);
          return detailedPiece;
        }
        console.log('ApiService: No detailed piece found, trying basic data...');
      }
      
      // Fallback to basic data if not found in detailed
      const response = await fetch('/data/parts_db.json');
      if (response.ok) {
        const partsData = await response.json();
        const piece = partsData.find(p => p.id === id || p.id === parseInt(id) || p.id === String(id));
        console.log('ApiService: Found basic piece:', piece);
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