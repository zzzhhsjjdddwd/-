const API_URL = (import.meta.env.VITE_API_URL || '').trim();
const BASE = API_URL ? API_URL.replace(/\/$/, '') + '/api' : '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('yunqi-customer-token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, { ...options, headers });
  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || '请求失败');
  }
  return json.data;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: any) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
