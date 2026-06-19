import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Sparkles, Clock, ChevronRight, Flame, Flower2 } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../stores/cart';

interface Dish {
  id: number;
  name: string;
  category_id: number;
  description: string;
  price: number;
  image: string;
  active: number;
  recommended?: number;
}

export default function Home() {
  const nav = useNavigate();
  const cart = useCart();
  const [featured, setFeatured] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [time, setTime] = useState('');

  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    const greet = h < 6 ? '夜深了' : h < 11 ? '早安' : h < 14 ? '午安' : h < 18 ? '下午好' : '晚上好';
    setTime(greet);

    api.get<any[]>('/dishes?active=1&recommended=1').then((list: Dish[]) => {
      if (list && list.length > 0) {
        setFeatured(list.slice(0, 6));
      } else {
        api.get<any[]>('/dishes?active=1').then((all: Dish[]) => {
          setFeatured(all.slice(0, 6));
        });
      }
    }).catch(() => {
      api.get<any[]>('/dishes?active=1').then((all: Dish[]) => {
        setFeatured(all.slice(0, 6));
      });
    });

    api.get<any[]>('/categories').then((list) => setCategories(list || []));
  }, []);

  const addToCart = (dish: Dish) => {
    cart.add({ id: dish.id, dish, quantity: 1 });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-24 animate-fade-up">
      {/* Hero 区域 */}
      <section className="mt-6 md:mt-10 relative">
        <div className="absolute top-6 right-6 md:right-10 w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-water opacity-60 blur-xl animate-float-slow" />
        <div className="absolute bottom-12 left-4 w-10 h-10 rounded-full bg-gradient-gold opacity-30 blur-lg animate-float-slow" style={{ animationDelay: '1s' }} />

        <div className="card-porcelain overflow-hidden relative">
          <div className="bg-dots absolute inset-0 opacity-40" />
          <div className="relative grid md:grid-cols-5 gap-0 items-center">
            <div className="col-span-3 p-7 md:p-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-700 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">
                  <Sparkles size={11} strokeWidth={2.5} />
                  <span>东方禅意 · 新鲜现做</span>
                </span>
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-ink-500 leading-[1.15] mb-3">
                {time}，<span className="text-gold-gradient">与美食相遇</span>
              </h1>
              <p className="text-muted text-sm md:text-base leading-relaxed max-w-md mb-6">
                云栖浅食精选时令食材，以匠心烹制每一道轻食佳肴。
                茶香、山鲜、海味，皆在瓷盘之中。
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-7">
                <span className="tag"><Flower2 size={11} />每日新鲜</span>
                <span className="tag tag-water"><Clock size={11} />15–25 分钟</span>
                <span className="tag"><Flame size={11} />主厨推荐</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => nav('/menu')} className="btn-gold">立即点餐</button>
                <button onClick={() => nav('/orders')} className="btn-porcelain">我的订单</button>
              </div>
            </div>
            <div className="col-span-2 relative hidden md:block h-full min-h-[320px]">
              <div className="absolute inset-4 rounded-4xl bg-gradient-water overflow-hidden shadow-float">
                <img src="/logo.svg" alt="品牌" className="w-full h-full object-contain p-10 opacity-90" />
              </div>
              <div className="absolute bottom-10 left-0 card-glass px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="w-9 h-9 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold">
                  <Leaf size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-500">健康低卡</div>
                  <div className="text-xs text-muted">精选橄榄油 · 海盐</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 分类 */}
      <section className="mt-8 md:mt-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-xs text-muted tracking-[0.3em] mb-1">CATEGORIES</div>
            <h2 className="font-serif text-xl md:text-2xl">精选分类</h2>
          </div>
          <button onClick={() => nav('/menu')} className="text-sm text-gold-700 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            查看全部 <ChevronRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              onClick={() => nav('/menu')}
              className="card-glass p-4 md:p-5 text-center hover:-translate-y-1 transition-transform duration-300 group"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-2 rounded-2xl bg-gradient-porcelain flex items-center justify-center border border-gold-500/20 group-hover:bg-gradient-gold group-hover:text-white transition-colors duration-300">
                <span className="font-serif text-lg md:text-xl text-gold-gradient group-hover:text-white">{cat.name?.[0] || '?'}</span>
              </div>
              <div className="text-sm font-medium text-ink-500">{cat.name}</div>
              <div className="text-[10px] text-muted mt-0.5">{cat.description || cat.slug || '精选'}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 主厨推荐 */}
      <section className="mt-8 md:mt-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-xs text-muted tracking-[0.3em] mb-1">CHEF'S PICK</div>
            <h2 className="font-serif text-xl md:text-2xl">主厨推荐</h2>
          </div>
          <button onClick={() => nav('/menu')} className="text-sm text-gold-700 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            更多 <ChevronRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {featured.map((dish, i) => (
            <div
              key={dish.id}
              className="card-porcelain overflow-hidden group hover:-translate-y-1 transition-all duration-500 animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="relative h-48 md:h-52 bg-gradient-water overflow-hidden">
                {dish.image ? (
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/90 font-serif text-2xl">
                    {dish.name}
                  </div>
                )}
                <div className="absolute top-3 left-3 tag bg-white/80 backdrop-blur-sm">
                  <Flame size={11} className="text-gold-700" />
                  <span>招牌</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-500/30 to-transparent" />
              </div>
              <div className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="font-serif text-lg font-semibold text-ink-500 leading-tight">{dish.name}</h3>
                  <span className="text-gold-gradient font-serif text-lg font-semibold whitespace-nowrap">¥{dish.price}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
                  {dish.description || '精选时令食材，匠心烹制。'}
                </p>
                <button onClick={() => addToCart(dish)} className="btn-porcelain w-full py-2.5 text-sm">加入购物车</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {cart.totalCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 animate-scale-in w-full max-w-md px-4">
          <div className="card-glass shadow-float px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold relative">
                <Leaf size={18} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full text-[10px] font-bold text-gold-700 flex items-center justify-center border border-gold-500/30">
                  {cart.totalCount}
                </span>
              </div>
              <div>
                <div className="text-xs text-muted">合计</div>
                <div className="text-gold-gradient font-serif text-lg font-semibold">¥{cart.totalPrice.toFixed(2)}</div>
              </div>
            </div>
            <button onClick={() => nav('/cart')} className="btn-gold py-2.5 px-5 text-sm">去结算</button>
          </div>
        </div>
      )}
    </div>
  );
}
