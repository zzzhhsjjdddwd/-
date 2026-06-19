import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, ArrowRight, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../stores/auth';

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('请输入账号和密码'); return; }
    setLoading(true);
    try {
      const ok = await auth.login(username, password);
      if (ok) navigate('/');
      else setError('账号或密码错误');
    } catch {
      setError('连接失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-porcelain-50 via-porcelain-100 to-water-100 relative overflow-hidden">
      {/* 装饰光斑 */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-water-300/10 blur-3xl animate-float-slow" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-500/5 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-gold flex items-center justify-center text-white shadow-gold mb-4">
            <Leaf size={28} strokeWidth={2.5} />
          </div>
          <div className="font-serif text-2xl text-ink-500 mb-1">云栖浅食</div>
          <div className="text-xs text-muted tracking-[0.3em]">MERCHANT CONSOLE</div>
        </div>

        {/* 卡片 */}
        <div className="card-glass p-8 shadow-gold">
          <div className="text-center mb-6">
            <h2 className="font-serif text-xl text-ink-500 mb-1">欢迎回来</h2>
            <p className="text-xs text-muted">请登录以管理您的餐厅</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">账号</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-700/70" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="input-gold"
                  style={{ paddingLeft: '3rem' }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-700/70" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="input-gold"
                  style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold-700 transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full !py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> 登录中...</>
              ) : (
                <><span>进入管理后台</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gold-500/10 text-center">
            <div className="text-[11px] text-muted leading-relaxed">
              默认测试账号 — 用户名：<span className="text-gold-700 font-medium">admin</span> · 密码：<span className="text-gold-700 font-medium">admin123</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-muted/70">© 云栖浅食 · 企业级点餐管理系统</p>
        </div>
      </div>
    </div>
  );
}
