// Serviço para integração com a API da Tabela FIPE
// API pública: https://deividfortuna.github.io/fipe/

const FIPE_API_BASE = 'https://parallelum.com.br/fipe/api/v1';

/**
 * Busca todas as marcas de carros
 */
export async function buscarMarcas() {
  try {
    const response = await fetch(`${FIPE_API_BASE}/carros/marcas`);
    if (!response.ok) throw new Error('Erro ao buscar marcas');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    return [];
  }
}

/**
 * Busca todos os modelos de uma marca específica
 * @param {string} codigoMarca - Código da marca
 */
export async function buscarModelos(codigoMarca) {
  try {
    const response = await fetch(`${FIPE_API_BASE}/carros/marcas/${codigoMarca}/modelos`);
    if (!response.ok) throw new Error('Erro ao buscar modelos');
    const data = await response.json();
    return data.modelos || [];
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
export async function buscarAnos(codigoMarca, codigoModelo) {
  try {
    const response = await fetch(`${FIPE_API_BASE}/carros/marcas/${codigoMarca}/modelos/${codigoModelo}/anos`);
    if (!response.ok) throw new Error('Erro ao buscar anos');
    return await response.json();
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
    const response = await fetch(
      `${FIPE_API_BASE}/carros/marcas/${codigoMarca}/modelos/${codigoModelo}/anos/${codigoAno}`
    );
    if (!response.ok) throw new Error('Erro ao buscar valor');
    return await response.json();
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
    // Códigos de marcas populares no Brasil
    const marcasPopulares = [
      { codigo: '22', nome: 'Chevrolet' },
      { codigo: '21', nome: 'Fiat' },
      { codigo: '59', nome: 'Volkswagen' },
      { codigo: '56', nome: 'Toyota' },
      { codigo: '26', nome: 'Honda' },
      { codigo: '27', nome: 'Hyundai' },
      { codigo: '28', nome: 'Jeep' },
      { codigo: '38', nome: 'Nissan' },
      { codigo: '48', nome: 'Renault' },
      { codigo: '23', nome: 'Ford' },
      { codigo: '6', nome: 'BMW' },
      { codigo: '1', nome: 'Acura' },
      { codigo: '2', nome: 'Agrale' },
      { codigo: '3', nome: 'Alfa Romeo' },
      { codigo: '37', nome: 'Mitsubishi' }
    ];

    const veiculos = [];
    
    // Buscar modelos de todas as marcas populares (aumentado de 5 para 15 marcas)
    for (const marca of marcasPopulares) {
      const modelos = await buscarModelos(marca.codigo);
      
      // Pega os 8 primeiros modelos de cada marca (aumentado de 3 para 8)
      for (const modelo of modelos.slice(0, 8)) {
        const anos = await buscarAnos(marca.codigo, modelo.codigo);
        
        if (anos.length > 0) {
          // Pega o ano mais recente e o anterior (se houver)
          const anosParaBuscar = anos.slice(0, 2);
          
          for (const ano of anosParaBuscar) {
            const valor = await buscarValor(marca.codigo, modelo.codigo, ano.codigo);
            
            if (valor) {
              veiculos.push({
                id: `${marca.codigo}-${modelo.codigo}-${ano.codigo}`,
                marca: marca.nome,
                modelo: valor.Modelo,
                ano: parseInt(ano.nome),
                preco: valor.Valor,
                codigo: valor.CodigoFipe,
                combustivel: valor.Combustivel,
                referencia: valor.MesReferencia,
                codigoMarca: marca.codigo,
                codigoModelo: modelo.codigo,
                codigoAno: ano.codigo
              });
            }
            
            // Delay reduzido para 50ms
            await new Promise(resolve => setTimeout(resolve, 50));
          }
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
      const modelos = await buscarModelos(filtros.codigoMarca);
      
      // Busca valor para os primeiros 50 modelos (aumentado de 20 para 50)
      for (const modelo of modelos.slice(0, 50)) {
        const anos = await buscarAnos(filtros.codigoMarca, modelo.codigo);
        
        if (anos.length > 0) {
          // Busca os 2 anos mais recentes de cada modelo
          const anosParaBuscar = anos.slice(0, 2);
          
          for (const ano of anosParaBuscar) {
            const valor = await buscarValor(filtros.codigoMarca, modelo.codigo, ano.codigo);
            
            if (valor) {
              veiculos.push({
                id: `${filtros.codigoMarca}-${modelo.codigo}-${ano.codigo}`,
                marca: filtros.nomeMarca,
                modelo: valor.Modelo,
                ano: parseInt(ano.nome),
                preco: valor.Valor,
                codigo: valor.CodigoFipe,
                combustivel: valor.Combustivel,
                referencia: valor.MesReferencia,
                codigoMarca: filtros.codigoMarca,
                codigoModelo: modelo.codigo,
                codigoAno: ano.codigo
              });
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Se tem marca e modelo, busca anos do modelo
    if (filtros.codigoMarca && filtros.codigoModelo) {
      const anos = await buscarAnos(filtros.codigoMarca, filtros.codigoModelo);
      
      // Busca todos os anos disponíveis (removido limite)
      for (const ano of anos) {
        const valor = await buscarValor(filtros.codigoMarca, filtros.codigoModelo, ano.codigo);
        
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
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return veiculos;
  } catch (error) {
    console.error('Erro ao buscar veículos com filtros:', error);
    return [];
  }
}
