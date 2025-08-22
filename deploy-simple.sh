#!/bin/bash

# 一键部署脚本 - 简化版
set -e

echo "🚀 开始一键部署..."

# 检查 Docker
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 使用 Docker 部署..."
    
    # 创建必要目录
    mkdir -p data uploads
    
    # 设置环境变量（如果不存在）
    if [ ! -f ".env" ]; then
        echo "📝 创建环境变量文件..."
        cat > .env << EOF
ENCRYPTION_KEY=your-32-character-encryption-key-here
DATABASE_URL=file:./prod.db
NODE_ENV=production
EOF
        echo "⚠️  请编辑 .env 文件设置正确的环境变量"
    fi
    
    # 构建并启动
    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d
    
    echo "⏳ 等待服务启动..."
    sleep 30
    
    # 运行数据库迁移
    docker-compose exec -T app npm run db:migrate:deploy || echo "数据库迁移可能已完成"
    
    echo "✅ Docker 部署完成!"
    echo "🌐 访问地址: http://localhost:3000"
    
else
    echo "📦 使用 Node.js 直接部署..."
    
    # 安装依赖
    pnpm install --frozen-lockfile
    
    # 生成数据库客户端
    pnpm db:generate
    
    # 运行数据库迁移
    pnpm db:migrate:deploy
    
    # 构建项目
    pnpm build
    
    echo "✅ 构建完成!"
    echo "🚀 启动服务器: pnpm start"
    echo "🌐 访问地址: http://localhost:3000"
fi

echo "🎉 部署完成!"
