# 云栖浅食 · 企业级 PWA 点餐套装

> Yunqi Light Meal · Enterprise-grade PWA Ordering Suite

一套面向连锁餐饮企业的完整 PWA 点餐解决方案，包含两个独立应用：

- **客户点餐 PWA** (`apps/customer`) — 面向食客，可安装到桌面/手机主屏幕，离线可用
- **商家后台 PWA** (`apps/merchant`) — 面向运营者，菜品/订单/报表一站式管理

两个应用**共享同一个 Express + SQLite 后端** (`api/`)，使用 SSE 实现订单实时推送。

---

## 技术栈

| 层 | 技术 |
|---|-----|
| 前端 | React 18 + TypeScript + Vite 5 + TailwindCSS 3 + Zustand 4 + lucide-react + Recharts |
| 后端 | Express 4 + TypeScript |
| 数据库 | SQLite（better-sqlite3）——可平滑迁移到 PostgreSQL |
| 实时 | Server-Sent Events (SSE) |
| PWA | Web App Manifest + Service Worker |
| 其他 | bcrypt、multer、concurrently |

---

## 快速开始

```bash
# 1. 安装所有依赖
npm run install:all

# 2. 启动（API:4000, 客户:5173, 商家:5174）
npm run dev

# 3. 打开浏览器
#   客户点餐 → http://localhost:5173
#   商家后台 → http://localhost:5174  （账号 admin / 密码 admin123）
```

## 生产构建

```bash
npm run build
npm start    # 同时服务 API 与两个前端（/customer、/merchant）
```

---

## 目录结构

```
.
├─ apps/
│   ├─ customer/   # 客户点餐 PWA
│   └─ merchant/   # 商家后台 PWA
├─ api/            # 共享后端 (Express + SQLite)
├─ shared/         # 前后端共享类型
└─ .trae/documents # PRD / 技术架构
```

---

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 商家管理员 | `admin` | `admin123` |
| 店员 | `staff` | `staff123` |

---

## 关键特性

- **2026 企业级视觉**：深翠绿主色 + 暖橘辅色 + 米白画布；衬线+无衬线混排；柔和阴影；细腻动效
- **完整响应式**：桌面/平板/手机三套断点
- **PWA**：可安装、离线浏览已缓存的菜单/历史订单
- **全闭环**：菜品管理 → 浏览下单 → 状态流转 → 数据报表
- **实时推送**：SSE 订单通知，后台即时响应

---

## 首次启动说明

1. API 首次启动会自动创建 `api/data/database.sqlite` 并初始化若干分类/菜品/员工示例数据
2. 如需重新生成示例数据，运行 `npm run seed`
3. 图片上传至 `api/public/uploads/`，由 API 静态托管
