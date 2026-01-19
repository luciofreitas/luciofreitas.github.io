// Serviço para integração com a API da Tabela FIPE
// API pública: https://deividfortuna.github.io/fipe/

const FIPE_API_BASE = 'https://parallelum.com.br/fipe/api/v1';

// Cache para evitar requisições repetidas
const cache = {
  marcas: {},
  modelos: {},
  anos: {},
  valores: {}
};

function normalizeTipoVeiculo(tipoVeiculo) {
  const t = String(tipoVeiculo || '').trim().toLowerCase();
  if (t === 'carros' || t === 'motos' || t === 'caminhoes') return t;
  return 'carros';
}

/**
 * Busca todas as marcas de carros
 */
export async function buscarMarcas(tipoVeiculo = 'carros') {
  try {
    const tipo = normalizeTipoVeiculo(tipoVeiculo);
    // Retorna do cache se disponível
    if (cache.marcas[tipo]) {
      console.log('Marcas do cache:', cache.marcas[tipo].length);
      return cache.marcas[tipo];
    }
    
    console.log('Buscando marcas da API...');
    const response = await fetch(`${FIPE_API_BASE}/${tipo}/marcas`);
    
    if (!response.ok) {
      console.error('Resposta da API:', response.status, response.statusText);
      throw new Error('Erro ao buscar marcas');
    }
    
    const data = await response.json();
    console.log('Marcas recebidas:', data.length);
    
    // Salva no cache
    cache.marcas[tipo] = data;
    return data;
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    // Retorna array vazio em caso de erro
    return [];
  }
}

/**
 * Busca todos os modelos de uma marca específica
 * @param {string} codigoMarca - Código da marca
 */
export async function buscarModelos(tipoVeiculo = 'carros', codigoMarca) {
  try {
    const tipo = normalizeTipoVeiculo(tipoVeiculo);
    const cacheKey = `${tipo}-${codigoMarca}`;
    // Retorna do cache se disponível
    if (cache.modelos[cacheKey]) {
      return cache.modelos[cacheKey];
    }
    
    const response = await fetch(`${FIPE_API_BASE}/${tipo}/marcas/${codigoMarca}/modelos`);
    if (!response.ok) throw new Error('Erro ao buscar modelos');
    const data = await response.json();
    
    // Salva no cache
    cache.modelos[cacheKey] = data.modelos || [];
    return cache.modelos[cacheKey];
  } catch (error) {
    console.error('Erro ao buscar modelos:', error);
    return [];
  }
}

/**
 * Busca todos os anos disponíveis de um modelo
 * @param {string} codigoMarca - Código da marca
 * @param {string} codigoModelo - Código do modelo
 */
export async function buscarAnos(tipoVeiculo = 'carros', codigoMarca, codigoModelo) {
  try {
    const tipo = normalizeTipoVeiculo(tipoVeiculo);
    const chaveCache = `${tipo}-${codigoMarca}-${codigoModelo}`;
    
    // Retorna do cache se disponível
    if (cache.anos[chaveCache]) {
      return cache.anos[chaveCache];
    }
    
    const response = await fetch(`${FIPE_API_BASE}/${tipo}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos`);
    if (!response.ok) throw new Error('Erro ao buscar anos');
    const data = await response.json();
    
    // Salva no cache
    cache.anos[chaveCache] = data;
    return data;
  } catch (error) {
    console.error('Erro ao buscar anos:', error);
    return [];
  }
}

/**
 * Busca o valor FIPE de um veículo específico
 * @param {string} codigoMarca - Código da marca
 * @param {string} codigoModelo - Código do modelo
 * @param {string} codigoAno - Código do ano
 */
export async function buscarValor(codigoMarca, codigoModelo, codigoAno) {
  try {
    // Compat: assinatura antiga assumia carros
    return await buscarValorPorTipo('carros', codigoMarca, codigoModelo, codigoAno);
  } catch (error) {
    console.error('Erro ao buscar valor:', error);
    return null;
  }
}

/**
 * Busca o valor FIPE de um veículo específico por tipo.
 */
export async function buscarValorPorTipo(tipoVeiculo = 'carros', codigoMarca, codigoModelo, codigoAno) {
  try {
    const tipo = normalizeTipoVeiculo(tipoVeiculo);
    const chaveCache = `${tipo}-${codigoMarca}-${codigoModelo}-${codigoAno}`;
    
    // Retorna do cache se disponível
    if (cache.valores[chaveCache]) {
      return cache.valores[chaveCache];
    }
    
    const response = await fetch(
      `${FIPE_API_BASE}/${tipo}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos/${codigoAno}`
    );
    if (!response.ok) throw new Error('Erro ao buscar valor');
    const data = await response.json();
    
    // Salva no cache
    cache.valores[chaveCache] = data;
    return data;
  } catch (error) {
    console.error('Erro ao buscar valor:', error);
    return null;
  }
}

