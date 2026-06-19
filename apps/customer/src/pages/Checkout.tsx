import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, User, MessageSquare, MapPin, CreditCard, Wallet, Landmark, Smartphone, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useCart } from '../stores/cart.js';
import { useUser } from '../stores/user.js';
import { useToast } from '../components/Toast.js';

type OrderType = 'dine' | 'takeaway' | 'delivery';
type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'balance';

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  is_default?: boolean;
}

const typeOptions = [
  { key: 'dine' as const, label: '堂食', desc: '店内用餐' },
  { key: 'takeaway' as const, label: '自取', desc: '到店取餐' },
  { key: 'delivery' as const, label: '配送', desc: '送货上门' },
];

const paymentOptions: { key: PaymentMethod; label: string; desc: string; Icon: any }[] = [
  { key: 'wechat', label: '微信支付', desc: 'WeChat Pay', Icon: Wallet },
  { key: 'alipay', label: '支付宝', desc: 'Alipay', Icon: Smartphone },
  { key: 'cash', label: '现金', desc: 'Cash', Icon: Landmark },
  { key: 'balance', label: '会员余额', desc: 'Balance', Icon: CreditCard },
];

export default function Checkout() {
  const nav = useNavigate();
  const cart = useCart();
  const userStore = useUser();
  const toast = useToast();

  const [orderType, setOrderType] = useState<OrderType>('dine');
  const [tableNo, setTableNo] = useState('');
  const [customerName, setCustomerName] = useState((userStore.user?.name as string) || localStorage.getItem('customerName') || '');
  const [phone, setPhone] = useState((userStore.user?.phone as string) || localStorage.getItem('customerPhone') || '');
  const [address, setAddress] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [remark, setRemark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ id: number; order_no: string; total: number; paid: boolean } | null>(null);

  const isLoggedIn = !!userStore.user || !!userStore.token;

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoadingAddresses(true);
    api.get<Address[]>('/addresses')
      .then((list) => {
        setAddresses(list || []);
        const def = list?.find((a) => a.is_default) || list?.[0];
        if (def) {
          setSelectedAddressId(def.id);
          setAddress(`${def.name} ${def.phone} · ${def.address}`);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [isLoggedIn]);

  const submit = async () => {
    if (!customerName || !phone) {
      toast.push('请填写姓名与手机号', 'error');
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      toast.push('请输入正确的手机号', 'error');
      return;
    }
    if (orderType === 'dine' && !tableNo) {
      toast.push('请填写桌号', 'error');
      return;
    }
    if (orderType === 'delivery' && !address) {
      toast.push('请填写配送地址', 'error');
      return;
    }

    localStorage.setItem('customerName', customerName);
    localStorage.setItem('customerPhone', phone);

    setLoading(true);
    try {
      const items = cart.items.map((it) => ({
        dish_id: it.dish.id,
        name: it.dish.name,
        price: it.dish.price,
        quantity: it.quantity,
        spec: it.spec || '',
      }));

      const data: any = await api.post('/orders', {
        customer_id: userStore.user?.id || null,
        table_no: tableNo || null,
        order_type: orderType,
        items,
        payment_method: paymentMethod,
        address: orderType === 'delivery' ? address : null,
        remark: remark || null,
        customer_name: customerName,
        customer_phone: phone,
        total: cart.totalPrice,
      });

      setSuccess({ id: data?.id, order_no: data?.order_no, total: cart.totalPrice, paid: false });
      cart.clear();
    } catch (err: any) {
      toast.push(err?.message || '下单失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    if (!success) return;
    setPaying(true);
    try {
      const prepay: any = await api.post('/payments/prepay', {
        order_id: success.id,
        method: paymentMethod,
      });
      await api.post(`/payments/${prepay.payment_id}/notify`, {});
      setSuccess({ ...success, paid: true });
      toast.push('支付成功');
    } catch (e: any) {
      toast.push(e.message || '支付失败', 'error');
    } finally {
      setPaying(false);
    }
  };

  const onAddressSelect = (id: number | null) => {
    setSelectedAddressId(id);
    if (id) {
      const a = addresses.find((x) => x.id === id);
      if (a) setAddress(`${a.name} ${a.phone} · ${a.address}`);
    }
  };

  if (success !== null) {
    const pmLabel = paymentOptions.find((p) => p.key === paymentMethod)?.label || '微信支付';
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 animate-fade-up">
        <div className="card-porcelain p-8 md:p-12 text-center">
          <div className={`w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold animate-scale-in ${paying ? 'opacity-60' : ''}`}>
            {paying ? <Loader2 size={36} className="text-white animate-spin" /> : <CheckCircle2 size={38} className="text-white" strokeWidth={1.5} />}
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-ink-500 mb-2">
            {success.paid ? '支付成功' : '下单成功'}
          </h2>
          <p className="text-sm text-muted mb-8">
            {success.paid
              ? `订单号 #${success.order_no} · 厨师正在为您精心准备`
              : `订单号 #${success.order_no} · 等待您完成支付`}
          </p>

          <div className="card-glass p-5 mb-8 text-left">
            <div className="text-xs text-muted tracking-widest mb-2">ORDER</div>
            <div className="font-serif text-gold-700 mb-4">{success.order_no}</div>
            <div className="flex items-center justify-between border-t border-gold-500/15 pt-3">
              <span className="text-sm text-muted">支付方式</span>
              <span className="text-sm text-ink-500">{pmLabel}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted">应付金额</span>
              <span className="text-gold-gradient font-serif text-2xl font-semibold">¥{Number(success.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!success.paid ? (
              <button onClick={pay} disabled={paying} className="btn-gold py-3 flex-1 disabled:opacity-60">
                {paying ? '支付中...' : `立即支付 ¥${Number(success.total).toFixed(2)}`}
              </button>
            ) : (
              <button onClick={() => nav(`/orders/${success.id}`)} className="btn-gold py-3 flex-1">
                查看订单
              </button>
            )}
            {success.paid ? (
              <button onClick={() => nav('/')} className="btn-porcelain py-3 flex-1">
                继续点餐
              </button>
            ) : (
              <button onClick={() => nav(`/orders/${success.id}`)} className="btn-porcelain py-3 flex-1">
                查看订单
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-40 animate-fade-up">
      <section className="mt-6 md:mt-10 mb-6">
        <button onClick={() => nav(-1)} className="text-sm text-muted flex items-center gap-1 mb-3 hover:text-ink-500 transition-colors">
          <ArrowLeft size={14} /> 返回购物车
        </button>
        <div className="text-xs text-muted tracking-[0.3em] mb-1">CHECKOUT</div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink-500">确认订单</h1>
      </section>

      {/* 用餐方式 */}
      <section className="mb-5">
        <div className="text-sm font-semibold text-ink-500 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gradient-gold" /> 用餐方式
        </div>
        <div className="grid grid-cols-3 gap-3">
          {typeOptions.map((opt) => {
            const active = orderType === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setOrderType(opt.key)}
                className={`card-glass p-4 text-center transition-all duration-300 ${
                  active ? 'ring-2 ring-gold-500/40 shadow-gold -translate-y-0.5' : ''
                }`}
              >
                <div className={`text-sm md:text-base font-semibold mb-0.5 ${active ? 'text-gold-gradient' : 'text-ink-500'}`}>
                  {opt.label}
                </div>
                <div className="text-[10px] text-muted">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 联系信息 */}
      <section className="card-porcelain p-5 md:p-6 mb-5">
        <div className="text-sm font-semibold text-ink-500 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gradient-gold" /> 联系信息
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted mb-1.5 block flex items-center gap-1">
              <User size={11} /> 姓名
            </label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-gold"
              placeholder="请输入您的姓名"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">手机号</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="input-gold"
              placeholder="11 位手机号"
              maxLength={11}
            />
          </div>
        </div>
      </section>

      {orderType === 'dine' && (
        <section className="card-porcelain p-5 md:p-6 mb-5">
          <label className="text-xs text-muted mb-1.5 block">桌号</label>
          <input value={tableNo} onChange={(e) => setTableNo(e.target.value)} className="input-gold" placeholder="如：A8 / 12" />
        </section>
      )}

      {orderType === 'delivery' && (
        <section className="card-porcelain p-5 md:p-6 mb-5">
          <div className="text-sm font-semibold text-ink-500 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-gold" /> 配送地址
          </div>
          {isLoggedIn && addresses.length > 0 ? (
            <div className="space-y-2 mb-3">
              {loadingAddresses && <div className="text-xs text-muted">加载中...</div>}
              {addresses.map((a) => {
                const active = selectedAddressId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => onAddressSelect(a.id)}
                    className={`w-full text-left card-glass p-3.5 transition-all ${
                      active ? 'ring-2 ring-gold-500/40 shadow-gold' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-sm font-medium text-ink-500">
                        {a.name} · {a.phone}
                        {a.is_default && <span className="ml-2 text-[10px] text-gold-700 bg-gold-500/10 border border-gold-500/25 rounded-full px-2 py-0.5">默认</span>}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted leading-relaxed">{a.address}</div>
                  </button>
                );
              })}
            </div>
          ) : isLoggedIn ? (
            <div className="card-glass p-4 mb-3 text-sm text-muted flex items-center justify-between">
              <span>暂无保存的地址</span>
              <button onClick={() => nav('/address')} className="text-gold-700 text-sm underline-offset-2 hover:underline">
                去管理 →
              </button>
            </div>
          ) : (
            <div className="card-glass p-4 mb-3 text-sm text-muted">
              <MapPin size={14} className="inline -mt-0.5 mr-1.5" />
              登录后可选择已保存的地址
            </div>
          )}

          <label className="text-xs text-muted mb-1.5 block">详细地址</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="input-gold"
            placeholder="请输入详细配送地址"
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
        </section>
      )}

      {/* 支付方式 */}
      <section className="card-porcelain p-5 md:p-6 mb-5">
        <div className="text-sm font-semibold text-ink-500 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gradient-gold" /> 支付方式
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {paymentOptions.map((opt) => {
            const active = paymentMethod === opt.key;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.key}
                onClick={() => setPaymentMethod(opt.key)}
                className={`card-glass p-3.5 text-left transition-all duration-300 ${
                  active ? 'ring-2 ring-gold-500/40 shadow-gold -translate-y-0.5' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className={active ? 'text-gold-700' : 'text-muted'} />
                  <span className={`text-sm font-medium ${active ? 'text-gold-gradient' : 'text-ink-500'}`}>{opt.label}</span>
                </div>
                <div className="text-[10px] text-muted">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 备注 */}
      <section className="card-porcelain p-5 md:p-6 mb-5">
        <label className="text-xs text-muted mb-1.5 block flex items-center gap-1">
          <MessageSquare size={11} /> 备注（选填）
        </label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
          className="input-gold"
          placeholder="如：不要辣 / 少油 / 打包"
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
      </section>

      {/* 订单明细 */}
      <section className="card-porcelain p-5 md:p-6 mb-5">
        <div className="text-sm font-semibold text-ink-500 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gradient-gold" /> 订单明细 · {cart.totalCount} 件
        </div>
        <div className="space-y-2.5 mb-4">
          {cart.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between py-1.5 border-b border-gold-500/10 last:border-0">
              <div className="flex-1 min-w-0 pr-3">
                <div className="text-sm text-ink-500 font-medium truncate">{it.dish.name}</div>
                {it.spec && <div className="text-[11px] text-gold-700">{it.spec}</div>}
              </div>
              <div className="text-sm text-muted">×{it.quantity}</div>
              <div className="text-sm font-serif text-gold-700 font-semibold w-16 text-right">¥{(it.dish.price * it.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="divider-gold mb-3" />
        <div className="flex items-center justify-between">
          <span className="text-ink-500 font-medium">订单总计</span>
          <span className="text-gold-gradient font-serif text-2xl font-semibold">¥{cart.totalPrice.toFixed(2)}</span>
        </div>
      </section>

      {/* 底部提交 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 md:px-8 pb-4 md:pb-6 pointer-events-none">
        <div className="card-glass shadow-float p-4 pointer-events-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted">总计 · {paymentOptions.find((p) => p.key === paymentMethod)?.label}</div>
              <div className="text-gold-gradient font-serif text-2xl font-semibold">¥{cart.totalPrice.toFixed(2)}</div>
            </div>
            <button disabled={loading} onClick={submit} className="btn-gold py-3 px-8 text-sm disabled:opacity-60">
              {loading ? '提交中...' : `立即支付 ¥${cart.totalPrice.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
