import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, ChefHat, Flame, CheckCircle2, User, Phone, MessageSquare, Clock, Printer, XCircle, Check } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.js';

interface OrderItem { name: string; quantity: number; price: number; spec?: string }
interface Order {
  id: number;
  order_no: string;
  status: string;
  total: number;
  order_type: string;
  table_no: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  remark: string | null;
  created_at: string;
  items?: OrderItem[];
  paid?: boolean;
  payment_method?: string;
}

interface ReceiptData {
  order_no?: string;
  created_at?: string;
  items?: OrderItem[];
  total?: number;
  payment_method?: string;
  customer_name?: string | null;
}

const STEPS = [
  { key: 'paid', label: '已下单', Icon: Package },
  { key: 'accepted', label: '已接单', Icon: ChefHat },
  { key: 'cooking', label: '制作中', Icon: Flame },
  { key: 'ready', label: '待出餐', Icon: Package },
  { key: 'completed', label: '已完成', Icon: CheckCircle2 },
];

const STATUS_ORDER: Record<string, number> = {
  paid: 0, pending: 0, accepted: 1, cooking: 2, ready: 3, completed: 4, cancelled: -1,
};

const PAYMENT_LABEL: Record<string, string> = {
  wechat: '微信支付', alipay: '支付宝', cash: '现金', balance: '会员余额',
};

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const refresh = () => {
    api.get<Order>(`/orders/${id}`).then((data) => setOrder(data));
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
  }, [id]);

  const openReceipt = async () => {
    setShowReceipt(true);
    if (receipt) return;
    setReceiptLoading(true);
    try {
      const data = await api.get<ReceiptData>(`/orders/${id}/receipt`);
      setReceipt(data);
    } catch (e: any) {
      toast.push(e.message || '获取小票失败', 'error');
      if (order) {
        setReceipt({
          order_no: order.order_no,
          created_at: order.created_at,
          items: order.items,
          total: order.total,
          payment_method: order.payment_method,
          customer_name: order.customer_name,
        });
      }
    } finally {
      setReceiptLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 animate-fade-up">
        <div className="card-porcelain py-16 text-center text-muted">加载中...</div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[order.status] ?? 0;
  const fmtTime = (s: string) => {
    if (!s) return '';
    const d = new Date(s);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const typeLabel =
    order.order_type === 'delivery' ? '配送' :
    order.order_type === 'takeaway' ? '自取' :
    `堂食 · ${order.table_no || '—'}`;

  const r = receipt || {
    order_no: order.order_no,
    created_at: order.created_at,
    items: order.items,
    total: order.total,
    payment_method: order.payment_method,
    customer_name: order.customer_name,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-12 animate-fade-up">
      <section className="mt-6 md:mt-10 mb-6">
        <button onClick={() => nav('/orders')} className="text-sm text-muted flex items-center gap-1 mb-3 hover:text-ink-500 transition-colors">
          <ArrowLeft size={14} /> 返回订单
        </button>
        <div className="text-xs text-muted tracking-[0.3em] mb-1">ORDER DETAIL</div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink-500">#{order.order_no}</h1>
      </section>

      {/* 状态指示 */}
      <section className="card-porcelain p-6 md:p-7 mb-5">
        <div className="relative">
          <div className="absolute top-6 left-[5%] right-[5%] h-0.5 bg-gold-500/15" />
          <div
            className="absolute top-6 left-[5%] h-0.5 bg-gradient-gold transition-all duration-500"
            style={{ width: `calc((${Math.max(0, currentIdx)} / ${STEPS.length - 1}) * 90%)` }}
          />
          <div className="relative grid grid-cols-5 gap-0">
            {STEPS.map((step, i) => {
              const active = i <= currentIdx && currentIdx !== -1;
              const Icon = step.Icon;
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      active
                        ? 'bg-gradient-gold text-white border-gold-500 shadow-gold'
                        : currentIdx === -1 && i === 0
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-muted border-gold-500/20'
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <span className={`mt-2 text-[10px] md:text-xs font-medium text-center ${active ? 'text-gold-700' : 'text-muted'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 支付状态 */}
      <section className="card-porcelain p-5 md:p-6 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
              {order.status !== 'pending' ? <Check size={16} className="text-green-600" /> : <Clock size={16} className="text-gold-700" />}
            </div>
            <div>
              <div className="text-sm text-ink-500 font-medium">
                {order.status !== 'pending' ? '已支付' : '待支付'}
              </div>
              <div className="text-[11px] text-muted">
                支付方式：{PAYMENT_LABEL[order.payment_method || ''] || '微信支付'}
              </div>
            </div>
          </div>
          <span className="text-gold-gradient font-serif text-xl md:text-2xl font-semibold">
            ¥{Number(order.total).toFixed(2)}
          </span>
        </div>

        {order.status === 'pending' && (
          <div className="mt-4 pt-4 border-t border-gold-500/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-muted">订单尚未完成支付</div>
            <button
              onClick={() => nav(`/checkout?order_id=${order.id}`)}
              className="btn-gold !py-2.5 !px-5 text-sm flex items-center justify-center gap-1.5">
              立即支付
            </button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gold-500/10 flex items-center justify-between gap-2">
          <div className="text-xs text-muted">需要纸质凭证？</div>
          <button onClick={openReceipt} className="btn-porcelain !py-2 !px-3.5 text-xs flex items-center gap-1.5">
            <Printer size={12} /> 打印小票
          </button>
        </div>
      </section>

      {/* 订单信息 */}
      <section className="card-porcelain p-5 md:p-6 mb-5">
        <div className="text-sm font-semibold text-ink-500 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gradient-gold" /> 订单信息
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5"><Clock size={12} /> 下单时间</span>
            <span className="text-ink-500">{fmtTime(order.created_at)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5"><User size={12} /> 用餐方式</span>
            <span className="text-ink-500">{typeLabel}</span>
          </div>
          {order.customer_name && (
            <div className="flex items-center justify-between">
              <span className="text-muted flex items-center gap-1.5"><User size={12} /> 姓名</span>
              <span className="text-ink-500">{order.customer_name}</span>
            </div>
          )}
          {order.customer_phone && (
            <div className="flex items-center justify-between">
              <span className="text-muted flex items-center gap-1.5"><Phone size={12} /> 手机</span>
              <span className="text-ink-500">{order.customer_phone}</span>
            </div>
          )}
          {order.address && (
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted flex items-center gap-1.5 flex-shrink-0">地址</span>
              <span className="text-ink-500 text-right">{order.address}</span>
            </div>
          )}
          {order.remark && (
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted flex items-center gap-1.5 flex-shrink-0">
                <MessageSquare size={12} /> 备注
              </span>
              <span className="text-ink-500 text-right">{order.remark}</span>
            </div>
          )}
        </div>
      </section>

      {/* 菜品明细 */}
      <section className="card-porcelain p-5 md:p-6 mb-5">
        <div className="text-sm font-semibold text-ink-500 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gradient-gold" /> 菜品明细
        </div>
        <div className="space-y-2.5 mb-4">
          {(order.items || []).map((it, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gold-500/10 last:border-0">
              <div className="flex-1 min-w-0 pr-3">
                <div className="text-sm text-ink-500 font-medium truncate">{it.name}</div>
                {it.spec && <div className="text-[11px] text-gold-700">{it.spec}</div>}
              </div>
              <div className="text-sm text-muted">×{it.quantity}</div>
              <div className="text-sm font-serif text-gold-700 font-semibold w-16 text-right">¥{Number(it.price * it.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="divider-gold mb-3" />
        <div className="flex items-center justify-between">
          <span className="text-ink-500 font-medium">订单总计</span>
          <span className="text-gold-gradient font-serif text-2xl font-semibold">¥{Number(order.total).toFixed(2)}</span>
        </div>
      </section>

      <div className="card-glass p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted mb-0.5">需要帮助？</div>
            <div className="text-sm text-ink-500 font-medium">云栖浅食 · 商家在线</div>
          </div>
          <button onClick={() => nav('/')} className="btn-porcelain py-2.5 px-5 text-sm">继续点餐</button>
        </div>
      </div>

      {/* 小票弹窗 */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up" onClick={() => setShowReceipt(false)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* 80mm 窄幅小票样式 */}
            <div className="bg-white rounded-t-sm shadow-xl mx-auto" style={{ maxWidth: '320px' }}>
              <div className="p-5 pt-6 text-center" style={{ fontFamily: 'monospace' }}>
                <div className="text-base font-bold text-ink-500 mb-1 tracking-widest">云栖浅食</div>
                <div className="text-[10px] text-muted mb-1">YUN QI LIGHT MEAL</div>
                <div className="text-[10px] text-muted mb-3">小票编号：{r.order_no || order.order_no}</div>

                <div className="border-t border-dashed border-gold-500/30 my-3" />

                <div className="text-left text-[11px] text-ink-500 space-y-0.5 mb-3">
                  <div>时间：{fmtTime(r.created_at || order.created_at)}</div>
                  {r.customer_name && <div>顾客：{r.customer_name}</div>}
                  <div>方式：{typeLabel}</div>
                </div>

                <div className="border-t border-dashed border-gold-500/30 my-3" />

                {/* 菜单项 */}
                <div className="text-left text-[11px] text-ink-500">
                  <div className="flex justify-between pb-1 font-bold border-b border-dashed border-gold-500/30 mb-2">
                    <span>菜品</span>
                    <span>数量</span>
                    <span>小计</span>
                  </div>
                  {(r.items || order.items || []).map((it, i) => (
                    <div key={i} className="mb-1.5">
                      <div className="flex justify-between">
                        <span className="flex-1 pr-1">{it.name}</span>
                        <span className="w-10 text-right">×{it.quantity}</span>
                        <span className="w-14 text-right">¥{Number(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                      {it.spec && <div className="text-[9px] text-muted ml-0.5">备注：{it.spec}</div>}
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gold-500/30 my-3" />

                <div className="text-right text-[11px] text-ink-500 mb-2">
                  <div>支付方式：{PAYMENT_LABEL[r.payment_method || order.payment_method || ''] || '微信支付'}</div>
                </div>

                <div className="flex items-center justify-between text-ink-500 font-bold py-2 border-t border-dashed border-gold-500/30">
                  <span className="text-xs">合计</span>
                  <span className="text-lg">¥{Number(r.total || order.total).toFixed(2)}</span>
                </div>

                <div className="border-t border-dashed border-gold-500/30 my-3" />

                <div className="text-[10px] text-muted leading-relaxed pt-1">
                  感谢惠顾 · 欢迎再次光临<br />
                  {`${new Date().toLocaleString('zh-CN')}`}
                </div>

                {/* 条码模拟 */}
                <div className="mt-4 flex justify-center items-end gap-[2px] h-8">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="bg-ink-500" style={{ width: (i % 3 === 0 ? 2 : 1) + 'px', height: (18 + ((i * 7) % 14)) + 'px' }} />
                  ))}
                </div>
                <div className="text-[9px] text-muted mt-1 tracking-widest">{order.order_no}</div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button onClick={() => setShowReceipt(false)} className="btn-gold !py-2.5 !px-5 text-sm">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
