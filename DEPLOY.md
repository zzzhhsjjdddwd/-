# 云栖浅食 · 部署指南

## 架构

- **前端（GitHub Pages）**：客户点餐端 + 商家后台
  - 客户点餐：`https://<用户名>.github.io/<仓库名>/`
  - 商家后台：`https://<用户名>.github.io/<仓库名>/admin/`
- **后端（Render）**：Node.js + Express + SQLite
  - 地址：在 Render 上部署后获得（形如 `https://yunqi-api-xxx.onrender.com`）

## 部署步骤

### 第 1 步：部署后端 API（Render）

1. 访问 [render.com](https://render.com) 并登录 GitHub 账号
2. 点击 **New → Web Service**，选择本仓库
3. 使用以下配置（或直接识别 `render.yaml`）：
   - **Build Command**: `cd api && npm install --production=false && npm run build`
   - **Start Command**: `cd api && npm start`
   - **Plan**: Free（或 Starter）
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `PORT` = `10000`
     - `DATA_DIR` = `/opt/render/project/src/data`
   - **Disk**（重要，防止数据库每次部署重置）：
     - Name: `yunqi-data`
     - Mount Path: `/opt/render/project/src/data`
     - Size: 1 GB
4. 等待部署完成，复制获得的服务地址（例如 `https://yunqi-api-xxx.onrender.com`）

### 第 2 步：在 GitHub 仓库设置 API 地址

1. 打开 GitHub 仓库 → **Settings → Secrets and variables → Actions**
2. 点击 **New repository secret**，添加：
   - **Name**: `VITE_API_URL`
   - **Secret**: `https://yunqi-api-xxx.onrender.com`（第 1 步获得的地址，**不要末尾斜杠**）

### 第 3 步：推送代码触发自动部署

```bash
# 将代码推送到 main 分支
git push origin main
```

推送后：
- GitHub Actions 会自动构建客户点餐端 + 商家后台
- 构建完成后自动部署到 GitHub Pages
- 访问地址在仓库 **Settings → Pages** 中查看

### 第 4 步：首次登录

- **商家后台**：访问 `https://<用户名>.github.io/<仓库名>/admin/`
  - 默认账号：`admin` / `admin123`（首次启动自动创建）
  - 登录后请立即修改密码
- **客户点餐端**：访问 `https://<用户名>.github.io/<仓库名>/`

## 本地开发

```bash
# 安装所有依赖
npm run install:all

# 启动 API + 客户点餐 + 商家后台（3 个终端合并输出）
npm run dev

# 或分别启动
npm run dev:api       # http://localhost:4000
npm run dev:customer  # http://localhost:5173
npm run dev:merchant  # http://localhost:5174
```

## 常见问题

### 1. GitHub Pages 首次访问 404

- 确认仓库 → **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**
- 确认 Actions 工作流已成功运行并完成部署

### 2. 前端无法调用 API

- 检查 `VITE_API_URL` 是否设置正确（不要末尾斜杠）
- 检查 Render 后端服务是否正常运行（访问 `https://后端地址/health` 应返回 JSON）
- 修改 Secrets 后需要重新触发 Actions 部署才能生效

### 3. 数据库每次部署后重置（数据丢失）

- 必须在 Render 上配置 **Disk** 持久化磁盘
- 磁盘挂载路径必须与 `DATA_DIR` 环境变量一致

### 4. 自定义域名

- 在 GitHub Pages 设置中添加自定义域名（如 `order.example.com`）
- 将 `VITE_API_URL` 改为后端地址
- 在 DNS 服务商配置 CNAME 记录指向 `<用户名>.github.io`
