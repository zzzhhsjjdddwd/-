// 构建 GitHub Pages 部署产物
// 将客户点餐端、商家后台构建产物合并到 dist/ 目录
// 客户点餐端：dist/ 根
// 商家后台：dist/admin/
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const API_URL = process.env.VITE_API_URL || ''; // 例如 https://yunqi-api.onrender.com
const REPO_NAME = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';

console.log('> 环境变量：');
console.log('  VITE_API_URL =', API_URL || '(空，开发态代理)');
console.log('  GITHUB_REPOSITORY =', process.env.GITHUB_REPOSITORY || '(本地)');
console.log('  REPO_NAME =', REPO_NAME || '(本地)');

// 1. 清理
const distDir = join(root, 'dist');
if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

// 2. 构建客户点餐端（根路径）
const base = REPO_NAME ? `/${REPO_NAME}/` : '/';
console.log(`\n> 构建客户点餐端 (base: ${base})`);
execSync(`npm run build`, {
  cwd: join(root, 'apps', 'customer'),
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE: base, VITE_API_URL: API_URL },
});

// 3. 构建商家后台（/admin/ 子路径）
const adminBase = REPO_NAME ? `/${REPO_NAME}/admin/` : '/admin/';
console.log(`\n> 构建商家后台 (base: ${adminBase})`);
execSync(`npm run build`, {
  cwd: join(root, 'apps', 'merchant'),
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE: adminBase, VITE_API_URL: API_URL },
});

// 4. 合并到 dist/
console.log('\n> 合并构建产物到 dist/');
cpSync(join(root, 'apps', 'customer', 'dist'), distDir, { recursive: true });
mkdirSync(join(distDir, 'admin'), { recursive: true });
cpSync(join(root, 'apps', 'merchant', 'dist'), join(distDir, 'admin'), { recursive: true });

// 5. 添加 .nojekyll（GitHub Pages 需要，防止 _ 开头文件被忽略）
writeFileSync(join(distDir, '.nojekyll'), '');

// 6. 添加 index.html 自动跳转（访问根路径跳转到客户点餐端）
const rootIndex = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${base}">
<title>云栖浅食</title></head><body>
<a href="${base}">进入客户点餐</a> · <a href="${adminBase}">商家后台</a>
</body></html>`;
writeFileSync(join(distDir, 'index.html'), rootIndex);

console.log('\n✅ 构建完成');
console.log('   客户点餐端：', base);
console.log('   商家后台：  ', adminBase);
console.log('   输出目录： ', distDir);
