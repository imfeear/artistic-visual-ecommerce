export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

/* utils */
const readTextSafe = async (res) => {
  try { return (await res.text())?.trim(); } catch { return ""; }
};
const auth = (username, password) => "Basic " + btoa(`${username}:${password}`);

/* ===== Products ===== */
export async function listProducts() {
  const res = await fetch(`${API_BASE}/api/products`, { method: "GET" });
  if (!res.ok) {
    const err = new Error(`Falha ao listar produtos (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function createProduct(data, { username, password }) {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth(username, password),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await readTextSafe(res);
    let msg = body || `Erro ao criar produto (${res.status})`;
    if (res.status === 401) msg = "Sessão expirada ou credenciais inválidas.";
    if (res.status === 403) msg = "Sem permissão para criar produtos.";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function updateProduct(id, data, { username, password }) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth(username, password),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await readTextSafe(res);
    let msg = body || `Erro ao atualizar produto #${id} (${res.status})`;
    if (res.status === 401) msg = "Sessão expirada ou credenciais inválidas.";
    if (res.status === 403) msg = "Sem permissão para editar produtos.";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function deleteProduct(id, { username, password }) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: auth(username, password) },
  });

  if (!res.ok) {
    const body = await readTextSafe(res);
    let msg = body || `Erro ao excluir produto #${id} (${res.status})`;
    if (res.status === 401) msg = "Sessão expirada ou credenciais inválidas.";
    if (res.status === 403) msg = "Sem permissão para excluir produtos.";
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
    method: "GET",
    headers: { Authorization: auth(username, password) },
  });

  if (!res.ok) {
    const body = await readTextSafe(res);
    let msg = body || res.statusText || "Erro de autenticação.";
    if (res.status === 401) msg = "Usuário ou senha incorretos.";
    if (res.status === 403) msg = "Você não tem permissão para acessar o painel.";
    if (res.status >= 500) msg = "Erro no servidor. Tente novamente em instantes.";
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
    if (res.status === 401) msg = "Sessão expirada ou credenciais inválidas.";
    if (res.status === 403) msg = "Sem permissão para ver estatísticas.";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function uploadImage(file, { username, password }) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${username}:${password}`) },
    body: form
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
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
  if (typeof auth === "string") {
    return auth.startsWith("Basic ") ? auth : `Basic ${auth}`;
  }
  // objeto { username, password }
  const { username, password } = auth;
  return "Basic " + btoa(`${username}:${password}`);
}