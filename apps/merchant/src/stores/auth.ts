import { create } from 'zustand';
import { api } from '../api/client.js';

interface AuthUser { id: number; username: string; name?: string; role: string; }

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const savedUser = localStorage.getItem('yunqi-merchant-user');
const savedToken = localStorage.getItem('yunqi-merchant-token');

export const useAuth = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  login: async (username, password) => {
    try {
      const data = await api.post<any>('/auth/login', { username, password });
      const user = data.user;
      const token = data.token;
      localStorage.setItem('yunqi-merchant-user', JSON.stringify(user));
      localStorage.setItem('yunqi-merchant-token', token);
      set({ user, token });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem('yunqi-merchant-user');
    localStorage.removeItem('yunqi-merchant-token');
    set({ user: null, token: null });
  },
}));
