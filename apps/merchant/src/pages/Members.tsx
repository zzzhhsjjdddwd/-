import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, UserPlus, RefreshCw, X, Phone, CalendarDays, ShoppingBag, Wallet, Award, MapPin, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

interface MemberOrder { id: number; order_no: string; total: number; created_at: string; status: string }
interface Member {
  id: number; name: string; phone: string; level?: string; points?: number;
  address?: string; created_at?: string; order_count?: number; total_spent?: number;
  recent_orders?: MemberOrder[];
}

const LEVEL_OPTIONS = [
  { key: '普通', label: '普通会员', color: 'bg-gold-500/10 text-gold-700 border-gold-500/30' },
  { key: '银卡', label: '银卡会员', color: 'bg-water-200/40 text-water-700 border-water-200/50' },
  { key: '金卡', label: '金卡会员', color: 'bg-gold-500/15 text-gold-700 border-gold-500/40' },
  { key: '钻石', label: '钻石会员', color: 'bg-gradient-gold text-white shadow-gold' },
];

const LEVEL_COLORS: Record<string, string> = LEVEL_OPTIONS.reduce((acc, l) => ({ ...acc, [l.key]: l.color }), {});

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPoints, setShowPoints] = useState<Member | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', level: '普通', points: 0 });
  const [pointsForm, setPointsForm] = useState({ change: 0, reason: '' });
  const [expanded, setExpanded] = useState<number | null>(null);
  const toast = useToast();

  const load = () => {
    api.get<Member[]>('/members').then((list) => {
      setMembers(list || []);
    }).catch(() => setMembers([]));
  };
  useEffect(load, []);

  const filtered = members.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.phone || '').includes(q) || (m.level || '').includes(q);
  });

  const totalOrders = members.reduce((s, m) => s + (Number(m.order_count) || 0), 0);
  const totalSpent = members.reduce((s, m) => s + (Number(m.total_spent) || 0), 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', level: '普通', points: 0 });
    setShowForm(true);
  };
  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ name: m.name, phone: m.phone, level: m.level || '普通', points: m.points || 0 });
    setShowForm(true);
  };

  const submit = () => {
    if (!form.name.trim()) { toast.push('请填写姓名', 'error'); return; }
    if (!form.phone.trim()) { toast.push('请填写手机号', 'error'); return; }
    const payload = { name: form.name.trim(), phone: form.phone.trim(), level: form.level, points: Number(form.points) || 0 };
    if (editing) {
      api.patch<any>(`/customers/${editing.id}`, payload).then(() => {
        toast.push('会员信息已更新');
        load();
        setShowForm(false);
      }).catch(() => {
        api.patch<any>(`/members/${editing.id}`, payload).then(() => {
          toast.push('会员信息已更新');
          load();
          setShowForm(false);
        }).catch(() => toast.push('更新失败，请稍后重试', 'error'));
      });
    } else {
      api.post<any>('/members', payload).then(() => {
        toast.push('会员已添加');
        load();
        setShowForm(false);
      }).catch(() => toast.push('添加失败，请稍后重试', 'error'));
    }
  };

  const remove = (m: Member) => {
    if (!confirm(`确认删除会员「${m.name}」？此操作不可撤销。`)) return;
    api.delete<any>(`/members/${m.id}`).then(() => {
      toast.push('已删除');
      load();
    }).catch(() => toast.push('删除失败，请稍后重试', 'error'));
  };

  const openPoints = (m: Member) => {
    setShowPoints(m);
    setPointsForm({ change: 0, reason: '' });
  };

  const submitPoints = () => {
    if (!showPoints) return;
    const change = Number(pointsForm.change) || 0;
    if (change === 0) { toast.push('请输入积分变动值', 'error'); return; }
    const newPoints = Math.max(0, (showPoints.points || 0) + change);
    api.patch<any>(`/customers/${showPoints.id}`, { points: newPoints }).then(() => {
      toast.push(`${change > 0 ? '增加' : '扣减'} ${Math.abs(change)} 积分`);
      load();
      setShowPoints(null);
    }).catch(() => {
      api.patch<any>(`/members/${showPoints.id}`, { points: newPoints }).then(() => {
        toast.push(`${change > 0 ? '增加' : '扣减'} ${Math.abs(change)} 积分`);
        load();
        setShowPoints(null);
      }).catch(() => toast.push('积分更新失败', 'error'));
    });
  };

  const fmt = (n: number) => '¥' + (n || 0).toFixed(2);
  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('zh-CN') : '—';
  const initialLetter = (name: string) => (name || '?').charAt(0).toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">MEMBERS</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">会员管理</h1>
          <p className="text-sm text-muted mt-1">
            共 <span className="text-gold-700 font-semibold">{members.length}</span> 位会员 · 累计订单 <span className="text-gold-700 font-semibold">{totalOrders}</span> 单 · 累计消费 <span className="text-gold-gradient font-serif font-semibold">{fmt(totalSpent)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-porcelain flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <RefreshCw size={15} /> 刷新
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <Plus size={15} /> 添加会员
          </button>
        </div>
      </div>

      {/* 搜索 */}
      <div className="card-glass p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索姓名 / 手机号 / 等级..."
            className="input-gold"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
      </div>

      {/* 会员列表表格 */}
      <div className="card-porcelain overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>会员</th>
                <th>等级</th>
                <th>积分</th>
                <th>订单数</th>
                <th>累计消费</th>
                <th>注册时间</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted">
                  <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
                    <UserPlus size={20} className="text-gold-700" />
                  </div>
                  暂无会员
                </td></tr>
              ) : filtered.map((m) => (
                <div key={m.id} style={{ display: 'contents' }}>
                  <tr className="cursor-pointer transition-colors" onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-white font-serif font-semibold shadow-gold flex-shrink-0">
                          {initialLetter(m.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-ink-500 font-medium flex items-center gap-2">
                            {m.name}
                            {expanded === m.id ? <ChevronUp size={14} className="text-gold-600" /> : <ChevronDown size={14} className="text-muted" />}
                          </div>
                          <div className="text-xs text-muted flex items-center gap-1"><Phone size={10} /> {m.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`tag ${LEVEL_COLORS[m.level || '普通'] || ''}`}>
                        <Award size={10} className="mr-1" /> {m.level || '普通'}
                      </span>
                    </td>
                    <td><span className="font-serif font-semibold text-gold-700">{(m.points || 0).toLocaleString()}</span></td>
                    <td><span className="font-serif text-ink-500">{m.order_count || 0}</span></td>
                    <td><span className="text-gold-gradient font-serif font-semibold">{fmt(m.total_spent || 0)}</span></td>
                    <td className="text-xs text-muted">{fmtDate(m.created_at)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEdit(m)} className="btn-porcelain !py-1.5 !px-3 text-xs flex items-center gap-1.5" title="编辑">
                          <Edit2 size={12} /> 编辑
                        </button>
                        <button onClick={() => openPoints(m)} className="btn-porcelain !py-1.5 !px-3 text-xs flex items-center gap-1.5" title="调整积分">
                          <Coins size={12} /> 积分
                        </button>
                        <button onClick={() => remove(m)} className="btn-porcelain !py-1.5 !px-3 text-xs flex items-center gap-1.5 !text-red-500 hover:!border-red-500/30" title="删除">
                          <Trash2 size={12} /> 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === m.id && (
                    <tr className="bg-gold-500/4 border-t-0">
                      <td colSpan={7} className="!py-0">
                        <div className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                            <InfoCard Icon={UserPlus} label="会员姓名" value={m.name} />
                            <InfoCard Icon={Phone} label="联系电话" value={m.phone || '—'} />
                            <InfoCard Icon={Award} label="会员等级" value={m.level || '普通'} />
                            <InfoCard Icon={Coins} label="当前积分" value={(m.points || 0).toLocaleString()} />
                            <InfoCard Icon={MapPin} label="地址" value={m.address || '未设置'} span={2} />
                            <InfoCard Icon={CalendarDays} label="注册时间" value={fmtDate(m.created_at)} />
                            <InfoCard Icon={Wallet} label="累计消费" value={fmt(m.total_spent || 0)} />
                          </div>

                          {/* 最近订单 */}
                          <div>
                            <div className="text-xs text-muted tracking-widest mb-3 flex items-center gap-2">
                              <ShoppingBag size={12} className="text-gold-600" /> RECENT ORDERS · 最近订单
                            </div>
                            <div className="bg-white rounded-2xl border border-gold-500/10 overflow-hidden">
                              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gold-500/6 text-[11px] text-muted tracking-wider">
                                <div className="col-span-4">订单号</div>
                                <div className="col-span-2 text-center">状态</div>
                                <div className="col-span-3 text-right">金额</div>
                                <div className="col-span-3 text-right">时间</div>
                              </div>
                              {(m.recent_orders || []).length > 0 ? m.recent_orders!.map((o, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-gold-500/8 text-sm items-center">
                                  <div className="col-span-4 font-serif text-ink-500">#{o.order_no}</div>
                                  <div className="col-span-2 text-center">
                                    <span className="tag !py-0.5 !px-2 !text-[10px]">{o.status || '—'}</span>
                                  </div>
                                  <div className="col-span-3 text-right text-gold-700 font-serif font-semibold">{fmt(o.total)}</div>
                                  <div className="col-span-3 text-right text-xs text-muted">{new Date(o.created_at).toLocaleString('zh-CN')}</div>
                                </div>
                              )) : (
                                <div className="px-4 py-6 text-center text-sm text-muted">暂无订单记录</div>
                              )}
                            </div>
                          </div>
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

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-500/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up" onClick={() => setShowForm(false)}>
          <div className="card-porcelain w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gold-500/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted tracking-widest mb-1">{editing ? 'EDIT' : 'NEW'}</div>
                <h3 className="font-serif text-xl text-ink-500">{editing ? '编辑会员' : '添加会员'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gold-500/10 text-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label text-xs text-muted flex items-center gap-1.5 mb-2"><UserPlus size={12} /> 姓名 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-gold"
                  placeholder="会员姓名"
                />
              </div>
              <div>
                <label className="label text-xs text-muted flex items-center gap-1.5 mb-2"><Phone size={12} /> 手机号 *</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-gold"
                  placeholder="13800000000"
                />
              </div>
              <div>
                <label className="label text-xs text-muted flex items-center gap-1.5 mb-2"><Award size={12} /> 会员等级</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="input-gold"
                >
                  {LEVEL_OPTIONS.map((l) => (
                    <option key={l.key} value={l.key}>{l.label}</option>
                  ))}
                </select>
              </div>
              {editing && (
                <div>
                  <label className="label text-xs text-muted flex items-center gap-1.5 mb-2"><Coins size={12} /> 当前积分</label>
                  <input
                    type="number"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                    className="input-gold"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gold-500/10 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-porcelain !py-2.5 !px-5 text-sm">取消</button>
              <button onClick={submit} className="btn-gold !py-2.5 !px-5 text-sm">{editing ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 积分调整弹窗 */}
      {showPoints && (
        <div className="fixed inset-0 z-50 bg-ink-500/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up" onClick={() => setShowPoints(null)}>
          <div className="card-porcelain w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gold-500/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted tracking-widest mb-1">POINTS</div>
                <h3 className="font-serif text-xl text-ink-500">调整积分</h3>
                <p className="text-xs text-muted mt-1">会员：{showPoints.name} · 当前积分 {(showPoints.points || 0).toLocaleString()}</p>
              </div>
              <button onClick={() => setShowPoints(null)} className="p-2 rounded-full hover:bg-gold-500/10 text-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label text-xs text-muted mb-2">积分变动（正数增加 / 负数扣减）*</label>
                <input
                  type="number"
                  value={pointsForm.change}
                  onChange={(e) => setPointsForm({ ...pointsForm, change: Number(e.target.value) })}
                  className="input-gold font-serif text-lg"
                  placeholder="如 +100 或 -50"
                />
                <div className="mt-2 text-xs text-muted">
                  调整后积分：<span className="text-gold-700 font-semibold font-serif">{Math.max(0, (showPoints.points || 0) + pointsForm.change).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <label className="label text-xs text-muted mb-2">变动原因</label>
                <input
                  value={pointsForm.reason}
                  onChange={(e) => setPointsForm({ ...pointsForm, reason: e.target.value })}
                  className="input-gold"
                  placeholder="如：消费奖励、积分兑换等"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gold-500/10 flex justify-end gap-2">
              <button onClick={() => setShowPoints(null)} className="btn-porcelain !py-2.5 !px-5 text-sm">取消</button>
              <button onClick={submitPoints} className="btn-gold !py-2.5 !px-5 text-sm">确认调整</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ Icon, label, value, span }: { Icon: any; label: string; value: string; span?: number }) {
  return (
    <div className={`card-glass p-4 ${span === 2 ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-700">
          <Icon size={14} />
        </div>
        <div className="text-xs text-muted">{label}</div>
      </div>
      <div className="font-serif text-base text-ink-500 font-medium pl-10">{value}</div>
    </div>
  );
}
