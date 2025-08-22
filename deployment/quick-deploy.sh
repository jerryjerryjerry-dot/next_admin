#!/bin/bash

# 快速部署脚本 - 适用于已配置好的服务器
# 使用方法: ./quick-deploy.sh

set -e

APP_NAME="my-t3-app"
DEPLOY_DIR="/var/www/$APP_NAME"

echo "🚀 快速更新部署..."

# 颜色定义
GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# 进入部署目录
cd $DEPLOY_DIR

# 拉取最新代码
log_info "拉取最新代码..."
git pull origin main

# 检查是否使用 Docker
if [ -f "docker-compose.yml" ]; then
    log_info "使用 Docker 更新..."
    
    # 重新构建并启动
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    # 等待服务启动
    sleep 20
    
    # 运行数据库迁移
    docker-compose exec app npx prisma migrate deploy
    
else
    log_info "使用 PM2 更新..."
    
    # 安装新依赖
    pnpm install --frozen-lockfile
    
    # 重新生成 Prisma 客户端
    pnpm db:generate
    
    # 重新构建
    pnpm build
    
    # 运行数据库迁移
    pnpm db:migrate:deploy
    
    # 重启 PM2
    pm2 restart $APP_NAME
fi

# 健康检查
log_info "执行健康检查..."
sleep 10

if curl -f http://localhost:3000/api/status > /dev/null 2>&1; then
    log_info "✅ 更新完成，应用运行正常!"
else
    log_info "❌ 健康检查失败，请检查日志"
    exit 1
fi

log_info "🎉 快速部署完成!"
