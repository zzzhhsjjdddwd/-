import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import type { Category, Dish } from '../../../../shared/types.js';
import DishCard from '../components/DishCard.js';
import Empty from '../components/Empty.js';
import { useCart } from '../stores/cart.js';
import { useToast } from '../components/Toast.js';

export default function Menu() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const toast = useToast();
  const cart = useCart();
  const [cats, setCats] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [kw, setKw] = useState('');

  useEffect(() => {
    api.get<Category[]>('/categories').then((c) => {
      setCats(c);
      const fromUrl = sp.get('category');
      if (fromUrl && c.find((x) => x.id === Number(fromUrl))) {
        setActiveCat(Number(fromUrl));
      }
    });
    api.get<Dish[]>('/dishes?active=1').then(setDishes);
  }, []);

  const filtered = useMemo(() => {
    return dishes.filter((d) => {
      if (activeCat && d.category_id !== activeCat) return false;
      if (kw && !d.name.includes(kw)) return false;
      return true;
    });
  }, [dishes, activeCat, kw]);

  const cartCount = cart.totalCount;

  return (
    <div className="pb-24 md:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink">选择今日的轻食</h1>
        <p className="text-sm text-muted mt-1.5">按分类浏览或搜索你想吃的食物</p>

        {/* 搜索框 */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="搜索菜品..."
            className="w-full pl-12 pr-12 h-12 rounded-full bg-white border border-brand-100 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition text-sm"
          />
          {kw && (
            <button
              onClick={() => setKw('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
              aria-label="清除"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 flex gap-6">
        {/* 分类侧栏 */}
        <aside className="hidden md:block w-40 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            <button
              onClick={() => setActiveCat(null)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition ${
                activeCat === null ? 'bg-brand-500 text-white shadow-soft' : 'text-ink/80 hover:bg-brand-50'
              }`}
            >
              全部
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition ${
                  activeCat === c.id ? 'bg-brand-500 text-white shadow-soft' : 'text-ink/80 hover:bg-brand-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </aside>

        {/* 菜品列表 */}
        <main className="flex-1 min-w-0">
          {/* 移动端分类横滑 */}
          <div className="md:hidden mb-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 whitespace-nowrap">
              <button
                onClick={() => setActiveCat(null)}
                className={`px-4 h-9 rounded-full text-sm transition ${
                  activeCat === null ? 'bg-brand-500 text-white' : 'bg-white text-ink/80 border border-brand-100'
                }`}
              >
                全部
              </button>
              {cats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`px-4 h-9 rounded-full text-sm transition ${
                    activeCat === c.id ? 'bg-brand-500 text-white' : 'bg-white text-ink/80 border border-brand-100'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <Empty title="没有找到相关菜品" desc="换个关键词或试试其他分类吧" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((d, i) => (
                <div key={d.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <DishCard
                    dish={d}
                    onAdd={(dish) => {
                      cart.add({ id: dish.id, dish });
                      toast.push(`已加入 · ${dish.name}`);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 浮动购物车按钮（移动端） */}
      {cartCount > 0 && (
        <button
          onClick={() => nav('/cart')}
          className="md:hidden fixed right-5 bottom-24 z-30 flex items-center gap-3 btn-press pl-5 pr-6 h-14 rounded-full bg-brand-500 text-white shadow-glow animate-scale-in"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-sm">
            {cartCount} 件 · ¥{cart.totalPrice.toFixed(2)}
          </span>
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">去结算</span>
        </button>
      )}
    </div>
  );
}
