# 云栖浅食 - 5分钟部署指南

## 你需要准备的东西
1. GitHub 账号 ✅
2. Render 账号（用 GitHub 登录）✅
3. 10分钟时间 ⏱️

---

## 第一步：在本地运行部署脚本（1分钟）

打开终端，运行：

```bash
cd /workspace
bash deploy.sh
```

按照提示输入 GitHub 用户名和密码（或 Personal Access Token）。

> 💡 如果你没有 Token，看这里：
> 1. 打开 https://github.com/settings/tokens
> 2. 点击 "Generate new token (classic)"
> 3. 勾选 "repo" 权限
> 4. 生成后复制 Token 作为密码使用

---

## 第二步：在 Render 部署后端 API（3分钟）

### 2.1 创建 Render 账号
1. 打开 https://render.com
2. 点击 "Get Started" → "GitHub" 用 GitHub 登录

### 2.2 创建 Web Service
1. 点击左上角 **"New +"** → **"Web Service"**
2. 在 "Connect a repository" 页面找到你的仓库 `zzzhhsjjdddwd/-`
3. 点击右边的 **"Connect"**

### 2.3 配置服务
填写以下配置：

```
Name:           yunqi-api
Region:         Singapore (或离你最近的)
Branch:         main
Root Directory: (留空)

Build Command:  cd api && npm install && npm run build
Start Command:  cd api && npm start

Plan:           Free
```

### 2.4 添加环境变量
点击 **"Advanced"** → **"Add Environment Variable"**，添加：

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| PORT | 10000 |

### 2.5 部署
点击 **"Create Web Service"**

等待 2-3 分钟，看到绿色 ✅ "Healthy" 即部署成功！

**复制显示的 URL**，例如：`https://yunqi-api-abc1.onrender.com`

---

## 第三步：配置 GitHub Secret（1分钟）

### 3.1 设置 VITE_API_URL
1. 打开你的 GitHub 仓库：https://github.com/zzzhhsjjdddwd/-/settings/secrets/actions
2. 点击 **"New repository secret"**
3. 填写：
   - **Name**: `VITE_API_URL`
   - **Secret**: 你在第二步复制的 URL（**不要末尾斜杠**）
     例如：`https://yunqi-api-abc1.onrender.com`
4. 点击 **"Add secret"**

### 3.2 手动触发部署
1. 打开仓库的 Actions 页面：https://github.com/zzzhhsjjdddwd/-/actions
2. 点击左侧 "Deploy to GitHub Pages"
3. 点击右侧 "Run workflow" → "Run workflow"
4. 等待 1-2 分钟，刷新页面确认 ✅

---

## 第四步：开启 GitHub Pages（1分钟）

1. 打开 https://github.com/zzzhhsjjdddwd/-/settings/pages
2. 在 "Build and deployment" 部分：
   - Source: 选 **"GitHub Actions"**
3. 点击 **"Save"**

---

## 部署完成！🎉

访问你的网站：

| 应用 | 地址 |
|-----|-----|
| **客户点餐端** | https://zzzhhsjjdddwd.github.io/-/ |
| **商家后台** | https://zzzhhsjjdddwd.github.io/-/admin/ |

**商家后台默认账号**：`admin` / `admin123`

---

## 常见问题

### Q: 部署失败怎么办？
A: 点击 Actions 页面查看错误详情，常见问题：
- API_URL 格式错误（检查是否有多余的斜杠）
- Render 服务未启动（检查 Render 日志）

### Q: 客户点餐端显示"无法连接服务器"？
A: 检查 VITE_API_URL 是否正确配置，确认 Render 服务状态是 ✅

### Q: 如何自定义域名？
A: GitHub Pages 设置中添加域名，Render 后端也需要配置自定义域名

### Q: 数据会丢失吗？
A: 只要 Render 的 Disk 配置正确，数据会持久化。如果没配 Disk，每次部署数据会重置。

---

## 恭喜！你的云栖浅食点餐系统已上线！ 🚀
