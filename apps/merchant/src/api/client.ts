const API_URL = (import.meta.env.VITE_API_URL || '').trim();
const BASE = API_URL ? API_URL.replace(/\/$/, '') + '/api' : '/api';

async function req<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('yunqi-merchant-token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, { ...options, headers });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message || '请求失败');
  return json.data;
}

export const api = {
  get: <T>(url: string) => req<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) => req<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: any) => req<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => req<T>(url, { method: 'DELETE' }),
  upload: async <T>(url: string, file: File): Promise<T> => {
    const form = new FormData();
    form.append('file', file);
    const token = localStorage.getItem('yunqi-merchant-token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(BASE + url, { method: 'POST', body: form, headers });
    const json = await res.json();
    if (json.code !== 0) throw new Error(json.message || '上传失败');
    return json.data;
  }
};
