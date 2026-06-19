#!/bin/bash
# 一键部署脚本 - 将代码推送到 GitHub 并触发自动部署
# 使用方法: bash deploy.sh

set -e

REPO_URL="https://github.com/zzzhhsjjdddwd/-.git"
BRANCH="main"

echo "======================================"
echo "  云栖浅食 - GitHub Pages + Render 部署"
echo "======================================"
echo ""

# 检查 git 是否已初始化
if [ ! -d ".git" ]; then
    echo "[1/5] 初始化 Git 仓库..."
    git init -b $BRANCH
    git config user.email "deploy@yunqi.local"
    git config user.name "Deploy"
    git remote add origin $REPO_URL
else
    echo "[1/5] Git 仓库已存在，更新远程地址..."
    git remote set-url origin $REPO_URL
fi

# 提交所有代码
echo "[2/5] 提交代码..."
git add -A
git commit -m "feat: 云栖浅食 PWA 点餐套装 - 客户点餐 + 商家后台" || {
    echo "  (没有新内容需要提交)"
}

# 推送到 GitHub
echo "[3/5] 推送到 GitHub..."
echo ""
echo "  ⚠️  请在提示时输入你的 GitHub 用户名和密码/Token"
echo "  💡 如果你启用了 2FA，请使用 Personal Access Token 代替密码"
echo "  📖 获取 Token: GitHub → Settings → Developer settings → Personal access tokens"
echo ""
read -p "按 Enter 键继续..."

git push -u origin $BRANCH

echo ""
echo "[4/5] ✅ 代码已推送！"
echo ""
echo "======================================"
echo "  下一步：在 Render 上部署后端 API"
echo "======================================"
echo ""
echo "1. 访问 https://render.com 并登录 GitHub"
echo "2. 点击 'New +' → 'Web Service'"
echo "3. 选择仓库 'zzzhhsjjdddwd/-'"
echo "4. 配置："
echo "   - Name: yunqi-api"
echo "   - Branch: main"
echo "   - Build Command: cd api && npm install && npm run build"
echo "   - Start Command: cd api && npm start"
echo "   - Plan: Free"
echo ""
echo "5. 点击 'Advanced' → 'Add Environment Variable':"
echo "   - NODE_ENV = production"
echo "   - PORT = 10000"
echo ""
echo "6. 点击 'Create Web Service'"
echo ""
echo "7. 等待部署完成，复制显示的 URL (如 https://yunqi-api-xxx.onrender.com)"
echo ""
echo "[5/5] 在 GitHub 仓库设置 API 地址:"
echo "   仓库 → Settings → Secrets and variables → Actions → New repository secret"
echo "   - Name: VITE_API_URL"
echo "   - Secret: 你在第 7 步复制的 URL (不要末尾斜杠)"
echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "访问地址:"
echo "  客户点餐: https://zzzhhsjjdddwd.github.io/-/"
echo "  商家后台: https://zzzhhsjjdddwd.github.io/-/admin/"
echo ""
echo "默认账号: admin / admin123"
echo ""
