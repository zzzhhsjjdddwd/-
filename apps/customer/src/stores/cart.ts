import { create } from 'zustand';

interface Dish {
  id: number;
  name: string;
  category_id?: number;
  description?: string;
  price: number;
  image?: string;
  active?: number;
  recommended?: number;
  category_name?: string;
}

interface CartItem {
  id: string | number;
  dish: Dish;
  quantity: number;
  spec?: string;
}

interface CartStore {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  add: (item: { id: number | string; dish: Dish; quantity?: number; spec?: string }) => void;
  remove: (id: string | number) => void;
  dec: (id: string | number) => void;
  inc: (id: string | number) => void;
  clearOne: (id: string | number) => void;
  clear: () => void;
}

const STORAGE_KEY = 'yunqi-customer-cart';

const loadItems = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveItems = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

const totals = (items: CartItem[]) => ({
  totalCount: items.reduce((s, i) => s + i.quantity, 0),
  totalPrice: items.reduce((s, i) => s + i.dish.price * i.quantity, 0),
});

export const useCart = create<CartStore>((set) => {
  const initial = loadItems();
  return {
    items: initial,
    totalCount: initial.reduce((s, i) => s + i.quantity, 0),
    totalPrice: initial.reduce((s, i) => s + i.dish.price * i.quantity, 0),

    add: ({ id, dish, quantity = 1, spec }) => {
      set((s) => {
        const realId = String(id) + (spec ? '_' + spec : '');
        const idx = s.items.findIndex((i) => String(i.id) === realId);
        const next = [...s.items];
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        } else {
          next.push({ id: realId, dish, quantity, spec });
        }
        saveItems(next);
        return { items: next, ...totals(next) };
      });
    },

    dec: (id) => {
      set((s) => {
        const next = s.items
          .map((i) => (String(i.id) === String(id) ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0);
        saveItems(next);
        return { items: next, ...totals(next) };
      });
    },

    remove: (id) => {
      set((s) => {
        const next = s.items
          .map((i) => (String(i.id) === String(id) ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0);
        saveItems(next);
        return { items: next, ...totals(next) };
      });
    },

    inc: (id) => {
      set((s) => {
        const next = s.items.map((i) =>
          String(i.id) === String(id) ? { ...i, quantity: i.quantity + 1 } : i
        );
        saveItems(next);
        return { items: next, ...totals(next) };
      });
    },

    clearOne: (id) => {
      set((s) => {
        const next = s.items.filter((i) => String(i.id) !== String(id));
        saveItems(next);
        return { items: next, ...totals(next) };
      });
    },

    clear: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({ items: [], totalCount: 0, totalPrice: 0 });
    },
  };
});
