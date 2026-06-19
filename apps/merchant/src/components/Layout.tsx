import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, Users, UserPlus,
  Settings, LogOut, Tag, Table2, LineChart, Leaf
} from 'lucide-react';
import { useAuth } from '../stores/auth';

const nav = [
  { path: '/', label: '仪表盘', Icon: LayoutDashboard, exact: true },
  { path: '/orders', label: '订单管理', Icon: ClipboardList },
  { path: '/dishes', label: '菜品管理', Icon: UtensilsCrossed },
  { path: '/categories', label: '分类管理', Icon: Tag },
  { path: '/tables', label: '餐桌管理', Icon: Table2 },
  { path: '/members', label: '会员管理', Icon: Users },
  { path: '/staff', label: '员工管理', Icon: UserPlus },
  { path: '/reports', label: '经营报表', Icon: LineChart },
  { path: '/settings', label: '系统设置', Icon: Settings },
];

export default function Layout() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const logout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } bg-white/70 backdrop-blur-2xl border-r border-gold-500/15 shadow-soft`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`p-5 flex items-center gap-3 border-b border-gold-500/10 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold flex-shrink-0">
              <Leaf size={20} strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-serif text-lg font-semibold text-ink-500 leading-tight truncate">云栖浅食</div>
                <div className="text-[10px] text-muted tracking-widest">MERCHANT CONSOLE</div>
              </div>
            )}
          </div>

          {/* 导航 */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scroll-thin">
            {nav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center !px-0' : ''}`}
                title={item.label}
              >
                <item.Icon size={18} strokeWidth={2} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* 用户信息 */}
          <div className="p-3 border-t border-gold-500/10">
            <div className={`flex items-center gap-3 p-2 rounded-2xl bg-gold-500/5 ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-2xl bg-gradient-water flex items-center justify-center text-white shadow-soft flex-shrink-0">
                <span className="font-serif font-semibold text-sm">{auth.user?.name?.[0] || auth.user?.username?.[0] || 'A'}</span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-500 truncate">{auth.user?.name || auth.user?.username || '管理员'}</div>
                  <div className="text-[10px] text-muted">{auth.user?.role === 'admin' ? '超级管理员' : '员工'}</div>
                </div>
              )}
              {!collapsed && (
                <button onClick={logout} className="p-2 rounded-full hover:bg-white/70 text-muted hover:text-red-500 transition-colors" title="退出登录">
                  <LogOut size={15} strokeWidth={2} />
                </button>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full mt-2 p-2 text-xs text-muted hover:text-gold-700 hover:bg-gold-500/10 rounded-xl transition-colors text-center"
            >
              {collapsed ? '›' : '收起侧栏 ‹'}
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        <div className="min-h-screen animate-fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
