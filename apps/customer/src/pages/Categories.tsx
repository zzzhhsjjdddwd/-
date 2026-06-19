import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Flame, Leaf } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../stores/cart';

interface Dish { id: number; name: string; category_id: number; description?: string; price: number; image?: string; active?: number }
interface Category { id: number; name: string; description?: string; slug?: string }

export default function Categories() {
  const nav = useNavigate();
  const cart = useCart();
  const [cats, setCats] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [activeCat, setActiveCat] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Category[]>('/categories').then((list) => setCats(list || []));
    api.get<Dish[]>('/dishes?active=1').then((list) => setDishes(list || []));
  }, []);

  const filtered = dishes.filter((d) => {
    const matchCat = activeCat === 'all' || d.category_id === activeCat;
    const matchSearch = !search || d.name.includes(search) || (d.description || '').includes(search);
    return matchCat && matchSearch;
  });

  const getCount = (catId: number | 'all') => {
    if (catId === 'all') return dishes.length;
    return dishes.filter((d) => d.category_id === catId).length;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-28 animate-fade-up">
      <section className="mt-6 md:mt-10 mb-6">
        <div className="text-xs text-muted tracking-[0.3em] mb-1">MENU</div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink-500 mb-4">完整菜单</h1>
        <div className="relative">
          <Search size={17} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" strokeWidth={2.2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索菜品名称..."
            className="input-gold"
            style={{ paddingLeft: '3rem' }}
          />
        </div>
      </section>

      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveCat('all')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCat === 'all'
                ? 'bg-gradient-gold text-white shadow-gold'
                : 'bg-white/70 backdrop-blur-lg text-ink-500 border border-gold-500/20 hover:border-gold-500/40'
            }`}
          >
            <Leaf size={14} />
            全部 ({getCount('all')})
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCat === c.id
                  ? 'bg-gradient-gold text-white shadow-gold'
                  : 'bg-white/70 backdrop-blur-lg text-ink-500 border border-gold-500/20 hover:border-gold-500/40'
              }`}
            >
              {c.name} ({getCount(c.id)})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {filtered.length === 0 ? (
          <div className="card-porcelain py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
              <Search size={22} className="text-gold-700" />
            </div>
            <h3 className="font-serif text-lg text-ink-500 mb-1">暂无匹配菜品</h3>
            <p className="text-sm text-muted">试试其他关键词吧</p>
          </div>
        ) : (
          filtered.map((dish, i) => {
            const count = cart.items.find((it) => String(it.id).startsWith(String(dish.id) + '_') || it.id === dish.id)?.quantity || 0;
            const inCart = cart.items.find((it) =>
              String(it.id).startsWith(String(dish.id) + '_') || it.id === dish.id
            );
            const qty = inCart?.quantity || 0;
            return (
              <div
                key={dish.id}
                className="card-porcelain p-4 md:p-5 flex gap-4 md:gap-5 animate-fade-up group hover:-translate-y-0.5 transition-transform"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-2xl bg-gradient-water overflow-hidden shadow-soft">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/90 font-serif text-xl">
                      {dish.name?.[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-serif text-base md:text-lg font-semibold text-ink-500 leading-tight">
                      {dish.name}
                    </h3>
                    {dish.active && (
                      <span className="flex-shrink-0 text-[10px] text-gold-700 bg-gold-500/10 border border-gold-500/20 rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Flame size={9} /> 热卖
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-2 flex-1">
                    {dish.description || '新鲜食材，手工烹制。'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gold-gradient font-serif text-lg md:text-xl font-semibold">¥{dish.price}</span>
                    {qty === 0 ? (
                      <button onClick={() => cart.add({ id: dish.id, dish, quantity: 1 })} className="btn-gold py-2 px-5 text-xs">
                        加入
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-white border border-gold-500/20 rounded-full p-1 shadow-soft">
                        <button
                          onClick={() => cart.dec(dish.id)}
                          className="w-8 h-8 rounded-full bg-gold-500/10 text-gold-700 flex items-center justify-center hover:bg-gold-500/20 transition-colors"
                        >
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span className="text-sm font-semibold text-ink-500 w-5 text-center">{qty}</span>
                        <button
                          onClick={() => cart.inc(dish.id)}
                          className="w-8 h-8 rounded-full bg-gradient-gold text-white flex items-center justify-center shadow-gold"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {cart.totalCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
          <div className="card-glass shadow-float px-4 py-3 flex items-center justify-between animate-scale-in">
            <div>
              <div className="text-xs text-muted">共 {cart.totalCount} 件 · 合计</div>
              <div className="text-gold-gradient font-serif text-lg font-semibold">¥{cart.totalPrice.toFixed(2)}</div>
            </div>
            <button onClick={() => nav('/cart')} className="btn-gold py-2.5 px-6 text-sm">
              查看购物车
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
