import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Leaf, LogOut, ChevronRight, ClipboardList, MapPin, UtensilsCrossed, Info, Sparkles } from 'lucide-react';
import { api } from '../api/client.js';
import { useUser } from '../stores/user.js';
import { useToast } from '../components/Toast.js';

interface Customer {
  id: number;
  name: string;
  phone: string;
  level?: string;
  points?: number;
  order_count?: number;
  total_amount?: number;
}

const menu = [
  { Icon: ClipboardList, label: '我的订单', desc: '查看所有历史订单', to: '/orders' },
  { Icon: MapPin, label: '地址管理', desc: '管理配送地址', to: '/address' },
  { Icon: UtensilsCrossed, label: '健康推荐', desc: '每日时令菜品', to: '/menu' },
  { Icon: Info, label: '关于我们', desc: '云栖浅食 · v1.0', to: null, action: 'about' },
];

export default function Profile() {
  const nav = useNavigate();
  const toast = useToast();
  const userStore = useUser();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!userStore.user || !!userStore.token;

  useEffect(() => {
    if (!isLoggedIn) return;
    const id = userStore.user?.id;
    if (!id) return;
    setLoading(true);
    api.get<Customer>(`/customers/${id}`)
      .then((data) => setCustomer(data))
      .catch((e) => toast.push(e.message || '加载失败', 'error'))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleMenuClick = (m: typeof menu[0]) => {
    if (m.action === 'about') {
      toast.push('云栖浅食 · 用心做每一道菜', 'info');
      return;
    }
    if (m.to) nav(m.to);
  };

  const handleLogout = () => {
    userStore.logout();
    toast.push('已退出登录');
  };

  const initials = (customer?.name || userStore.user?.name || '贵').charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-12 animate-fade-up">
      <section className="mt-6 md:mt-10 mb-6">
        <div className="text-xs text-muted tracking-[0.3em] mb-1">PROFILE</div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink-500">我的</h1>
      </section>

      {!isLoggedIn ? (
        <section className="card-porcelain overflow-hidden mb-5 relative p-8 md:p-10 text-center">
          <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-gold flex items-center justify-center text-white shadow-gold">
            <User size={36} strokeWidth={1.8} />
          </div>
          <h2 className="font-serif text-xl md:text-2xl text-ink-500 mb-2">欢迎来到云栖浅食</h2>
          <p className="text-sm text-muted mb-6">登录后可查看订单、管理地址与积分</p>
          <button onClick={() => nav('/login')} className="btn-gold !py-3 px-8">登录 / 注册</button>
        </section>
      ) : (
        <section className="card-porcelain overflow-hidden mb-5 relative">
          <div className="bg-dots absolute inset-0 opacity-40" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-center gap-4 md:gap-5 mb-5">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-gold flex items-center justify-center text-white shadow-gold text-2xl font-serif font-semibold">
                {initials}
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-xl md:text-2xl text-ink-500 mb-1">
                  {loading ? '加载中...' : customer?.name || userStore.user?.name || '尊贵的客人'}
                </h2>
                <p className="text-sm text-muted">{customer?.phone || userStore.user?.phone || '—'}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-gold-700 bg-gold-500/10 border border-gold-500/20 rounded-full px-2.5 py-0.5">
                  <Sparkles size={10} /> {customer?.level || userStore.user?.level || '云栖会员'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="card-glass p-3 md:p-4 text-center">
                <div className="text-xs text-muted mb-1">积分</div>
                <div className="font-serif text-lg md:text-xl text-gold-700 font-semibold">
                  {customer?.points ?? userStore.user?.points ?? 0}
                </div>
              </div>
              <div className="card-glass p-3 md:p-4 text-center">
                <div className="text-xs text-muted mb-1">订单数</div>
                <div className="font-serif text-lg md:text-xl text-gold-700 font-semibold">
                  {customer?.order_count ?? 0}
                </div>
              </div>
              <div className="card-glass p-3 md:p-4 text-center">
                <div className="text-xs text-muted mb-1">累计消费</div>
                <div className="font-serif text-lg md:text-xl text-gold-gradient font-semibold">
                  ¥{Number(customer?.total_amount ?? 0).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="divider-gold mb-4" />

            <button onClick={handleLogout} className="btn-porcelain w-full !py-3 text-sm flex items-center justify-center gap-1.5">
              <LogOut size={14} /> 退出登录
            </button>
          </div>
        </section>
      )}

      {/* 菜单项 */}
      <section className="card-porcelain overflow-hidden mb-5">
        {menu.map((m, i) => {
          const Icon = m.Icon;
          return (
            <button
              key={m.label}
              onClick={() => handleMenuClick(m)}
              className={`w-full flex items-center gap-3 p-4 md:p-5 hover:bg-gold-500/5 transition-colors text-left ${
                i > 0 ? 'border-t border-gold-500/10' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center text-gold-700">
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-ink-500 font-medium">{m.label}</div>
                <div className="text-[11px] text-muted">{m.desc}</div>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </button>
          );
        })}
      </section>

      {/* 快捷入口 */}
      {isLoggedIn && (
        <section className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted mb-0.5">查看历史订单</div>
              <div className="text-sm text-ink-500 font-medium">追踪我的每一次用餐</div>
            </div>
            <button onClick={() => nav('/orders')} className="btn-gold py-2.5 px-5 text-sm">
              查看订单
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
