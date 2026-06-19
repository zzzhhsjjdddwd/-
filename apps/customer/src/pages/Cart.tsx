import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../stores/cart';

export default function Cart() {
  const nav = useNavigate();
  const cart = useCart();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-40 animate-fade-up">
      <section className="mt-6 md:mt-10 mb-6">
        <button onClick={() => nav(-1)} className="text-sm text-muted flex items-center gap-1 mb-3 hover:text-ink-500 transition-colors">
          <ArrowLeft size={14} /> 返回
        </button>
        <div className="text-xs text-muted tracking-[0.3em] mb-1">CART</div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink-500">我的购物车</h1>
      </section>

      {cart.totalCount === 0 ? (
        <div className="card-porcelain py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
          <ShoppingBag size={28} className="text-gold-700" strokeWidth={1.8} />
          </div>
          <h3 className="font-serif text-xl text-ink-500 mb-2">购物车是空的</h3>
          <p className="text-sm text-muted mb-6">去挑选几道心仪的菜品吧</p>
          <button onClick={() => nav('/menu')} className="btn-gold">去点餐</button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {cart.items.map((item, i) => (
              <div
                key={item.id}
                className="card-porcelain p-4 md:p-5 animate-fade-up flex gap-4"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-water overflow-hidden shadow-soft flex-shrink-0">
                  {item.dish.image ? (
                    <img src={item.dish.image} alt={item.dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/90 font-serif text-lg">
                      {item.dish.name?.[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="font-serif text-base md:text-lg font-semibold text-ink-500 mb-1">{item.dish.name}</h3>
                  <p className="text-xs text-muted mb-2 line-clamp-1">{item.dish.description}</p>
                  {item.spec && <span className="text-[11px] text-gold-700 mb-2">规格：{item.spec}</span>}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-gold-gradient font-serif text-lg font-semibold">¥{(item.dish.price * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cart.dec(item.id)}
                        className="w-8 h-8 rounded-full bg-gold-500/10 text-gold-700 flex items-center justify-center hover:bg-gold-500/20"
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <span className="text-sm font-semibold text-ink-500 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => cart.inc(item.id)}
                        className="w-8 h-8 rounded-full bg-gradient-gold text-white flex items-center justify-center shadow-gold"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => cart.clearOne(item.id)}
                        className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-1"
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 md:px-8 pb-4 md:pb-6 pointer-events-none">
            <div className="card-glass shadow-float p-5 pointer-events-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-muted">订单合计</div>
                  <div className="text-gold-gradient font-serif text-2xl font-semibold">¥{cart.totalPrice.toFixed(2)}</div>
                </div>
                <div className="text-xs text-muted">共 {cart.totalCount} 件</div>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={() => nav('/menu')} className="btn-porcelain flex-1 py-3 text-sm">继续点餐</button>
                <button onClick={() => nav('/checkout')} className="btn-gold flex-1 py-3 text-sm">
                  去结算
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
