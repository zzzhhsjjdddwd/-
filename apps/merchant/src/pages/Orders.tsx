import { useEffect, useState } from 'react';
import { Search, ChefHat, CheckCircle2, XCircle, Package, ArrowRight, Eye, RefreshCw, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

interface OrderItem { name: string; quantity: number; price: number; spec?: string; remark?: string }
interface Order {
  id: number; order_no: string; status: string; total: number; paid?: number; payment_status?: string;
  order_type: string; table_no: string | null;
  customer_name: string | null; customer_phone: string | null; customer_id?: number;
  address: string | null; remark: string | null;
  created_at: string; items?: OrderItem[];
}

const STATUS_OPTIONS = [
  { key: 'all', label: '全部', Icon: Package, color: 'gold' },
  { key: 'paid', label: '待接单', Icon: Package, color: 'gold' },
  { key: 'accepted', label: '制作中', Icon: ChefHat, color: 'warning' },
  { key: 'cooking', label: '制作中', Icon: ChefHat, color: 'warning' },
  { key: 'ready', label: '待出餐', Icon: Package, color: 'water' },
  { key: 'completed', label: '已完成', Icon: CheckCircle2, color: 'green' },
  { key: 'cancelled', label: '已取消', Icon: XCircle, color: 'red' },
];

const STATUS_COLOR: Record<string, string> = {
  paid: 'bg-gold-500/15 text-gold-700 border-gold-500/30',
  pending: 'bg-gold-500/15 text-gold-700 border-gold-500/30',
  accepted: 'bg-water-200/40 text-water-700 border-water-200/50',
  cooking: 'bg-orange-500/10 text-orange-500 border-orange-500/25',
  ready: 'bg-water-200/40 text-water-700 border-water-200/50',
  completed: 'bg-green-500/10 text-green-600 border-green-500/25',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/25',
};

const STATUS_LABEL: Record<string, string> = {
  paid: '待接单', pending: '待接单', accepted: '已接单',
  cooking: '制作中', ready: '待出餐', completed: '已完成', cancelled: '已取消',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const toast = useToast();

  const load = () => {
    api.get<Order[]>('/orders').then((list) => setOrders(list || [])).catch(() => setOrders([]));
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    if (filter !== 'all') {
      if (filter === 'accepted' || filter === 'cooking') {
        if (o.status !== 'accepted' && o.status !== 'cooking') return false;
      } else if (o.status !== filter) return false;
    }
    if (query) {
      const q = query.toLowerCase();
      return String(o.order_no).toLowerCase().includes(q)
        || String(o.customer_name || '').toLowerCase().includes(q)
        || String(o.customer_phone || '').includes(q);
    }
    return true;
  });

  const updateStatus = (id: number, status: string) => {
    api.patch<any>(`/orders/${id}/status`, { status }).then(() => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      if (selected && selected.id === id) setSelected({ ...selected, status });
      toast.push(`订单状态已更新为「${STATUS_LABEL[status] || status}」`);
    }).catch((e: Error) => toast.push(e.message || '更新失败', 'error'));
  };

  const openReceipt = async (order: Order) => {
    try {
      const data = await api.get<Order>(`/orders/${order.id}/receipt`);
      setReceipt(data || order);
    } catch {
      setReceipt(order);
    }
  };

  const fmt = (n: number) => '¥' + (n || 0).toFixed(2);
  const countBy = (status: string) => {
    if (status === 'accepted' || status === 'cooking') {
      return orders.filter((o) => o.status === 'accepted' || o.status === 'cooking').length;
    }
    return orders.filter((o) => o.status === status).length;
  };

  const orderTypeLabel = (o: Order) =>
    o.order_type === 'delivery' ? '配送' : o.order_type === 'takeaway' ? '自取' : '堂食';

  const paymentBadge = (o: Order) => {
    if (o.status !== 'pending') {
      return <span className="tag bg-green-500/10 text-green-600 border-green-500/25">已支付</span>;
    }
    return <span className="tag bg-orange-500/10 text-orange-500 border-orange-500/25">待支付</span>;
  };

  const actionButtons = (o: Order) => {
    const base = '!py-1.5 !px-3 text-xs flex items-center gap-1.5';
    if (o.status === 'paid' || o.status === 'pending') {
      return (
        <button onClick={() => updateStatus(o.id, 'accepted')} className={`btn-gold ${base}`}>
          <CheckCircle2 size={12} /> 接单
        </button>
      );
    }
    if (o.status === 'accepted') {
      return (
        <button onClick={() => updateStatus(o.id, 'cooking')} className={`btn-water ${base}`}>
          <ChefHat size={12} /> 开始制作
        </button>
      );
    }
    if (o.status === 'cooking') {
      return (
        <button onClick={() => updateStatus(o.id, 'ready')} className={`btn-water ${base}`}>
          <ArrowRight size={12} /> 待出餐
        </button>
      );
    }
    if (o.status === 'ready') {
      return (
        <button onClick={() => updateStatus(o.id, 'completed')} className={`btn-gold ${base}`}>
          <CheckCircle2 size={12} /> 完成订单
        </button>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">ORDERS</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">订单管理</h1>
          <p className="text-sm text-muted mt-1">实时同步所有订单状态 · 共 <span className="text-gold-700 font-semibold">{orders.length}</span> 单</p>
        </div>
        <button onClick={load} className="btn-porcelain flex items-center gap-2 !py-2.5 !px-5 text-sm">
          <RefreshCw size={15} /> 刷新
        </button>
      </div>

      {/* 状态快速筛选 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {STATUS_OPTIONS.map((s) => {
          const count = s.key === 'all' ? orders.length : countBy(s.key);
          const active = filter === s.key;
          const Icon = s.Icon;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`card-glass p-4 text-left transition-all duration-300 ${active ? 'ring-2 ring-gold-500/40 -translate-y-0.5' : 'hover:-translate-y-0.5'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? 'bg-gradient-gold text-white shadow-gold' : 'bg-gold-500/10 text-gold-700'}`}>
                  <Icon size={15} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-muted">ORDER</span>
              </div>
              <div className="text-2xl font-serif font-semibold text-ink-500">{count}</div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* 搜索 */}
      <div className="card-glass p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索订单号 / 姓名 / 电话..."
            className="input-gold"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
        <div className="text-sm text-muted whitespace-nowrap">筛选结果：<span className="text-gold-700 font-semibold">{filtered.length}</span> 单</div>
      </div>

      {/* 订单表格 */}
      <div className="card-porcelain overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>订单号</th>
                <th>顾客</th>
                <th>类型</th>
                <th>金额</th>
                <th>状态</th>
                <th>支付</th>
                <th>时间</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted">暂无匹配的订单</td></tr>
              ) : filtered.map((o) => (
                <div key={o.id} style={{ display: 'contents' }}>
                  <tr className="cursor-pointer transition-colors" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-semibold text-ink-500">#{o.order_no}</span>
                        {expanded === o.id ? <ChevronUp size={14} className="text-gold-600" /> : <ChevronDown size={14} className="text-muted" />}
                      </div>
                    </td>
                    <td>
                      <div className="text-ink-500">{o.customer_name || '散客'}</div>
                      {o.customer_phone && <div className="text-xs text-muted">{o.customer_phone}</div>}
                    </td>
                    <td>
                      <span className="tag">{orderTypeLabel(o)}</span>
                    </td>
                    <td>
                      <span className="text-gold-gradient font-serif text-base font-semibold">{fmt(o.total)}</span>
                    </td>
                    <td>
                      <span className={`tag ${STATUS_COLOR[o.status] || ''}`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                    <td>{paymentBadge(o)}</td>
                    <td className="text-xs text-muted">
                      {new Date(o.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        {actionButtons(o)}
                        <button onClick={() => setSelected(o)} className="btn-porcelain !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                          <Eye size={12} /> 详情
                        </button>
                        <button onClick={() => openReceipt(o)} className="btn-porcelain !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                          <Printer size={12} /> 小票
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr key={`${o.id}-exp`} className="bg-gold-500/4 border-t-0">
                      <td colSpan={8} className="!py-0">
                        <div className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-sm">
                            <InfoRow label="订单类型" value={orderTypeLabel(o) + (o.table_no ? ` · ${o.table_no}` : '')} />
                            <InfoRow label="订单金额" value={<span className="text-gold-gradient font-serif text-lg font-semibold">{fmt(o.total)}</span>} />
                            <InfoRow label="顾客姓名" value={o.customer_name || '—'} />
                            <InfoRow label="联系电话" value={o.customer_phone || '—'} />
                            {o.address && <InfoRow label="配送地址" value={o.address} span={2} />}
                            {o.remark && <InfoRow label="顾客备注" value={<span className="text-gold-700">{o.remark}</span>} span={3} />}
                          </div>
                          {(o.items || []).length > 0 && (
                            <div>
                              <div className="text-xs text-muted tracking-widest mb-3">ITEMS · 菜品明细</div>
                              <div className="bg-white rounded-2xl border border-gold-500/10 overflow-hidden">
                                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gold-500/6 text-[11px] text-muted tracking-wider">
                                  <div className="col-span-6">菜品</div>
                                  <div className="col-span-2 text-center">规格</div>
                                  <div className="col-span-1 text-center">数量</div>
                                  <div className="col-span-3 text-right">小计</div>
                                </div>
                                {o.items!.map((it, i) => (
                                  <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-gold-500/8 text-sm items-center">
                                    <div className="col-span-6 text-ink-500 font-medium">{it.name}</div>
                                    <div className="col-span-2 text-center text-xs text-muted">{it.spec || '—'}</div>
                                    <div className="col-span-1 text-center font-serif">×{it.quantity}</div>
                                    <div className="col-span-3 text-right text-gold-700 font-serif font-semibold">{fmt(it.price * it.quantity)}</div>
                                  </div>
                                ))}
                                <div className="grid grid-cols-12 gap-2 px-4 py-3 border-t-2 border-gold-500/20 bg-gradient-porcelain">
                                  <div className="col-span-9 text-right text-sm text-muted">合计</div>
                                  <div className="col-span-3 text-right text-gold-gradient font-serif text-lg font-semibold">{fmt(o.total)}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </div>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-ink-500/30 backdrop-blur-sm flex items-center justify-center p-4 animate-scale-in" onClick={() => setSelected(null)}>
          <div className="card-porcelain w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gold-500/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-ink-500 mb-1">#{selected.order_no}</h3>
                  <p className="text-xs text-muted">{new Date(selected.created_at).toLocaleString('zh-CN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {paymentBadge(selected)}
                  <span className={`tag ${STATUS_COLOR[selected.status] || ''}`}>
                    {STATUS_LABEL[selected.status] || selected.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow label="用餐方式" value={orderTypeLabel(selected) + (selected.table_no ? ` · ${selected.table_no}` : '')} />
                <InfoRow label="订单金额" value={<span className="text-gold-gradient font-serif text-lg font-semibold">{fmt(selected.total)}</span>} />
                <InfoRow label="顾客姓名" value={selected.customer_name || '—'} />
                <InfoRow label="联系电话" value={selected.customer_phone || '—'} />
                {selected.address && <InfoRow label="配送地址" value={selected.address} span={2} />}
              </div>

              {(selected.items || []).length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-ink-500 mb-3">菜品明细</div>
                  <div className="space-y-2">
                    {selected.items!.map((it, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gold-500/5 rounded-2xl text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-ink-500 font-medium">{it.name}</span>
                          {it.spec && <span className="text-[11px] text-gold-700 bg-gold-500/10 rounded-full px-2 py-0.5">{it.spec}</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted">×{it.quantity}</span>
                          <span className="text-gold-700 font-serif font-semibold">{fmt(it.price * it.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.remark && (
                <div>
                  <div className="text-sm font-semibold text-ink-500 mb-2">顾客备注</div>
                  <div className="bg-gold-500/5 rounded-2xl p-4 text-sm text-ink-500 border-l-2 border-gold-500/40">{selected.remark}</div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gold-500/10 flex justify-end gap-2">
              <button onClick={() => { setSelected(null); openReceipt(selected); }} className="btn-porcelain !py-2.5 !px-5 text-sm flex items-center gap-1.5">
                <Printer size={14} /> 打印小票
              </button>
              <button onClick={() => setSelected(null)} className="btn-gold !py-2.5 !px-5 text-sm">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 小票弹窗 */}
      {receipt && (
        <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

function InfoRow({ label, value, span }: { label: string; value: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : span === 3 ? 'md:col-span-3' : ''}>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-ink-500 font-medium">{value}</div>
    </div>
  );
}

function ReceiptModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const shop = (() => {
    try {
      const raw = localStorage.getItem('yunqi-shop');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { name: '云栖浅食', phone: '', address: '' };
  })();
  const template = (() => {
    try {
      const raw = localStorage.getItem('yunqi-receipt');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { header: '感谢您的惠顾！', footer: '欢迎再次光临', showLogo: true };
  })();

  const fmt = (n: number) => '¥' + (n || 0).toFixed(2);
  const items = order.items || [];
  const totalQty = items.reduce((s, it) => s + it.quantity, 0);

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>小票 #${order.order_no}</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 80mm; padding: 4mm; margin: 0; font-size: 12px; color: #000; }
        h1 { text-align: center; font-size: 16px; margin: 0 0 4px; font-weight: 700; }
        .center { text-align: center; } .right { text-align: right; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; font-size: 12px; }
        .row { display: flex; justify-content: space-between; }
        .total { font-size: 14px; font-weight: 700; }
      </style></head><body>
      ${template.showLogo ? `<h1>${shop.name || '云栖浅食'}</h1>` : ''}
      <div class="center">${template.header || ''}</div>
      <div class="line"></div>
      <div class="row"><span>订单号:</span><span>#${order.order_no}</span></div>
      <div class="row"><span>时间:</span><span>${new Date(order.created_at).toLocaleString('zh-CN')}</span></div>
      <div class="row"><span>顾客:</span><span>${order.customer_name || '散客'}</span></div>
      ${order.customer_phone ? `<div class="row"><span>电话:</span><span>${order.customer_phone}</span></div>` : ''}
      ${order.address ? `<div>地址: ${order.address}</div>` : ''}
      <div class="line"></div>
      <table>
        ${items.map((it) => `
          <tr>
            <td style="width:55%">${it.name}${it.spec ? ' (' + it.spec + ')' : ''}</td>
            <td style="width:15%;text-align:center">×${it.quantity}</td>
            <td style="width:30%;text-align:right">${fmt(it.price * it.quantity)}</td>
          </tr>
        `).join('')}
      </table>
      <div class="line"></div>
      <div class="row"><span>件数:</span><span>${totalQty}</span></div>
      <div class="row total"><span>合计</span><span>${fmt(order.total)}</span></div>
      <div class="line"></div>
      ${order.remark ? `<div>备注: ${order.remark}</div>` : ''}
      <div class="center">${template.footer || ''}</div>
      ${shop.phone ? `<div class="center">电话: ${shop.phone}</div>` : ''}
      ${shop.address ? `<div class="center">${shop.address}</div>` : ''}
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-500/30 backdrop-blur-sm flex items-center justify-center p-4 animate-scale-in" onClick={onClose}>
      <div className="animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-gold !py-2 !px-5 text-sm flex items-center gap-1.5">
              <Printer size={14} /> 打印
            </button>
            <button onClick={onClose} className="btn-porcelain !py-2 !px-5 text-sm">关闭</button>
          </div>
        </div>
        <div className="bg-white shadow-glow rounded-2xl p-5 mx-auto" style={{ width: '320px', fontFamily: "'Courier New', monospace", fontSize: '13px', color: '#2B3A45' }}>
          {template.showLogo && (
            <div className="text-center mb-2">
              <div className="font-serif text-lg font-bold text-ink-500">{shop.name || '云栖浅食'}</div>
            </div>
          )}
          <div className="text-center text-xs mb-1">{template.header || '感谢您的惠顾！'}</div>
          <div className="divider-gold my-2" />
          <div className="flex justify-between text-xs mb-1"><span>订单号</span><span className="font-serif">#{order.order_no}</span></div>
          <div className="flex justify-between text-xs mb-1"><span>时间</span><span>{new Date(order.created_at).toLocaleString('zh-CN')}</span></div>
          <div className="flex justify-between text-xs mb-1"><span>顾客</span><span>{order.customer_name || '散客'}</span></div>
          {order.customer_phone && <div className="flex justify-between text-xs mb-1"><span>电话</span><span>{order.customer_phone}</span></div>}
          {order.address && <div className="text-xs mb-1">地址: {order.address}</div>}
          <div className="divider-gold my-2" />
          {items.map((it, i) => (
            <div key={i} className="mb-1">
              <div className="flex justify-between text-xs">
                <span style={{ maxWidth: '60%' }}>{it.name}{it.spec && ` (${it.spec})`}</span>
                <span className="font-serif">{fmt(it.price * it.quantity)}</span>
              </div>
              <div className="text-xs text-muted pl-2">×{it.quantity} · {fmt(it.price)}/份</div>
            </div>
          ))}
          <div className="divider-gold my-2" />
          <div className="flex justify-between text-xs mb-1"><span>件数</span><span>{totalQty}</span></div>
          <div className="flex justify-between font-bold text-sm">
            <span>合计</span>
            <span className="font-serif">{fmt(order.total)}</span>
          </div>
          <div className="divider-gold my-2" />
          {order.remark && <div className="text-xs mb-2">备注: {order.remark}</div>}
          <div className="text-center text-xs">{template.footer || '欢迎再次光临'}</div>
          {shop.phone && <div className="text-center text-xs mt-1 text-muted">电话: {shop.phone}</div>}
          {shop.address && <div className="text-center text-xs text-muted">{shop.address}</div>}
        </div>
      </div>
    </div>
  );
}
