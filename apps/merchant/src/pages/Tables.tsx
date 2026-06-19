import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Table2, RefreshCw, X, Users, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

interface Table { id: number; table_no: string; capacity: number; status: 'idle' | 'using' | 'disabled' }

const STATUS_LABEL: Record<Table['status'], string> = {
  idle: '空闲',
  using: '使用中',
  disabled: '停用',
};
const STATUS_OPTIONS: Table['status'][] = ['idle', 'using', 'disabled'];

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | Table['status']>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [form, setForm] = useState({ table_no: '', capacity: '4', status: 'idle' as Table['status'] });
  const toast = useToast((s) => s.push);

  const load = () => {
    api.get<Table[]>('/tables').then((list) => setTables(list || [])).catch(() => setTables([]));
  };
  useEffect(load, []);

  const filtered = tables.filter((t) => statusFilter === 'all' ? true : t.status === statusFilter);

  const byStatus = (s: Table['status']) => tables.filter((t) => t.status === s).length;

  const openAdd = () => {
    setEditing(null);
    setForm({ table_no: '', capacity: '4', status: 'idle' });
    setShowForm(true);
  };
  const openEdit = (t: Table) => {
    setEditing(t);
    setForm({ table_no: t.table_no, capacity: String(t.capacity), status: t.status });
    setShowForm(true);
  };

  const submit = () => {
    if (!form.table_no.trim()) { toast('请填写桌号', 'error'); return; }
    const capNum = Number(form.capacity);
    if (isNaN(capNum) || capNum <= 0) { toast('请填写正确的容量', 'error'); return; }
    const payload = { table_no: form.table_no.trim(), capacity: capNum, status: form.status };
    if (editing) {
      api.patch<any>(`/tables/${editing.id}`, payload).then(() => {
        toast('餐桌已更新', 'success'); load(); setShowForm(false);
      }).catch((e) => toast(e.message || '更新失败', 'error'));
    } else {
      api.post<any>('/tables', payload).then(() => {
        toast('餐桌已添加', 'success'); load(); setShowForm(false);
      }).catch((e) => toast(e.message || '添加失败', 'error'));
    }
  };

  const remove = (t: Table) => {
    if (!confirm(`确认删除餐桌「${t.table_no}」？`)) return;
    api.delete<any>(`/tables/${t.id}`).then(() => { toast('已删除', 'success'); load(); })
      .catch((e) => toast(e.message || '删除失败', 'error'));
  };

  const toggleStatus = (t: Table, next: Table['status']) => {
    api.patch<any>(`/tables/${t.id}`, { status: next }).then(() => {
      setTables((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
      toast(`已更新为${STATUS_LABEL[next]}`, 'success');
    }).catch((e) => toast(e.message || '操作失败', 'error'));
  };

  const borderColor = (s: Table['status']) => {
    if (s === 'idle') return 'ring-gold-500/30 border-gold-500/30';
    if (s === 'using') return 'ring-water-500/50 border-water-200/60';
    return 'ring-ink-500/15 border-ink-500/10';
  };
  const bgTint = (s: Table['status']) => {
    if (s === 'idle') return 'bg-gold-500/10';
    if (s === 'using') return 'bg-water-200/40';
    return 'bg-ink-500/5';
  };
  const iconColor = (s: Table['status']) => {
    if (s === 'idle') return 'text-gold-700';
    if (s === 'using') return 'text-water-700';
    return 'text-muted';
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">TABLES</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">餐桌管理</h1>
          <p className="text-sm text-muted mt-1">
            共 {tables.length} 桌 · <span className="text-gold-700">{byStatus('idle')}</span> 空闲 · <span className="text-water-700">{byStatus('using')}</span> 使用中 · <span className="text-muted">{byStatus('disabled')}</span> 停用
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-porcelain flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <RefreshCw size={15} /> 刷新
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <Plus size={15} /> 添加餐桌
          </button>
        </div>
      </div>

      {/* 状态过滤 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: 'all' as const, label: '全部', count: tables.length },
          { key: 'idle' as const, label: '空闲', count: byStatus('idle') },
          { key: 'using' as const, label: '使用中', count: byStatus('using') },
          { key: 'disabled' as const, label: '停用', count: byStatus('disabled') },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`card-glass p-4 text-left transition-all duration-300 ${statusFilter === f.key ? 'ring-2 ring-gold-500/40 -translate-y-0.5' : 'hover:-translate-y-0.5'}`}
          >
            <div className="text-xs text-muted mb-1">{f.label}</div>
            <div className="font-serif text-2xl text-ink-500">{f.count}</div>
            <div className="text-[11px] text-muted">桌</div>
          </button>
        ))}
      </div>

      {/* 餐桌网格 */}
      {filtered.length === 0 ? (
        <div className="card-porcelain py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
            <Table2 size={22} className="text-gold-700" />
          </div>
          <div className="text-sm text-muted mb-2">暂无餐桌</div>
          <button onClick={openAdd} className="btn-gold !py-2 !px-4 text-sm">
            <span className="flex items-center gap-1.5"><Plus size={14} /> 添加餐桌</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filtered.map((t) => (
            <div
              key={t.id}
              className={`card-porcelain p-5 hover:-translate-y-1 transition-transform duration-300 border-2 ${borderColor(t.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-2xl ${bgTint(t.status)} flex items-center justify-center`}>
                  <Table2 size={22} className={iconColor(t.status)} />
                </div>
                <span className={`tag ${
                  t.status === 'idle' ? 'bg-gold-500/15 text-gold-700 border-gold-500/30' :
                  t.status === 'using' ? 'bg-water-200/40 text-water-700 border-water-200/60' :
                  'bg-ink-500/10 text-muted border-ink-500/20'
                }`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </div>

              <h3 className="font-serif text-xl font-semibold text-ink-500 mb-1">{t.table_no}</h3>
              <p className="text-xs text-muted mb-4 flex items-center gap-1.5">
                <Users size={12} /> 容 {t.capacity} 人
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                {t.status !== 'idle' && (
                  <button onClick={() => toggleStatus(t, 'idle')} className="btn-porcelain !py-1 !px-2.5 text-[11px] flex items-center gap-1">
                    <CheckCircle2 size={11} /> 设空闲
                  </button>
                )}
                {t.status !== 'using' && t.status !== 'disabled' && (
                  <button onClick={() => toggleStatus(t, 'using')} className="btn-water !py-1 !px-2.5 text-[11px] flex items-center gap-1">
                    <Users size={11} /> 使用中
                  </button>
                )}
                {t.status === 'using' && (
                  <button onClick={() => toggleStatus(t, 'idle')} className="btn-porcelain !py-1 !px-2.5 text-[11px] flex items-center gap-1">
                    <CheckCircle2 size={11} /> 清台
                  </button>
                )}
                <button onClick={() => openEdit(t)} className="btn-porcelain !py-1 !px-2 text-[11px]" title="编辑">
                  <Edit2 size={11} />
                </button>
                <button onClick={() => remove(t)} className="btn-porcelain !py-1 !px-2 text-[11px] !text-red-500 hover:!border-red-500/30" title="删除">
                  <Trash2 size={11} />
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
                <h3 className="font-serif text-xl text-ink-500">{editing ? '编辑餐桌' : '添加餐桌'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gold-500/10 text-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label text-xs text-muted">桌号 *</label>
                <input
                  value={form.table_no}
                  onChange={(e) => setForm({ ...form, table_no: e.target.value })}
                  className="input-gold"
                  placeholder="如：A1 / 01 / VIP-01"
                />
              </div>
              <div>
                <label className="label text-xs text-muted">容量 (人) *</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="input-gold"
                />
              </div>
              <div>
                <label className="label text-xs text-muted">状态</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setForm({ ...form, status: s })}
                      className={`p-3 rounded-2xl text-xs font-medium transition-all border ${
                        form.status === s
                          ? 'bg-gradient-gold text-white shadow-gold border-transparent'
                          : 'bg-gold-500/5 text-ink-500 border-gold-500/15 hover:bg-gold-500/10'
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gold-500/10 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-porcelain !py-2.5 !px-5 text-sm">取消</button>
              <button onClick={submit} className="btn-gold !py-2.5 !px-5 text-sm">{editing ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        <XCircle />
      </div>
    </div>
  );
}
