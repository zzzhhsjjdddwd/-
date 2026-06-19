import { ShoppingCart, Leaf, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '../stores/cart.js';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function TopBar() {
  const cart = useCart();
  const nav = useNavigate();
  const [showMobile, setShowMobile] = useState(false);
  const count = cart.totalCount;

  const menu = [
    { label: '首页', to: '/' },
    { label: '菜单', to: '/menu' },
    { label: '我的订单', to: '/orders' },
    { label: '我的', to: '/profile' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur border-b border-brand-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => nav('/')} className="flex items-center gap-2 btn-press">
          <span className="w-10 h-10 rounded-xl2 bg-brand-500 text-canvas grid place-items-center shadow-soft">
            <Leaf className="w-5 h-5" strokeWidth={2} />
          </span>
          <div className="leading-tight text-left">
            <div className="font-serif text-xl text-brand-700">云栖浅食</div>
            <div className="text-[11px] text-muted -mt-0.5">YUNQI · LIGHT MEAL</div>
          </div>
        </button>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-1">
          {menu.map((m) => (
            <button
              key={m.to}
              onClick={() => nav(m.to)}
              className="px-4 h-10 rounded-full text-sm text-ink/80 hover:text-brand-600 hover:bg-brand-50 transition btn-press"
            >
              {m.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => nav('/cart')}
            className="relative w-11 h-11 rounded-full grid place-items-center bg-brand-500 text-canvas hover:bg-brand-600 transition shadow-soft btn-press"
            aria-label="购物车"
          >
            <ShoppingCart className="w-5 h-5" strokeWidth={2} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-accent-500 text-[11px] text-white grid place-items-center px-1 shadow">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowMobile((v) => !v)}
            className="md:hidden w-11 h-11 rounded-full grid place-items-center bg-white border border-brand-100 btn-press"
            aria-label="菜单"
          >
            {showMobile ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {showMobile && (
        <div className="md:hidden border-t border-brand-100 bg-white animate-fade-up">
          <div className="max-w-6xl mx-auto px-4 py-2 grid grid-cols-4 gap-1">
            {menu.map((m) => (
              <button
                key={m.to}
                onClick={() => {
                  setShowMobile(false);
                  nav(m.to);
                }}
                className="py-3 text-sm text-ink/80 hover:text-brand-600"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
