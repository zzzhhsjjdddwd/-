import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, User, Phone, MapPin, Star, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useUser } from '../stores/user.js';
import { useToast } from '../components/Toast.js';

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  is_default?: boolean;
}

interface FormState {
  name: string;
  phone: string;
  address: string;
  is_default: boolean;
}

const emptyForm: FormState = { name: '', phone: '', address: '', is_default: false };

export default function Address() {
  const nav = useNavigate();
  const toast = useToast();
  const userStore = useUser();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    api.get<Address[]>('/addresses')
      .then((list) => setAddresses(list || []))
      .catch((e) => toast.push(e.message || '加载失败', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({ name: a.name, phone: a.phone, address: a.address, is_default: !!a.is_default });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const submitForm = async () => {
    if (!form.name.trim()) return toast.push('请输入姓名', 'error');
    if (!/^1\d{10}$/.test(form.phone)) return toast.push('请输入正确的手机号', 'error');
    if (!form.address.trim()) return toast.push('请输入详细地址', 'error');
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/addresses/${editing.id}`, form);
        toast.push('已更新');
      } else {
        await api.post('/addresses', form);
        toast.push('已添加');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      toast.push(e.message || '操作失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const setDefault = async (id: number) => {
    try {
      await api.patch(`/addresses/${id}/default`, {});
      toast.push('已设为默认');
      load();
    } catch (e: any) {
      toast.push(e.message || '操作失败', 'error');
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/addresses/${id}`);
      toast.push('已删除');
      setDeleteId(null);
      load();
    } catch (e: any) {
      toast.push(e.message || '删除失败', 'error');
      setDeleteId(null);
    }
  };

  const isLoggedIn = !!userStore.user || !!userStore.token;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-12 animate-fade-up">
      <section className="mt-6 md:mt-10 mb-6">
        <button onClick={() => nav(-1)} className="text-sm text-muted flex items-center gap-1 mb-3 hover:text-ink-500 transition-colors">
          <ArrowLeft size={14} /> 返回
        </button>
        <div className="text-xs text-muted tracking-[0.3em] mb-1">ADDRESS</div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink-500">地址管理</h1>
      </section>

      {!isLoggedIn ? (
        <section className="card-porcelain p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
            <MapPin size={28} className="text-gold-700" />
          </div>
          <h3 className="font-serif text-xl text-ink-500 mb-2">请先登录</h3>
          <p className="text-sm text-muted mb-6">登录后可管理您的配送地址</p>
          <button onClick={() => nav('/login')} className="btn-gold">去登录</button>
        </section>
      ) : loading ? (
        <div className="card-porcelain py-16 text-center text-muted">加载中...</div>
      ) : addresses.length === 0 ? (
        <section className="card-porcelain p-8 md:p-12 text-center mb-5">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-porcelain border border-gold-500/20 flex items-center justify-center">
            <MapPin size={28} className="text-gold-700" strokeWidth={1.8} />
          </div>
          <h3 className="font-serif text-xl text-ink-500 mb-2">还没有地址</h3>
          <p className="text-sm text-muted mb-6">添加常用的配送地址，下次一键选择</p>
          <button onClick={openAdd} className="btn-gold">
            <Plus size={14} className="mr-1 inline -mt-0.5" /> 添加地址
          </button>
        </section>
      ) : (
        <>
          <div className="mb-4">
            <button onClick={openAdd} className="btn-gold !py-2.5 text-sm">
              <Plus size={14} className="mr-1 inline -mt-0.5" /> 新增地址
            </button>
          </div>

          <div className="space-y-3">
            {addresses.map((a, i) => (
              <div
                key={a.id}
                className="card-porcelain p-5 animate-fade-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-serif text-lg font-semibold text-ink-500">{a.name}</span>
                    <span className="text-sm text-muted">· {a.phone}</span>
                    {a.is_default && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gold-700 bg-gold-500/10 border border-gold-500/25 rounded-full px-2.5 py-0.5">
                        <Star size={10} /> 默认地址
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-ink-500 mb-4">
                  <MapPin size={14} className="text-gold-700 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{a.address}</span>
                </div>
                <div className="divider-gold mb-3" />
                <div className="flex items-center gap-2 flex-wrap">
                  {!a.is_default && (
                    <button
                      onClick={() => setDefault(a.id)}
                      className="btn-porcelain !py-2 !px-3.5 text-xs flex items-center gap-1.5"
                    >
                      <Star size={12} /> 设为默认
                    </button>
                  )}
                  <button onClick={() => openEdit(a)} className="btn-porcelain !py-2 !px-3.5 text-xs flex items-center gap-1.5">
                    <Pencil size={12} /> 编辑
                  </button>
                  {deleteId === a.id ? (
                    <div className="flex items-center gap-1.5 ml-auto text-xs">
                      <span className="text-muted">确认删除？</span>
                      <button onClick={() => confirmDelete(a.id)} className="btn-gold !py-1.5 !px-3 !text-xs">确认</button>
                      <button onClick={() => setDeleteId(null)} className="btn-porcelain !py-1.5 !px-3 !text-xs">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(a.id)} className="ml-auto btn-porcelain !py-2 !px-3.5 text-xs flex items-center gap-1.5 hover:!border-red-500/40 hover:!text-red-500">
                      <Trash2 size={12} /> 删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-up" onClick={closeModal}>
          <div className="card-porcelain w-full max-w-md p-6 m-0 sm:m-4 shadow-float" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ink-500">{editing ? '编辑地址' : '新增地址'}</h3>
              <button onClick={closeModal} className="text-muted hover:text-ink-500 p-1"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block flex items-center gap-1"><User size={11} /> 姓名</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-gold"
                  placeholder="请输入姓名"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block flex items-center gap-1"><Phone size={11} /> 手机</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  className="input-gold"
                  placeholder="11 位手机号"
                  inputMode="numeric"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block flex items-center gap-1"><MapPin size={11} /> 详细地址</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="input-gold"
                  placeholder="如：西湖区云栖小镇 1 号楼 302"
                  rows={2}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                  disabled={submitting}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer select-none pt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_default: !form.is_default })}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.is_default ? 'bg-gradient-gold justify-end' : 'bg-gold-500/20 justify-start'}`}
                  disabled={submitting}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
                <span>设为默认地址</span>
              </label>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button onClick={closeModal} disabled={submitting} className="btn-porcelain !py-3 flex-1 text-sm">取消</button>
              <button onClick={submitForm} disabled={submitting} className="btn-gold !py-3 flex-1 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
