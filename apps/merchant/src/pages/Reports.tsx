import { useEffect, useState } from 'react';
import { RefreshCw, LineChart, DollarSign, ShoppingCart, TrendingUp, Calendar } from 'lucide-react';
import { api } from '../api/client';

interface Summary {
  total_orders?: number;
  total_revenue?: number;
  avg_price?: number;
  today_orders?: number;
  today_revenue?: number;
  this_month_orders?: number;
  this_month_revenue?: number;
}

interface TrendItem { period?: string; orders?: number; revenue?: number; }

export default function Reports() {
  const [summary, setSummary] = useState<Summary>({});
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [mode, setMode] = useState<'day' | 'month'>('day');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Summary>('/reports/summary').then((s) => setSummary(s || {})).catch(() => {});
    api.get<TrendItem[]>(`/reports/trend?mode=${mode}`).then((t) => {
      const list = t || [];
      // 限制最多显示 12 个柱形以保持美观
      setTrend(list.slice(-12));
    }).catch(() => setTrend([])).finally(() => setLoading(false));
  };

  useEffect(load, [mode]);

  const fmtMoney = (n?: number) => '¥' + (Number(n || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtNum = (n?: number) => String(Number(n || 0));

  const maxOrders = Math.max(1, ...trend.map((x) => Number(x.orders) || 0));
  const maxRevenue = Math.max(1, ...trend.map((x) => Number(x.revenue) || 0));

  const formatPeriod = (p?: string) => {
    if (!p) return '';
    if (mode === 'day') {
      const d = new Date(p);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
    return p;
  };

  const totalRevenue = Number(summary.total_revenue) || 0;
  const totalOrders = Number(summary.total_orders) || 0;
  const avgPrice = Number(summary.avg_price) || (totalOrders ? totalRevenue / totalOrders : 0);
  const todayRevenue = Number(summary.today_revenue) || 0;
  const todayOrders = Number(summary.today_orders) || 0;
  const monthRevenue = Number(summary.this_month_revenue) || 0;
  const monthOrders = Number(summary.this_month_orders) || 0;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">REPORTS</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">经营报表</h1>
          <p className="text-sm text-muted mt-1">实时掌握经营数据 · 洞察营收趋势</p>
        </div>
        <button onClick={load} className="btn-porcelain flex items-center gap-2 !py-2.5 !px-5 text-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> 刷新数据
        </button>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card-porcelain p-5 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold">
              <ShoppingCart size={20} />
            </div>
            <span className="text-[11px] text-muted">累计</span>
          </div>
          <div className="font-serif text-2xl md:text-3xl font-semibold text-ink-500">{fmtNum(totalOrders)}</div>
          <div className="text-xs text-muted mt-1">总订单数</div>
        </div>

        <div className="card-porcelain p-5 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold">
              <DollarSign size={20} />
            </div>
            <span className="text-[11px] text-muted">累计</span>
          </div>
          <div className="text-gold-gradient font-serif text-2xl md:text-3xl font-semibold">{fmtMoney(totalRevenue)}</div>
          <div className="text-xs text-muted mt-1">总营收</div>
        </div>

        <div className="card-porcelain p-5 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-water flex items-center justify-center text-white shadow-soft">
              <TrendingUp size={20} />
            </div>
            <span className="text-[11px] text-muted">平均</span>
          </div>
          <div className="font-serif text-2xl md:text-3xl font-semibold text-water-700">{fmtMoney(avgPrice)}</div>
          <div className="text-xs text-muted mt-1">客单价</div>
        </div>

        <div className="card-porcelain p-5 group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center text-gold-700">
              <LineChart size={20} />
            </div>
            <span className="text-[11px] text-muted">今日</span>
          </div>
          <div className="font-serif text-2xl md:text-3xl font-semibold text-ink-500">{fmtNum(todayOrders)}</div>
          <div className="text-xs text-muted mt-1">今日订单 · <span className="text-gold-700 font-semibold">{fmtMoney(todayRevenue)}</span></div>
        </div>
      </div>

      {/* 趋势图 */}
      <div className="card-porcelain p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-muted tracking-widest mb-1">TREND</div>
            <h3 className="font-serif text-lg text-ink-500">营收与订单趋势</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('day')}
              className={`btn-porcelain !py-2 !px-4 text-xs flex items-center gap-1.5 ${mode === 'day' ? 'ring-2 ring-gold-500/40' : ''}`}
            >
              <Calendar size={12} /> 按日
            </button>
            <button
              onClick={() => setMode('month')}
              className={`btn-porcelain !py-2 !px-4 text-xs flex items-center gap-1.5 ${mode === 'month' ? 'ring-2 ring-gold-500/40' : ''}`}
            >
              <LineChart size={12} /> 按月
            </button>
          </div>
        </div>

        {/* 图例 */}
        <div className="flex flex-wrap gap-4 mb-5 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gradient-gold" /> 订单数</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gradient-water" /> 营收</span>
        </div>

        {trend.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">
            <LineChart size={32} className="mx-auto mb-3 text-gold-500/40" />
            暂无趋势数据
          </div>
        ) : (
          <>
            {/* 订单柱形图 */}
            <div className="mb-8">
              <div className="flex items-end gap-2 md:gap-4 h-48 px-2 mb-2 border-b border-gold-500/10">
                {trend.map((item, i) => {
                  const h = ((Number(item.orders) || 0) / maxOrders) * 100;
                  const isHighest = (Number(item.orders) || 0) === maxOrders && maxOrders > 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative justify-end h-full">
                      <div className="absolute -top-1 text-[10px] font-semibold text-gold-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.orders || 0} 单
                      </div>
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${isHighest ? 'bg-gradient-gold shadow-gold' : 'bg-gradient-gold opacity-60'}`}
                        style={{ height: `${Math.max(6, h)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 md:gap-4 px-2">
                {trend.map((item, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-muted truncate">
                    {formatPeriod(item.period)}
                  </div>
                ))}
              </div>
            </div>

            {/* 营收柱形图 */}
            <div>
              <div className="flex items-end gap-2 md:gap-4 h-48 px-2 mb-2 border-b border-gold-500/10">
                {trend.map((item, i) => {
                  const h = ((Number(item.revenue) || 0) / maxRevenue) * 100;
                  const isHighest = (Number(item.revenue) || 0) === maxRevenue && maxRevenue > 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative justify-end h-full">
                      <div className="absolute -top-1 text-[10px] font-semibold text-water-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ¥{(Number(item.revenue) || 0).toLocaleString()}
                      </div>
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${isHighest ? 'bg-gradient-water shadow-soft' : 'bg-gradient-water opacity-60'}`}
                        style={{ height: `${Math.max(6, h)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 md:gap-4 px-2">
                {trend.map((item, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-muted truncate">
                    {formatPeriod(item.period)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 月度汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-porcelain p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-muted tracking-widest mb-1">MONTH</div>
              <h3 className="font-serif text-lg text-ink-500">本月经营</h3>
            </div>
          </div>
          <div className="text-gold-gradient font-serif text-3xl font-semibold mb-2">{fmtMoney(monthRevenue)}</div>
          <div className="text-sm text-muted">共 <span className="text-gold-700 font-semibold">{fmtNum(monthOrders)}</span> 个订单</div>
        </div>

        <div className="card-porcelain p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-muted tracking-widest mb-1">TODAY</div>
              <h3 className="font-serif text-lg text-ink-500">今日经营</h3>
            </div>
          </div>
          <div className="text-gold-gradient font-serif text-3xl font-semibold mb-2">{fmtMoney(todayRevenue)}</div>
          <div className="text-sm text-muted">共 <span className="text-gold-700 font-semibold">{fmtNum(todayOrders)}</span> 个订单</div>
        </div>
      </div>
    </div>
  );
}
