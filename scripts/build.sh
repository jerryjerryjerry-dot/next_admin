#!/bin/bash

# 简洁的构建脚本
set -e

echo "🚀 开始构建项目..."

# 清理之前的构建
echo "🧹 清理构建缓存..."
rm -rf .next
rm -rf dist
rm -rf out

# 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 生成 Prisma 客户端
echo "🗄️ 生成数据库客户端..."
pnpm db:generate

# 构建项目
echo "🏗️ 构建应用..."
pnpm build

echo "✅ 构建完成!"
echo "💡 使用 pnpm start 启动生产服务器"



