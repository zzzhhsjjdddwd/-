import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Loader2, KeyRound, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useUser } from '../stores/user.js';
import { useToast } from '../components/Toast.js';

export default function Login() {
  const nav = useNavigate();
  const user = useUser();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) return toast.push('请输入正确的手机号', 'error');
    if (sending || countdown > 0) return;
    setSending(true);
    try {
      await api.post('/auth/send-code', { phone });
      toast.push('验证码已发送（演示环境：1234）');
      setCountdown(60);
    } catch (e: any) {
      toast.push(e.message || '发送失败', 'error');
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    if (!/^1\d{10}$/.test(phone)) return toast.push('请输入正确的手机号', 'error');
    if (!code) return toast.push('请输入验证码', 'error');
    setLoading(true);
    try {
      const res = await api.post<any>('/auth/customer-login', { phone, code });
      user.login(res.user, res.token);
      toast.push('登录成功');
      setTimeout(() => nav('/profile'), 500);
    } catch (e: any) {
      toast.push(e.message || '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-porcelain-50 via-porcelain-100 to-water-100 pb-20">
      <div className="max-w-md mx-auto px-5 pt-10">
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-muted hover:text-ink-500 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> 返回
        </button>

        <h1 className="font-serif text-4xl text-ink-500 mb-2">登录</h1>
        <p className="text-sm text-muted">首次登录将自动创建账户</p>

        <div className="mt-10 space-y-4">
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-700/70" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="手机号码"
              inputMode="numeric"
              className="input-gold"
              style={{ paddingLeft: '3rem' }}
              disabled={loading}
            />
          </div>

          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-700/70" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="验证码"
                className="input-gold"
                style={{ paddingLeft: '3rem' }}
                disabled={loading}
              />
            </div>
            <button
              onClick={sendCode}
              disabled={sending || countdown > 0 || loading}
              className="btn-porcelain !py-3 px-4 text-sm whitespace-nowrap flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending && <Loader2 size={14} className="animate-spin" />}
              {!sending && countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="btn-gold w-full !py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? '登录中...' : '登录 / 注册'}
          </button>
        </div>

        <div className="mt-10 card-glass p-4 text-[11px] text-muted leading-relaxed">
          <div className="font-medium text-ink-500 mb-1.5 flex items-center gap-1.5">
            <Send size={12} /> 演示提示
          </div>
          为了方便体验，本演示环境中验证码填 <span className="text-gold-700 font-semibold">1234</span> 即可登录。
        </div>
      </div>
    </div>
  );
}
