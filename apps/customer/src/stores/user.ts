import { create } from 'zustand';

interface User { id?: number; phone?: string; name?: string; level?: string; points?: number; }

interface UserStore {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const savedUser = localStorage.getItem('yunqi-customer-user');
const savedToken = localStorage.getItem('yunqi-customer-token');

export const useUser = create<UserStore>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  login: (user, token) => {
    localStorage.setItem('yunqi-customer-user', JSON.stringify(user));
    localStorage.setItem('yunqi-customer-token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('yunqi-customer-user');
    localStorage.removeItem('yunqi-customer-token');
    set({ user: null, token: null });
  },
}));
