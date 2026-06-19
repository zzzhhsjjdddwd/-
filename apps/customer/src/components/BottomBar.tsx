import { Home, UtensilsCrossed, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../stores/cart.js';

const items = [
  { to: '/', label: '首页', Icon: Home },
  { to: '/menu', label: '菜单', Icon: UtensilsCrossed },
  { to: '/cart', label: '购物车', Icon: ShoppingCart },
  { to: '/orders', label: '订单', Icon: ClipboardList },
  { to: '/profile', label: '我的', Icon: User },
];

export default function BottomBar() {
  const loc = useLocation();
  const nav = useNavigate();
  const cart = useCart();
  const count = cart.totalCount;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-brand-100 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, Icon }) => {
          const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to));
          return (
            <button
              key={to}
              onClick={() => nav(to)}
              className={`relative flex flex-col items-center justify-center py-2.5 text-[11px] transition ${
                active ? 'text-brand-600' : 'text-muted'
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
                {to === '/cart' && count > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 rounded-full bg-accent-500 text-white text-[10px] grid place-items-center px-1">
                    {count}
                  </span>
                )}
              </span>
              <span className="mt-0.5">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
