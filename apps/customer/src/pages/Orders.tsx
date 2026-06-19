import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight, Package, ChefHat, Flame, CheckCircle2, XCircle, Check } from 'lucide-react';
import { api } from '../api/client.js';

interface Order {
  id: number;
  order_no: string;
  status: string;
  total: number;
  order_type: string;
  table_no: string | null;
  customer_name: string | null;
  created_at: string;
  paid?: boolean;
  payment_method?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; Icon: any }> = {
  paid: { label: '待制作', color: 'text-gold-700 bg-gold-500/10 border-gold-500/25', Icon: Package },
  pending: { label: '待接单', color: 'text-gold-700 bg-gold-500/10 border-gold-500/25', Icon: Package },
  accepted: { label: '已接单', color: 'text-gold-700 bg-gold-500/10 border-gold-500/25', Icon: ChefHat },
  cooking: { label: '制作中', color: 'text-orange-500 bg-orange-500/10 border-orange-500/25', Icon: Flame },
  ready: { label: '待出餐', color: 'text-water-700 bg-water-200/40 border-water-200/40', Icon: Package },
  completed: { label: '已完成', color: 'text-green-600 bg-green-500/10 border-green-500/25', Icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'text-red-500 bg-red-500/10 border-red-500/25', Icon: XCircle },
};

const filters: { key: 'all' | 'dine' | 'takeaway' | 'delivery'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'dine', label: '堂食' },
  { key: 'takeaway', label: '自取' },
  { key: 'delivery', label: '配送' },
];

const typeLabel = (t: string, tableNo: string | null) => {
  if (t === 'delivery') return '配送订单';
  if (t === 'takeaway') return '自取订单';
  return `堂食 · ${tableNo || '—'}`;
};

export default function Orders() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'dine' | 'takeaway' | 'delivery'>('all');

  const refresh = () => {
    api.get<Order[]>('/orders')
      .then((list) => setOrders(list || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    try {
      const streamUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/stream';
      const es = new EventSource(streamUrl);
      es.onmessage = () => refresh();
      return () => es.close();
    } catch {
      return;
    }
  }, []);

  const fmtTime = (s: string) => {
    if (!s) return '';
    const d = new Date(s);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.order_type === filter);
  }, [orders, filter]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-12 animate-fade-up">
      <section className="mt-6 md:mt-10 mb-6">
        <div className="text-xs text-muted tracking-[0.3em] mb-1">ORDERS</div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink-500">我的订单</h1>
      </section>

      {/* 筛选标签 */}
      {!loading && orders.length > 0 && (
        <section className="mb-5 -mx-4 md:-mx-8 overflow-x-auto">
          <div className="flex gap-2 px-4 md:px-8">
            {filters.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    active
                      ? 'bg-gradient-gold text-white shadow-gold'
                      : 'card-glass text-ink-500 hover:text-gold-700'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {loading ? (
        <div className="card-porcelain py-16 text-center text-muted">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="card-porcelain py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
            <ClipboardList size={28} className="text-gold-700" strokeWidth={1.8} />
          </div>
          <h3 className="font-serif text-xl text-ink-500 mb-2">
            {orders.length === 0 ? '还没有订单' : '此类型暂无订单'}
          </h3>
          <p className="text-sm text-muted mb-6">
            {orders.length === 0 ? '去点几道心仪的菜品吧' : '换一个筛选条件试试'}
          </p>
          <button onClick={() => nav('/menu')} className="btn-gold">立即点餐</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const StatusIcon = status.Icon;
            return (
              <div
                key={order.id}
                onClick={() => nav(`/orders/${order.id}`)}
                className="card-porcelain p-5 cursor-pointer hover:-translate-y-0.5 transition-transform duration-300 animate-fade-up group"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-muted mb-0.5">#{order.order_no}</div>
                    <div className="font-serif text-lg font-semibold text-ink-500">
                      {typeLabel(order.order_type, order.table_no)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                    {order.status !== 'pending' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-500/10 border border-green-500/25 rounded-full px-2.5 py-0.5">
                        <Check size={10} /> 已支付
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gold-700 bg-gold-500/10 border border-gold-500/25 rounded-full px-2.5 py-0.5">
                        待支付
                      </span>
                    )}
                  </div>
                </div>

                <div className="divider-gold mb-3" />

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted">
                    {fmtTime(order.created_at)} · {order.customer_name || '客人'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gold-gradient font-serif text-xl font-semibold">
                      ¥{Number(order.total).toFixed(2)}
                    </span>
                    <ChevronRight size={16} className="text-muted group-hover:text-gold-700 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
