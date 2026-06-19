import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ClipboardList, Users, ChefHat, Flame, Package, ArrowUpRight, Leaf } from 'lucide-react';
import { api } from '../api/client';

interface Order { id: number; order_no: string; total: number; status: string; created_at: string; customer_name?: string; items?: any[] }
interface Dish { id: number; name: string; active: number }
interface Category { id: number; name: string }

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [summary, setSummary] = useState({ today_count: 0, today_revenue: 0, total_count: 0, total_revenue: 0, avg_price: 0 });
  const [trend, setTrend] = useState<{ day: string; orders: number; revenue: number }[]>([]);

  useEffect(() => {
    api.get<Order[]>('/orders').then(setOrders).catch(() => []);
    api.get<Dish[]>('/dishes').then(setDishes).catch(() => []);
    api.get<Category[]>('/categories').then(setCats).catch(() => []);
    api.get<any>('/reports/summary').then((s) => setSummary(s || summary)).catch(() => {});
    api.get<any[]>('/reports/trend').then((t) => {
      const data = t || [];
      // 归一化金额到柱形图
      const maxRev = Math.max(1, ...data.map((d) => Number(d.revenue) || 0));
      setTrend(data.map((d) => ({ ...d, revenue: Number(d.revenue) || 0, orders: Number(d.orders) || 0, _max: maxRev })));
    }).catch(() => {});
  }, []);

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'paid').length;
  const cookingCount = orders.filter((o) => o.status === 'accepted' || o.status === 'cooking').length;

  const fmt = (n: number) => '¥' + (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const recent = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  const statusMap: Record<string, { label: string; color: string }> = {
    paid:      { label: '待接单', color: 'bg-gold-500/15 text-gold-700 border-gold-500/30' },
    pending:   { label: '待接单', color: 'bg-gold-500/15 text-gold-700 border-gold-500/30' },
    accepted:  { label: '已接单', color: 'bg-water-200/40 text-water-700 border-water-200/50' },
    cooking:   { label: '制作中', color: 'bg-orange-500/10 text-orange-500 border-orange-500/25' },
    ready:     { label: '待出餐', color: 'bg-water-200/40 text-water-700 border-water-200/50' },
    completed: { label: '已完成', color: 'bg-green-500/10 text-green-600 border-green-500/25' },
    cancelled: { label: '已取消', color: 'bg-red-500/10 text-red-500 border-red-500/25' },
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* 顶部标题 */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">DASHBOARD</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">经营总览</h1>
          <p className="text-sm text-muted mt-1">欢迎回来，今日也一起做好每一道菜吧。</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="tag"><Leaf size={11} /> {new Date().toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="今日订单"
          value={String(summary.today_count || todayOrders.length)}
          subline={summary.today_count ? `今日营收 ${fmt(summary.today_revenue)}` : '暂无数据'}
          Icon={ClipboardList}
          accent="gold"
          trend="+12%"
        />
        <StatCard
          label="累计订单"
          value={String(summary.total_count || orders.length)}
          subline={`累计营收 ${fmt(summary.total_revenue)}`}
          Icon={Package}
          accent="water"
        />
        <StatCard
          label="客单价"
          value={fmt(summary.avg_price || 0)}
          subline="基于历史订单"
          Icon={DollarSign}
          accent="porcelain"
        />
        <StatCard
          label="在处理中"
          value={String(pendingCount + cookingCount)}
          subline={`${pendingCount} 待接单 · ${cookingCount} 制作中`}
          Icon={ChefHat}
          accent="warning"
          pulse={pendingCount > 0}
        />
      </div>

      {/* 内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* 订单趋势图表 */}
        <div className="lg:col-span-2 card-porcelain p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs text-muted tracking-widest mb-1">7-DAY TREND</div>
              <h3 className="font-serif text-lg text-ink-500">近 7 日订单与营收</h3>
            </div>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-gold" /> 订单</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-water" /> 营收</span>
            </div>
          </div>

          <div className="h-64 relative">
            {trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted text-sm">暂无数据</div>
            ) : (
              <>
                {/* Y 轴网格 */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="border-t border-gold-500/8" style={{ borderStyle: 'dashed', borderColor: 'rgba(201,169,110,0.15)' }} />
                  ))}
                </div>
                {/* 柱形 */}
                <div className="relative h-full flex items-end gap-2 md:gap-4 px-2">
                  {trend.map((d, i) => {
                    const max = Math.max(...trend.map((x) => x.orders || 0), 1);
                    const h = ((d.orders || 0) / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div className="absolute -top-1 text-[10px] font-semibold text-gold-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.orders}单
                        </div>
                        <div
                          className="w-full rounded-t-2xl bg-gradient-gold shadow-gold transition-all duration-500 group-hover:scale-105"
                          style={{ height: `${Math.max(4, h)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* X 轴标签 */}
                <div className="flex gap-2 md:gap-4 px-2 mt-2">
                  {trend.map((d, i) => {
                    const date = new Date(d.day);
                    const label = `${date.getMonth() + 1}/${date.getDate()}`;
                    return <div key={i} className="flex-1 text-center text-[11px] text-muted">{label}</div>;
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 热销菜品 */}
        <div className="card-porcelain p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs text-muted tracking-widest mb-1">TRENDING</div>
              <h3 className="font-serif text-lg text-ink-500">热销菜品</h3>
            </div>
            <Flame size={18} className="text-gold-700" />
          </div>

          <div className="space-y-3">
            {dishes.slice(0, 5).map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-serif text-sm font-semibold flex-shrink-0 ${
                  i === 0 ? 'bg-gradient-gold text-white shadow-gold' :
                  i === 1 ? 'bg-gradient-porcelain text-gold-700 border border-gold-500/30' :
                  'bg-gold-500/5 text-muted border border-gold-500/10'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-500 font-medium truncate group-hover:text-gold-700 transition-colors">{d.name}</div>
                  <div className="text-[11px] text-muted">{d.active ? '在售' : '已下架'}</div>
                </div>
                <ArrowUpRight size={14} className="text-gold-500/50 group-hover:text-gold-700 transition-colors" />
              </div>
            ))}
            {dishes.length === 0 && (
              <div className="text-sm text-muted text-center py-8">暂无菜品数据</div>
            )}
          </div>
        </div>
      </div>

      {/* 最新订单 */}
      <div className="card-porcelain p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-muted tracking-widest mb-1">LATEST</div>
            <h3 className="font-serif text-lg text-ink-500">最新订单</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>订单号</th>
                <th>顾客</th>
                <th>金额</th>
                <th>状态</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted">暂无订单</td></tr>
              ) : recent.map((o) => (
                <tr key={o.id}>
                  <td className="font-serif font-semibold text-ink-500">#{o.order_no}</td>
                  <td>{o.customer_name || '散客'}</td>
                  <td className="text-gold-gradient font-serif font-semibold">{fmt(o.total)}</td>
                  <td>
                    <span className={`tag ${statusMap[o.status]?.color || ''}`}>
                      {statusMap[o.status]?.label || o.status}
                    </span>
                  </td>
                  <td className="text-muted text-xs">
                    {new Date(o.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 快捷统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <QuickStat label="菜品数量" value={dishes.length} unit="道" Icon={ChefHat} />
        <QuickStat label="分类数量" value={cats.length} unit="个" Icon={Package} />
        <QuickStat label="今日订单" value={todayOrders.length} unit="单" Icon={ClipboardList} />
        <QuickStat label="总订单数" value={orders.length} unit="单" Icon={TrendingUp} />
      </div>
    </div>
  );
}

function StatCard({ label, value, subline, Icon, accent, trend, pulse }: {
  label: string; value: string; subline: string; Icon: any;
  accent: 'gold' | 'water' | 'porcelain' | 'warning'; trend?: string; pulse?: boolean;
}) {
  const accentMap = {
    gold: { bg: 'bg-gradient-gold', soft: 'bg-gold-500/10', text: 'text-gold-700' },
    water: { bg: 'bg-gradient-water', soft: 'bg-water-200/40', text: 'text-water-700' },
    porcelain: { bg: 'bg-gradient-porcelain border border-gold-500/20', soft: 'bg-gold-500/10', text: 'text-gold-700' },
    warning: { bg: 'bg-gradient-gold', soft: 'bg-orange-500/10', text: 'text-orange-500' },
  }[accent];

  return (
    <div className="card-porcelain p-5 group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-gold ${accentMap.bg} text-white`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-500/10 rounded-full px-2 py-0.5">
            <ArrowUpRight size={12} /> {trend}
          </span>
        )}
        {pulse && <div className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse shadow-gold" />}
      </div>
      <div className="text-2xl md:text-3xl font-serif font-semibold text-ink-500 mb-1">{value}</div>
      <div className="text-xs text-muted font-medium mb-2">{label}</div>
      <div className="text-[11px] text-muted/80 leading-relaxed">{subline}</div>
    </div>
  );
}

function QuickStat({ label, value, unit, Icon }: { label: string; value: number; unit: string; Icon: any }) {
  return (
    <div className="card-glass p-5 text-center group hover:-translate-y-0.5 transition-transform duration-300">
      <Icon size={22} className="text-gold-700 mx-auto mb-2" strokeWidth={1.8} />
      <div className="font-serif text-2xl font-semibold text-ink-500">
        {value}<span className="text-sm text-muted font-normal ml-1">{unit}</span>
      </div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
