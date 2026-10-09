import {
  catalogParams,
  filterProducts,
  isCategory,
  normalizeCatalogFilters,
  normalizeCatalogPage,
  normalizeProducts,
  productFacets,
} from './catalog';

export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

/* utils */
const readTextSafe = async (res) => {
  try {
    return (await res.text())?.trim();
  } catch {
    return '';
  }
};
const auth = (username, password) => 'Basic ' + btoa(`${username}:${password}`);

/* ===== Products ===== */
async function catalogRequest(path) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/products/${path}`);
  } catch {
    throw new Error('Não foi possível conectar à loja. Verifique sua conexão e tente novamente.');
  }
  if (!res.ok) {
    const error = new Error(
      res.status === 400
        ? 'Confira a faixa de preço e os filtros desta busca.'
        : 'Não foi possível consultar a coleção. Tente novamente.',
    );
    error.status = res.status;
    throw error;
  }
  try {
    return await res.json();
  } catch {
    throw new Error('A API retornou uma resposta inválida. Tente novamente.');
  }
}

// Negotiate once: older running backends route "catalog" to /{id}, returning 400.
// Never mask a server outage (5xx) or a filter rejection from a supported endpoint.
let source;
let sourceRequest;
let collectionRequest;
async function catalogSource() {
  if (source) return source;
  if (!sourceRequest)
    sourceRequest = (async () => {
      try {
        normalizeCatalogPage(await catalogRequest('catalog'));
        source = 'paged';
      } catch (error) {
        if (![400, 404, 405].includes(error.status)) throw error;
        await legacyCollection(); // Only enable fallback if the old array contract works.
        source = 'collection';
      }
      return source;
    })().finally(() => {
      sourceRequest = null;
    });
  return sourceRequest;
}
async function legacyCollection() {
  if (!collectionRequest)
    collectionRequest = listProducts().catch((error) => {
      collectionRequest = null;
      throw error;
    });
  return collectionRequest;
}
export function invalidateCatalog() {
  collectionRequest = null;
}
export async function searchProducts(params) {
  const query = catalogParams(params);
  if ((await catalogSource()) === 'collection')
    return filterProducts(await legacyCollection(), query);
  return normalizeCatalogPage(await catalogRequest(`catalog${query ? `?${query}` : ''}`));
}
export async function getCatalogFilters() {
  if ((await catalogSource()) === 'collection') return productFacets(await legacyCollection());
  try {
    return normalizeCatalogFilters(await catalogRequest('filters'));
  } catch (error) {
    if (![400, 404, 405].includes(error.status)) throw error;
    return productFacets(await legacyCollection());
  }
}

export async function listProducts() {
  const res = await fetch(`${API_BASE}/api/products`, { method: 'GET' });
  if (!res.ok) {
    const err = new Error(`Falha ao listar produtos (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return normalizeProducts(await res.json());
}

export async function getProduct(id) {
  const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const err = new Error(
      res.status === 404 ? 'Esta peça não foi encontrada.' : 'Não foi possível carregar esta peça.',
    );
    err.status = res.status;
    throw err;
  }
  const [product] = normalizeProducts([await res.json()]);
  if (!product) throw new Error('Os dados desta peça estão incompletos. Tente novamente.');
  return product;
}

