import { create } from 'zustand';

interface Toast { id: number; text: string; type?: 'success' | 'error' | 'info' }
interface Store { toasts: Toast[]; push: (text: string, type?: Toast['type']) => void; remove: (id: number) => void }
let _id = 0;
export const useToast = create<Store>((set) => ({
  toasts: [],
  push: (text, type = 'success') => {
    const id = ++_id;
    set((s) => ({ toasts: [...s.toasts, { id, text, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2200);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function Toasts() {
  const { toasts } = useToast();
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-full text-sm shadow-glow animate-scale-in ${
            t.type === 'error'
              ? 'bg-red-500 text-white'
              : t.type === 'info'
              ? 'bg-ink text-white'
              : 'bg-brand-500 text-white'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
