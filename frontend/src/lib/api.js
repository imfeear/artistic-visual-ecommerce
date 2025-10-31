export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export async function listProducts() {
  const res = await fetch(`${API_BASE}/api/products`, { method: "GET" });
  if (!res.ok) throw new Error(`GET /products ${res.status}`);
  return res.json();
}

export async function createProduct(data, { username, password }) {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${username}:${password}`)
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `POST /products ${res.status}`);
  }
  return res.json();
}

export async function updateProduct(id, data, { username, password }) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${username}:${password}`)
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `PUT /products/${id} ${res.status}`);
  }
  return res.json();
}

export async function deleteProduct(id, { username, password }) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Basic " + btoa(`${username}:${password}`)
    }
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `DELETE /products/${id} ${res.status}`);
  }
  return true;
}

// ✔ checagem sem efeito colateral
export async function authCheck({ username, password }) {
  const res = await fetch(`${API_BASE}/api/admin/check`, {
    method: "GET",
    headers: { Authorization: "Basic " + btoa(`${username}:${password}`) }
  });
  if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(`Auth check failed: ${res.status}`);
  return true; // 204
}

export async function getTrackSummary(days = 7, { username, password }) {
  const res = await fetch(`${API_BASE}/track/summary?days=${days}`, {
    headers: { Authorization: "Basic " + btoa(`${username}:${password}`) }
  });
  if (!res.ok) throw new Error(`GET /track/summary ${res.status}`);
  return res.json();
}


