# GitHub 部署文件清单

## ✅ 必须上传的文件

### 🔧 项目配置文件
- `package.json` - 项目依赖和脚本
- `pnpm-lock.yaml` - 锁定依赖版本
- `tsconfig.json` - TypeScript 配置
- `next.config.js` - Next.js 配置
- `eslint.config.js` - ESLint 配置
- `postcss.config.js` - PostCSS 配置
- `prettier.config.js` - Prettier 配置
- `tailwind.config.js` - Tailwind CSS 配置（如果有）

### 🐳 部署配置文件（重要！）
- `Dockerfile` - Docker 镜像构建
- `docker-compose.yml` - 容器编排
- `.dockerignore` - Docker 忽略文件
- `deployment/` 整个目录
  - `deploy.sh` - 自动部署脚本
  - `quick-deploy.sh` - 快速更新脚本
  - `ecosystem.config.js` - PM2 配置
  - `nginx.conf` - Nginx 配置
  - `env.production.example` - 环境变量模板
  - `README.md` - 部署指南

### 🗄️ 数据库文件
- `prisma/schema.prisma` - 数据库模式
- `prisma/migrations/` - 数据库迁移文件（整个目录）
- `prisma/seed.ts` 及相关种子文件 - 初始数据

### 📁 源代码
- `src/` 整个目录 - 所有源代码
- `public/favicon.ico` - 网站图标

## ❌ 不要上传的文件

### 🔒 敏感文件
- `.env` - 环境变量（包含敏感信息）
- `.env.local` - 本地环境变量
- `.env.production` - 生产环境变量（包含密钥）

### 📦 构建产物
- `node_modules/` - 依赖包
- `.next/` - Next.js 构建输出
- `build/` - 构建目录
- `dist/` - 分发目录
- `*.tsbuildinfo` - TypeScript 构建信息

### 🗃️ 数据库数据
- `prisma/db.sqlite` - 开发数据库
- `prisma/prod.db` - 生产数据库

### 📤 用户上传文件
- `public/uploads/` - 用户上传的文件

### 🔧 IDE 和系统文件
- `.vscode/` - VS Code 配置
- `.idea/` - IntelliJ IDEA 配置
- `.DS_Store` - macOS 系统文件
- `Thumbs.db` - Windows 系统文件

## 🚀 部署前检查清单

1. ✅ 确保 `deployment/env.production.example` 包含所有必要的环境变量
2. ✅ 检查 `prisma/migrations/` 目录包含所有迁移文件
3. ✅ 确认 `deployment/deploy.sh` 有执行权限
4. ✅ 验证 `Dockerfile` 和 `docker-compose.yml` 配置正确
5. ✅ 检查 `.gitignore` 正确排除敏感文件

## 📋 Git 命令示例

```bash
# 添加所有必要文件
git add package.json pnpm-lock.yaml tsconfig.json next.config.js
git add Dockerfile docker-compose.yml .dockerignore
git add deployment/
git add prisma/schema.prisma prisma/migrations/ prisma/seed.ts
git add src/ public/favicon.ico
git add README.md

# 提交更改
git commit -m "feat: 添加完整部署配置"

# 推送到 GitHub
git push origin main
```

## 🔄 部署后在服务器上的操作

1. 克隆仓库：`git clone https://github.com/yourusername/your-repo.git`
2. 复制环境配置：`cp deployment/env.production.example .env.production`
3. 编辑环境变量：`nano .env.production`
4. 运行部署脚本：`./deployment/deploy.sh docker`

## ⚠️ 重要提醒

- **绝对不要**将包含真实密钥的 `.env` 文件上传到 GitHub
- **务必**将 `deployment/env.production.example` 上传，作为配置模板
- **确保**所有脚本文件有正确的执行权限
- **建议**在 GitHub 设置私有仓库以保护代码安全
