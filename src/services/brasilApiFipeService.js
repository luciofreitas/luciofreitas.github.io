// Integração com a BrasilAPI - Tabela FIPE
// Docs: https://brasilapi.com.br/docs#tag/FIPE

const BRASIL_API_BASE = 'https://brasilapi.com.br/api';

const cache = {
  tabelas: null,
  marcas: {},
  veiculos: {},
  preco: {}
};

function buildUrl(path, query) {
  const url = new URL(`${BRASIL_API_BASE}${path}`);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function getJson(path, query) {
  const url = buildUrl(path, query);
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!resp.ok) {
    let details = '';
    try {
      const text = await resp.text();
      details = text ? ` - ${text}` : '';
    } catch (e) {
      // ignore
    }
    throw new Error(`BrasilAPI FIPE: ${resp.status} ${resp.statusText}${details}`);
  }

  return await resp.json();
}

/**
 * Lista as tabelas de referência disponíveis.
 * Retorna array: [{ codigo: number, mes: string }]
 */
export async function listarTabelasReferencia() {
  if (cache.tabelas) return cache.tabelas;
  const data = await getJson('/fipe/tabelas/v1');
  cache.tabelas = Array.isArray(data) ? data : [];
  return cache.tabelas;
}

/**
 * Lista as marcas por tipo: 'carros' | 'motos' | 'caminhoes'
 * Retorna array: [{ nome: string, valor: string }]
 */
export async function listarMarcas(tipoVeiculo = 'carros', tabelaReferencia) {
  const key = `${tipoVeiculo}|${tabelaReferencia || 'atual'}`;
  if (cache.marcas[key]) return cache.marcas[key];

  const data = await getJson(`/fipe/marcas/v1/${encodeURIComponent(tipoVeiculo)}`, {
    tabela_referencia: tabelaReferencia
  });

  cache.marcas[key] = Array.isArray(data) ? data : [];
  return cache.marcas[key];
}

/**
 * Lista modelos/veículos por marca e tipo.
 * OBS: no momento a BrasilAPI retorna uma lista com o campo 'modelo'.
 */
export async function listarVeiculos(tipoVeiculo, codigoMarca, tabelaReferencia) {
  const key = `${tipoVeiculo}|${codigoMarca}|${tabelaReferencia || 'atual'}`;
  if (cache.veiculos[key]) return cache.veiculos[key];

  const data = await getJson(`/fipe/veiculos/v1/${encodeURIComponent(tipoVeiculo)}/${encodeURIComponent(String(codigoMarca))}`, {
    tabela_referencia: tabelaReferencia
  });

  cache.veiculos[key] = Array.isArray(data) ? data : [];
  return cache.veiculos[key];
}

/**
 * Consulta o preço pelo código FIPE (formato: 001004-9).
 * Retorna array com diferentes versões/anos/combustíveis.
 */
export async function consultarPrecoPorCodigoFipe(codigoFipe, tabelaReferencia) {
  const codigo = String(codigoFipe || '').trim();
  if (!/^\d{6}-\d$/.test(codigo)) {
    throw new Error('Código FIPE inválido. Use o formato 001004-9');
  }

  const key = `${codigo}|${tabelaReferencia || 'atual'}`;
  if (cache.preco[key]) return cache.preco[key];

  const data = await getJson(`/fipe/preco/v1/${encodeURIComponent(codigo)}`, {
    tabela_referencia: tabelaReferencia
  });

  cache.preco[key] = Array.isArray(data) ? data : [];
  return cache.preco[key];
}
