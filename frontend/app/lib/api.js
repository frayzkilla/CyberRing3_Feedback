const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Ошибка ${res.status}`);
  }
  return data;
}

export async function getMe() {
  return apiFetch('/me');
}

export async function login(username, password) {
  return apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username, password) {
  return apiFetch('/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return apiFetch('/logout', { method: 'POST' });
}

export async function getRequests() {
  return apiFetch('/requests');
}

export async function getRequestById(id) {
  return apiFetch(`/requests/${id}`);
}

export async function createRequest(content) {
  return apiFetch('/requests', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function submitDonos(data) {
  return apiFetch('/donos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
