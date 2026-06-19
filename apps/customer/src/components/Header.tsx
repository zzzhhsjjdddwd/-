import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, ShoppingCart, User, ClipboardList, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../stores/cart';

export default function Header() {
  const nav = useNavigate();
  const loc = useLocation();
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (path: string) => {
    nav(path);
    setMenuOpen(false);
  };

  const navItems = [
    { path: '/', label: '点餐', icon: Leaf },
    { path: '/cart', label: '购物车', icon: ShoppingCart },
    { path: '/orders', label: '订单', icon: ClipboardList },
    { path: '/profile', label: '我的', icon: User },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'bg-white/70 backdrop-blur-xl border-b border-gold-500/20 shadow-soft'
          : 'bg-transparent'
      }`}
      style={{ padding: 'env(safe-area-inset-top, 12px) 0 0' }}
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
        {/* Logo + 品牌 */}
        <button onClick={() => go('/')} className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-porcelain flex items-center justify-center border border-gold-500/25 shadow-soft group-hover:scale-105 transition-transform duration-300">
              <span className="text-gold-gradient font-serif font-semibold text-lg">云</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-gold opacity-80" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-serif text-lg font-semibold text-ink-500 leading-tight">云栖浅食</div>
            <div className="text-[11px] text-muted tracking-[0.25em]">ORIENTAL · LIGHT</div>
          </div>
        </button>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-1 bg-white/50 backdrop-blur-lg rounded-full p-1.5 border border-gold-500/20 shadow-soft">
          {navItems.map((item) => {
            const active = loc.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  active
                    ? 'bg-gradient-gold text-white shadow-gold'
                    : 'text-ink-500 hover:bg-gold-500/10'
                }`}
              >
                <Icon size={15} strokeWidth={2.2} />
                <span>{item.label}</span>
                {item.path === '/cart' && cart.totalCount > 0 && (
                  <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/30 text-white' : 'bg-gold-500/20 text-gold-700'}`}>
                    {cart.totalCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-lg border border-gold-500/20 flex items-center justify-center shadow-soft"
        >
          {menuOpen ? <X size={18} className="text-ink-500" /> : <Menu size={18} className="text-ink-500" />}
        </button>
      </div>

      {/* 移动端菜单 */}
      {menuOpen && (
        <div className="md:hidden mx-4 mb-3 animate-scale-in">
          <div className="card-glass p-2 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = loc.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    active ? 'bg-gradient-gold text-white shadow-gold' : 'text-ink-500 hover:bg-gold-500/10'
                  }`}
                >
                  <Icon size={17} strokeWidth={2.2} />
                  <span>{item.label}</span>
                  {item.path === '/cart' && cart.totalCount > 0 && (
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/30' : 'bg-gold-500/20 text-gold-700'}`}>
                      {cart.totalCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
