import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, UserPlus, RefreshCw, X, Phone, Shield, ChefHat } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

interface Staff {
  id: number; name: string; role?: string; phone?: string;
}

const ROLE_OPTIONS = [
  { key: 'admin', label: '管理员', Icon: Shield, tint: 'gold' },
  { key: 'manager', label: '店长', Icon: Shield, tint: 'water' },
  { key: 'waiter', label: '服务员', Icon: UserPlus, tint: 'porcelain' },
  { key: 'chef', label: '厨师', Icon: ChefHat, tint: 'gold' },
  { key: 'cashier', label: '收银员', Icon: UserPlus, tint: 'water' },
  { key: 'other', label: '其他', Icon: UserPlus, tint: 'porcelain' },
];

const ROLE_LABEL: Record<string, string> = ROLE_OPTIONS.reduce((acc, r) => ({ ...acc, [r.key]: r.label }), {});

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: '', role: 'waiter', phone: '' });
  const toast = useToast((s) => s.push);

  const load = () => {
    api.get<Staff[]>('/staff').then((list) => setStaff(list || [])).catch(() => setStaff([]));
  };
  useEffect(load, []);

  const filtered = staff.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.phone || '').includes(q) || (m.role || '').includes(q);
  });

  const byRole = (key: string) => staff.filter((s) => (s.role || 'waiter') === key).length;

  const openAdd = () => { setEditing(null); setForm({ name: '', role: 'waiter', phone: '' }); setShowForm(true); };
  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role || 'waiter', phone: s.phone || '' });
    setShowForm(true);
  };

  const submit = () => {
    if (!form.name.trim()) { toast('请填写姓名', 'error'); return; }
    const payload = { name: form.name.trim(), role: form.role, phone: form.phone.trim() };
    if (editing) {
      api.patch<any>(`/staff/${editing.id}`, payload).then(() => {
        toast('员工已更新', 'success'); load(); setShowForm(false);
      }).catch((e) => toast(e.message || '更新失败', 'error'));
    } else {
      api.post<any>('/staff', payload).then(() => {
        toast('员工已添加', 'success'); load(); setShowForm(false);
      }).catch((e) => toast(e.message || '添加失败', 'error'));
    }
  };

  const remove = (s: Staff) => {
    if (!confirm(`确认删除员工「${s.name}」？`)) return;
    api.delete<any>(`/staff/${s.id}`).then(() => { toast('已删除', 'success'); load(); })
      .catch((e) => toast(e.message || '删除失败', 'error'));
  };

  const initialLetter = (name: string) => (name || '?').charAt(0).toUpperCase();
  const roleBadge = (key: string) => {
    const r = ROLE_OPTIONS.find((x) => x.key === key) || ROLE_OPTIONS[2];
    if (r.tint === 'gold') return 'bg-gold-500/15 text-gold-700 border-gold-500/30';
    if (r.tint === 'water') return 'bg-water-200/40 text-water-700 border-water-200/60';
    return 'bg-porcelain-100 text-ink-500 border-gold-500/20';
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">STAFF</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">员工管理</h1>
          <p className="text-sm text-muted mt-1">共 <span className="text-gold-700 font-semibold">{staff.length}</span> 位员工</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-porcelain flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <RefreshCw size={15} /> 刷新
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <Plus size={15} /> 添加员工
          </button>
        </div>
      </div>

      {/* 角色统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {ROLE_OPTIONS.map((r) => (
          <div key={r.key} className="card-glass p-3 flex items-center gap-2 hover:-translate-y-0.5 transition-transform duration-300">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              r.tint === 'gold' ? 'bg-gradient-gold text-white shadow-gold' :
              r.tint === 'water' ? 'bg-gradient-water text-white shadow-soft' :
              'bg-gradient-porcelain text-gold-700 border border-gold-500/20'
            }`}>
              <r.Icon size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-muted">{r.label}</div>
              <div className="font-serif text-lg font-semibold text-ink-500">{byRole(r.key)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 搜索 */}
      <div className="card-glass p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索姓名 / 手机号 / 角色..."
            className="input-gold"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
      </div>

      {/* 员工网格 */}
      {filtered.length === 0 ? (
        <div className="card-porcelain py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
            <UserPlus size={22} className="text-gold-700" />
          </div>
          <div className="text-sm text-muted mb-2">暂无员工</div>
          <button onClick={openAdd} className="btn-gold !py-2 !px-4 text-sm">
            <span className="flex items-center gap-1.5"><Plus size={14} /> 添加员工</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((s) => (
            <div key={s.id} className="card-porcelain p-5 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-water flex items-center justify-center text-white font-serif font-semibold shadow-soft flex-shrink-0">
                  {initialLetter(s.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg font-semibold text-ink-500 truncate">{s.name}</h3>
                  <span className={`tag inline-flex mt-1 text-[11px] ${roleBadge(s.role || 'waiter')}`}>
                    {ROLE_LABEL[s.role || 'waiter'] || '员工'}
                  </span>
                </div>
              </div>

              {s.phone && (
                <div className="text-xs text-muted mb-4 flex items-center gap-1.5 bg-gold-500/5 rounded-xl px-3 py-2">
                  <Phone size={11} /> {s.phone}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gold-500/10">
                <button onClick={() => openEdit(s)} className="btn-porcelain !py-1 !px-3 text-[11px] flex items-center gap-1.5">
                  <Edit2 size={11} /> 编辑
                </button>
                <button onClick={() => remove(s)} className="btn-porcelain !py-1 !px-3 text-[11px] !text-red-500 hover:!border-red-500/30 flex items-center gap-1.5">
                  <Trash2 size={11} /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-500/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up" onClick={() => setShowForm(false)}>
          <div className="card-porcelain w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gold-500/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted tracking-widest mb-1">{editing ? 'EDIT' : 'NEW'}</div>
                <h3 className="font-serif text-xl text-ink-500">{editing ? '编辑员工' : '添加员工'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gold-500/10 text-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label text-xs text-muted">姓名 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-gold"
                  placeholder="员工姓名"
                />
              </div>
              <div>
                <label className="label text-xs text-muted">角色</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setForm({ ...form, role: r.key })}
                      className={`p-2.5 rounded-2xl text-[11px] font-medium transition-all border flex items-center justify-center gap-1 ${
                        form.role === r.key
                          ? 'bg-gradient-gold text-white shadow-gold border-transparent'
                          : 'bg-gold-500/5 text-ink-500 border-gold-500/15 hover:bg-gold-500/10'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label text-xs text-muted">手机号</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-gold"
                  placeholder="13800000000"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gold-500/10 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-porcelain !py-2.5 !px-5 text-sm">取消</button>
              <button onClick={submit} className="btn-gold !py-2.5 !px-5 text-sm">{editing ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
