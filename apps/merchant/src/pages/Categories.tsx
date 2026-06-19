import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Tag, RefreshCw, X, ChefHat, UtensilsCrossed } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

interface Category { id: number; name: string; icon?: string; dish_count?: number }
interface Dish { id: number; category_id: number | null }

const ICONS = ['🍜', '🍲', '🥗', '🍱', '🍛', '🍝', '🍕', '🥟', '🍰', '🥤', '🍹', '🍢'];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', icon: '' });
  const toast = useToast((s) => s.push);

  const load = () => {
    api.get<Category[]>('/categories').then((list) => setCategories(list || [])).catch(() => setCategories([]));
    api.get<Dish[]>('/dishes').then((list) => setDishes(list || [])).catch(() => setDishes([]));
  };
  useEffect(load, []);

  const dishCount = (id: number) => dishes.filter((d) => d.category_id === id).length;

  const filtered = categories.filter((c) => {
    if (query) return (c.name || '').toLowerCase().includes(query.toLowerCase());
    return true;
  });

  const openAdd = () => { setEditing(null); setForm({ name: '', icon: '' }); setShowForm(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, icon: c.icon || '' });
    setShowForm(true);
  };

  const submit = () => {
    if (!form.name.trim()) { toast('请填写分类名称', 'error'); return; }
    const payload = { name: form.name.trim(), icon: form.icon || null };
    if (editing) {
      api.patch<any>(`/categories/${editing.id}`, payload).then(() => {
        toast('分类已更新', 'success'); load(); setShowForm(false);
      }).catch((e) => toast(e.message || '更新失败', 'error'));
    } else {
      api.post<any>('/categories', payload).then(() => {
        toast('分类已添加', 'success'); load(); setShowForm(false);
      }).catch((e) => toast(e.message || '添加失败', 'error'));
    }
  };

  const remove = (c: Category) => {
    const count = dishCount(c.id);
    if (count > 0) { toast(`该分类下还有 ${count} 道菜，请先处理`, 'error'); return; }
    if (!confirm(`确认删除分类「${c.name}」？`)) return;
    api.delete<any>(`/categories/${c.id}`).then(() => { toast('已删除', 'success'); load(); })
      .catch((e) => toast(e.message || '删除失败', 'error'));
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">CATEGORIES</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">分类管理</h1>
          <p className="text-sm text-muted mt-1">共 {categories.length} 个分类 · 含 {dishes.length} 道菜品</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-porcelain flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <RefreshCw size={15} /> 刷新
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <Plus size={15} /> 添加分类
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
            placeholder="搜索分类名称..."
            className="input-gold"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
      </div>

      {/* 分类网格 */}
      {filtered.length === 0 ? (
        <div className="card-porcelain py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
            <Tag size={22} className="text-gold-700" />
          </div>
          <div className="text-sm text-muted mb-2">暂无分类</div>
          <button onClick={openAdd} className="btn-gold !py-2 !px-4 text-sm">
            <span className="flex items-center gap-1.5"><Plus size={14} /> 创建分类</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filtered.map((c) => {
            const count = dishCount(c.id);
            return (
              <div key={c.id} className="card-porcelain p-5 hover:-translate-y-1 transition-transform duration-300 text-center group">
                <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-gradient-porcelain border border-gold-500/15 flex items-center justify-center text-3xl group-hover:shadow-gold transition-shadow">
                  {c.icon || <UtensilsCrossed size={28} className="text-gold-500/70" />}
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink-500 mb-1 truncate">{c.name}</h3>
                <p className="text-xs text-muted mb-4">
                  <span className="text-gold-700 font-semibold">{count}</span> 道菜品
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <button onClick={() => openEdit(c)} className="btn-porcelain !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                    <Edit2 size={12} /> 编辑
                  </button>
                  <button onClick={() => remove(c)} className="btn-porcelain !py-1.5 !px-3 text-xs !text-red-500 hover:!border-red-500/30 flex items-center gap-1.5">
                    <Trash2 size={12} /> 删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-500/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up" onClick={() => setShowForm(false)}>
          <div className="card-porcelain w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gold-500/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted tracking-widest mb-1">{editing ? 'EDIT' : 'NEW'}</div>
                <h3 className="font-serif text-xl text-ink-500">{editing ? '编辑分类' : '添加分类'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gold-500/10 text-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label text-xs text-muted">分类名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-gold"
                  placeholder="如：主食、热菜、饮品"
                />
              </div>
              <div>
                <label className="label text-xs text-muted">图标 (可选)</label>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm({ ...form, icon: form.icon === icon ? '' : icon })}
                      className={`aspect-square rounded-2xl text-xl flex items-center justify-center transition-all ${
                        form.icon === icon
                          ? 'bg-gradient-gold text-white shadow-gold scale-105'
                          : 'bg-gold-500/5 border border-gold-500/15 hover:bg-gold-500/10'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="input-gold"
                  placeholder="或自定义 emoji / 文字"
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

      <div className="hidden">
        <ChefHat />
      </div>
    </div>
  );
}
