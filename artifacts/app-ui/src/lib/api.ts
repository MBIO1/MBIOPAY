// Base API wrapper
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function doLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/auth';
}

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newToken: string | null = data?.token ?? data?.accessToken ?? null;
    if (newToken) {
      localStorage.setItem('token', newToken);
      if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    }
    return newToken;
  } catch {
    return null;
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const makeRequest = (extraHeaders: Record<string, string> = {}) =>
    fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
        ...extraHeaders,
      },
    });

  let response = await makeRequest();

  if (response.status === 401) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      response = await makeRequest({ Authorization: `Bearer ${newToken}` });
    }
    if (response.status === 401) {
      doLogout();
      throw new Error('Session expired. Please sign in again.');
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'An error occurred');
  }

  return data as T;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return fetchApi<T>(path, options);
}

export async function setup2FA() {
  return apiFetch<{ qr: string; base32: string }>("/auth/2fa/setup", { method: "GET" });
}

export async function enable2FA(token: string) {
  return apiFetch<{ ok: boolean }>("/auth/2fa/enable", { method: "POST", body: JSON.stringify({ token }) });
}

export async function disable2FA(password: string, token: string) {
  return apiFetch<{ ok: boolean }>("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ password, token }) });
}

export async function get2FAStatus() {
  return apiFetch<{ totpEnabled: boolean }>("/auth/2fa/status", { method: "GET" });
}