let categorySupportRequest;
async function ensureProductCategorySupport(category) {
  if (!isCategory(category)) throw new Error('Selecione uma categoria válida para o produto.');
  if (!categorySupportRequest)
    categorySupportRequest = (async () => {
      try {
        normalizeCatalogPage(await catalogRequest('catalog'));
      } catch (error) {
        if ([400, 404, 405].includes(error.status))
          throw new Error(
            'O backend em execução está desatualizado e não salva categorias. Reinicie o backend atualizado antes de salvar. Nenhum produto foi enviado.',
          );
        throw error;
      }
    })().catch((error) => {
      categorySupportRequest = null;
      throw error;
    });
  await categorySupportRequest;
}
async function productWriteError(res, fallback) {
  const body = await readTextSafe(res);
  let message = fallback;
  try {
    const problem = JSON.parse(body);
    const detail = problem.detail || problem.message;
    if (typeof detail === 'string' && detail.trim()) message = detail;
  } catch {
    if (body) message = body;
  }
  if (res.status === 401) message = 'Sessão expirada ou credenciais inválidas.';
  if (res.status === 403) message = 'Sem permissão para salvar produtos.';
  const error = new Error(message);
  error.status = res.status;
  return error;
}
async function confirmedProduct(res, category) {
  const product = await res.json();
  if (product?.category !== category)
    throw new Error(
      'A API não confirmou a categoria selecionada. Recarregue os produtos e verifique se o backend está atualizado antes de tentar novamente.',
    );
  return product;
}
export async function createProduct(data, { username, password }) {
  await ensureProductCategorySupport(data.category);
  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth(username, password),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw await productWriteError(res, `Erro ao criar produto (${res.status})`);
  }
  return confirmedProduct(res, data.category);
}

export async function updateProduct(id, data, { username, password }) {
  await ensureProductCategorySupport(data.category);
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth(username, password),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw await productWriteError(res, `Erro ao atualizar produto #${id} (${res.status})`);
  }
  return confirmedProduct(res, data.category);
}

export async function deleteProduct(id, { username, password }) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth(username, password) },
  });

  if (!res.ok) {
    const body = await readTextSafe(res);
    let msg = body || `Erro ao excluir produto #${id} (${res.status})`;
    if (res.status === 401) msg = 'Sessão expirada ou credenciais inválidas.';
    if (res.status === 403) msg = 'Sem permissão para excluir produtos.';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return true;
}

/* ===== Auth check (sem efeito colateral) ===== */
export async function authCheck({ username, password }) {
  // Endpoint de verificação no backend (retorna 204/200 se ok)
  const res = await fetch(`${API_BASE}/api/admin/check`, {
    method: 'GET',
    headers: { Authorization: auth(username, password) },
  });

  if (!res.ok) {
    const body = await readTextSafe(res);
    let msg = body || res.statusText || 'Erro de autenticação.';
    if (res.status === 401) msg = 'Usuário ou senha incorretos.';
    if (res.status === 403) msg = 'Você não tem permissão para acessar o painel.';
    if (res.status >= 500) msg = 'Erro no servidor. Tente novamente em instantes.';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return true; // esperado 200/204
}

/* ===== Tracking ===== */
export async function getTrackSummary(days = 7, { username, password }) {
  const res = await fetch(`${API_BASE}/track/summary?days=${days}`, {
    headers: { Authorization: auth(username, password) },
  });

  if (!res.ok) {
    const body = await readTextSafe(res);
    let msg = body || `Falha ao obter estatísticas (${res.status})`;
    if (res.status === 401) msg = 'Sessão expirada ou credenciais inválidas.';
    if (res.status === 403) msg = 'Sem permissão para ver estatísticas.';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function uploadImage(file, { username, password }) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`${username}:${password}`) },
    body: form,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `POST /uploads ${res.status}`);
  }
  return res.json(); // { url, filename, size, contentType }
}

export async function listCarouselPublic() {
  const res = await fetch(`${API_BASE}/api/carousel`);
  if (!res.ok) throw new Error('Failed to load carousel');
  return res.json();
}

export async function listCarouselAdmin(auth) {
  const res = await fetch(`${API_BASE}/api/carousel/all`, {
    headers: { Authorization: makeAuthHeader(auth) },
  });
  if (!res.ok) throw new Error('Failed to load admin carousel');
  return res.json();
}

export async function saveCarousel(items, auth) {
  const res = await fetch(`${API_BASE}/api/carousel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: makeAuthHeader(auth),
    },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error('Failed to save carousel');
  return res.json();
}

function makeAuthHeader(auth) {
  if (!auth) return undefined;
  if (typeof auth === 'string') {
    return auth.startsWith('Basic ') ? auth : `Basic ${auth}`;
  }
  // objeto { username, password }
  const { username, password } = auth;
  return 'Basic ' + btoa(`${username}:${password}`);
}
