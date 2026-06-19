import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, ChefHat, RefreshCw, Image as ImageIcon, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

interface Category { id: number; name: string }
interface Dish {
  id: number; name: string; category_id: number | null; category_name?: string;
  price: number; description?: string; image?: string; active: number;
}

const EMPTY_FORM = { name: '', category_id: '' as number | '', price: '', description: '', image: '', active: 1 };

export default function Dishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'on' | 'off'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | number>('all');
  const [editing, setEditing] = useState<Dish | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const toast = useToast((s) => s.push);

  const load = () => {
    api.get<Dish[]>('/dishes').then((list) => setDishes(list || [])).catch(() => setDishes([]));
    api.get<Category[]>('/categories').then((list) => setCategories(list || [])).catch(() => setCategories([]));
  };
  useEffect(load, []);

  const filtered = dishes.filter((d) => {
    if (activeFilter === 'on' && !d.active) return false;
    if (activeFilter === 'off' && d.active) return false;
    if (categoryFilter !== 'all' && d.category_id !== categoryFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (d.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (d: Dish) => {
    setEditing(d);
    setForm({
      name: d.name, category_id: d.category_id ?? '',
      price: String(d.price || 0), description: d.description || '',
      image: d.image || '', active: d.active ? 1 : 0,
    });
    setShowForm(true);
  };
  const closeForm = () => setShowForm(false);

  const submit = () => {
    if (!form.name.trim()) { toast('请填写菜品名称', 'error'); return; }
    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < 0) { toast('请填写正确的价格', 'error'); return; }
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id === '' ? null : Number(form.category_id),
      price: priceNum,
      description: form.description,
      image: form.image,
      active: Number(form.active),
    };
    if (editing) {
      api.patch<any>(`/dishes/${editing.id}`, payload).then(() => {
        toast('菜品已更新', 'success');
        load();
        closeForm();
      }).catch((e) => toast(e.message || '更新失败', 'error'));
    } else {
      api.post<any>('/dishes', payload).then(() => {
        toast('菜品已添加', 'success');
        load();
        closeForm();
      }).catch((e) => toast(e.message || '添加失败', 'error'));
    }
  };

  const remove = (d: Dish) => {
    if (!confirm(`确认删除菜品「${d.name}」？`)) return;
    api.delete<any>(`/dishes/${d.id}`).then(() => { toast('已删除', 'success'); load(); })
      .catch((e) => toast(e.message || '删除失败', 'error'));
  };

  const toggleActive = (d: Dish) => {
    const next = d.active ? 0 : 1;
    api.patch<any>(`/dishes/${d.id}`, { active: next }).then(() => {
      setDishes((prev) => prev.map((x) => (x.id === d.id ? { ...x, active: next } : x)));
      toast(next ? '已上架' : '已下架', 'success');
    }).catch((e) => toast(e.message || '操作失败', 'error'));
  };

  const fmt = (n: number) => '¥' + (n || 0).toFixed(2);
  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name || '未分类';

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs text-muted tracking-[0.3em] mb-1">DISHES</div>
          <h1 className="font-serif text-2xl md:text-3xl text-ink-500">菜品管理</h1>
          <p className="text-sm text-muted mt-1">共 {dishes.length} 道菜品 · {dishes.filter((d) => d.active).length} 道在售</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-porcelain flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <RefreshCw size={15} /> 刷新
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2 !py-2.5 !px-5 text-sm">
            <Plus size={15} /> 添加菜品
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="card-glass p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索菜品名称..."
            className="input-gold"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={String(categoryFilter)}
            onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="input-gold !py-2.5 text-sm min-w-[120px]"
          >
            <option value="all">全部分类</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="input-gold !py-2.5 text-sm min-w-[110px]"
          >
            <option value="all">全部状态</option>
            <option value="on">在售</option>
            <option value="off">已下架</option>
          </select>
        </div>
      </div>

      {/* 菜品网格 */}
      {filtered.length === 0 ? (
        <div className="card-porcelain py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
            <ChefHat size={22} className="text-gold-700" />
          </div>
          <div className="text-sm text-muted mb-2">暂无匹配的菜品</div>
          <button onClick={openAdd} className="btn-gold !py-2 !px-4 text-sm">
            <span className="flex items-center gap-1.5"><Plus size={14} /> 添加第一道</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((d) => (
            <div key={d.id} className="card-porcelain overflow-hidden hover:-translate-y-1 transition-transform duration-300 group">
              {/* 图片区 */}
              <div className="relative aspect-[4/3] bg-gradient-porcelain overflow-hidden">
                {d.image ? (
                  <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat size={48} className="text-gold-500/40" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`tag ${d.active ? 'bg-gold-500/20 text-gold-700 border-gold-500/30' : 'bg-ink-500/10 text-muted border-ink-500/20'}`}>
                    {d.active ? '在售' : '已下架'}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="tag bg-water-200/50 text-water-700 border-water-200/60">{catName(d.category_id)}</span>
                </div>
              </div>

              {/* 信息 */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-serif text-lg font-semibold text-ink-500 truncate">{d.name}</h3>
                  <span className="text-gold-gradient font-serif text-lg font-semibold whitespace-nowrap">{fmt(d.price)}</span>
                </div>
                {d.description && (
                  <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">{d.description}</p>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 pt-3 border-t border-gold-500/10">
                  <button
                    onClick={() => toggleActive(d)}
                    className="flex-1 btn-porcelain !py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    {d.active ? <ToggleRight size={14} className="text-gold-700" /> : <ToggleLeft size={14} className="text-muted" />}
                    {d.active ? '上架中' : '已下架'}
                  </button>
                  <button onClick={() => openEdit(d)} className="btn-porcelain !py-2 !px-3 text-xs" title="编辑">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(d)} className="btn-porcelain !py-2 !px-3 text-xs !text-red-500 hover:!border-red-500/30" title="删除">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-500/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up" onClick={closeForm}>
          <div className="card-porcelain w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gold-500/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted tracking-widest mb-1">{editing ? 'EDIT' : 'NEW'}</div>
                <h3 className="font-serif text-xl text-ink-500">{editing ? '编辑菜品' : '添加新菜品'}</h3>
              </div>
              <button onClick={closeForm} className="p-2 rounded-full hover:bg-gold-500/10 text-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label text-xs text-muted">菜品名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-gold"
                  placeholder="如：招牌红烧牛肉面"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs text-muted">分类</label>
                  <select
                    value={form.category_id === '' ? '' : String(form.category_id)}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="input-gold"
                  >
                    <option value="">未分类</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs text-muted">价格 (¥) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input-gold"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="label text-xs text-muted">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-gold min-h-[80px]"
                  placeholder="菜品的特色与口味描述..."
                />
              </div>
              <div>
                <label className="label text-xs text-muted flex items-center gap-1.5">
                  <ImageIcon size={12} /> 图片 URL
                </label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="input-gold"
                  placeholder="https://..."
                />
                {form.image && (
                  <div className="mt-2 w-24 h-24 rounded-2xl overflow-hidden border border-gold-500/20">
                    <img src={form.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm({ ...form, active: form.active ? 0 : 1 })}
                  className={`w-14 h-8 rounded-full transition-colors relative ${form.active ? 'bg-gradient-gold' : 'bg-ink-500/15'}`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${form.active ? 'right-1' : 'left-1'}`} />
                </button>
                <span className="text-sm text-ink-500">{form.active ? '上架销售' : '暂不上架'}</span>
              </div>
            </div>

            <div className="p-6 border-t border-gold-500/10 flex justify-end gap-2">
              <button onClick={closeForm} className="btn-porcelain !py-2.5 !px-5 text-sm">取消</button>
              <button onClick={submit} className="btn-gold !py-2.5 !px-5 text-sm">{editing ? '保存修改' : '添加菜品'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
