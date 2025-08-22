#!/bin/bash

# 开发环境启动脚本
set -e

echo "🛠️ 启动开发环境..."

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install --frozen-lockfile
fi

# 生成 Prisma 客户端
echo "🗄️ 生成数据库客户端..."
pnpm db:generate

# 检查数据库
if [ ! -f "prisma/db.sqlite" ]; then
    echo "🗄️ 初始化数据库..."
    pnpm db:push
    pnpm db:seed
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
pnpm dev