/**
 * Busca veículos de múltiplas marcas populares
 * Retorna uma amostra de veículos para exibição inicial
 */
export async function buscarVeiculosPopulares() {
  try {
    // Códigos de marcas mais populares no Brasil (reduzido para evitar erro 429)
    const marcasPopulares = [
      { codigo: '22', nome: 'Chevrolet' },
      { codigo: '21', nome: 'Fiat' },
      { codigo: '59', nome: 'Volkswagen' },
      { codigo: '56', nome: 'Toyota' },
      { codigo: '26', nome: 'Honda' }
    ];

    const veiculos = [];
    
    // Buscar modelos de cada marca (reduzido para 5 marcas)
    for (const marca of marcasPopulares) {
      const modelos = await buscarModelos('carros', marca.codigo);
      
      // Pega apenas os 5 primeiros modelos de cada marca (reduzido de 8 para 5)
      for (const modelo of modelos.slice(0, 5)) {
        const anos = await buscarAnos('carros', marca.codigo, modelo.codigo);
        
        if (anos.length > 0) {
          // Pega apenas o ano mais recente
          const anoRecente = anos[0];
          const valor = await buscarValorPorTipo('carros', marca.codigo, modelo.codigo, anoRecente.codigo);
          
          if (valor) {
            veiculos.push({
              id: `${marca.codigo}-${modelo.codigo}-${anoRecente.codigo}`,
              marca: marca.nome,
              modelo: valor.Modelo,
              ano: parseInt(anoRecente.nome),
              preco: valor.Valor,
              codigo: valor.CodigoFipe,
              combustivel: valor.Combustivel,
              referencia: valor.MesReferencia,
              codigoMarca: marca.codigo,
              codigoModelo: modelo.codigo,
              codigoAno: anoRecente.codigo
            });
          }
          
          // Delay aumentado para evitar erro 429
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
    }
    
    return veiculos;
  } catch (error) {
    console.error('Erro ao buscar veículos populares:', error);
    return [];
  }
}

/**
 * Busca veículos com base em filtros
 * @param {Object} filtros - { marca, modelo, ano }
 */
export async function buscarVeiculosComFiltros(filtros = {}) {
  try {
    const veiculos = [];
    
    // Se não tem marca selecionada, retorna veículos populares
    if (!filtros.codigoMarca) {
      return await buscarVeiculosPopulares();
    }
    
    // Se tem marca mas não tem modelo, busca modelos da marca
    if (filtros.codigoMarca && !filtros.codigoModelo) {
      const modelos = await buscarModelos('carros', filtros.codigoMarca);
      
      // Busca valor para os primeiros 20 modelos (reduzido de 50 para 20)
      for (const modelo of modelos.slice(0, 20)) {
        const anos = await buscarAnos('carros', filtros.codigoMarca, modelo.codigo);
        
        if (anos.length > 0) {
          // Busca apenas o ano mais recente
          const anoRecente = anos[0];
          const valor = await buscarValorPorTipo('carros', filtros.codigoMarca, modelo.codigo, anoRecente.codigo);
          
          if (valor) {
            veiculos.push({
              id: `${filtros.codigoMarca}-${modelo.codigo}-${anoRecente.codigo}`,
              marca: filtros.nomeMarca,
              modelo: valor.Modelo,
              ano: parseInt(anoRecente.nome),
              preco: valor.Valor,
              codigo: valor.CodigoFipe,
              combustivel: valor.Combustivel,
              referencia: valor.MesReferencia,
              codigoMarca: filtros.codigoMarca,
              codigoModelo: modelo.codigo,
              codigoAno: anoRecente.codigo
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    // Se tem marca e modelo, busca anos do modelo
    if (filtros.codigoMarca && filtros.codigoModelo) {
      const anos = await buscarAnos('carros', filtros.codigoMarca, filtros.codigoModelo);
      
      // Busca todos os anos disponíveis
      for (const ano of anos) {
        const valor = await buscarValorPorTipo('carros', filtros.codigoMarca, filtros.codigoModelo, ano.codigo);
        
        if (valor) {
          veiculos.push({
            id: `${filtros.codigoMarca}-${filtros.codigoModelo}-${ano.codigo}`,
            marca: filtros.nomeMarca,
            modelo: valor.Modelo,
            ano: parseInt(ano.nome),
            preco: valor.Valor,
            codigo: valor.CodigoFipe,
            combustivel: valor.Combustivel,
            referencia: valor.MesReferencia,
            codigoMarca: filtros.codigoMarca,
            codigoModelo: filtros.codigoModelo,
            codigoAno: ano.codigo
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    return veiculos;
  } catch (error) {
    console.error('Erro ao buscar veículos com filtros:', error);
    return [];
  }
}
