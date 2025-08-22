#!/bin/bash

# T3应用生产环境部署脚本
set -e

echo "🚀 开始部署T3应用到生产环境..."

# 配置变量
APP_NAME="t3-app"
DOMAIN="yourdomain.com"
EMAIL="your-email@domain.com"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    print_step "检查Docker环境..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    echo "✅ Docker环境正常"
}

# 创建必要目录
create_directories() {
    print_step "创建必要目录..."
    mkdir -p data/database
    mkdir -p data/uploads
    mkdir -p ssl
    mkdir -p logs
    echo "✅ 目录创建完成"
}

# 环境配置
setup_environment() {
    print_step "配置环境变量..."
    
    if [ ! -f .env.production ]; then
        print_warning "创建生产环境配置文件..."
        cat > .env.production << EOF
# 生产环境配置
NODE_ENV=production
DATABASE_URL=file:./prod.db

# NextAuth配置
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://${DOMAIN}

# 数据库配置
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# 其他配置
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
EOF
        print_warning "⚠️  请编辑 .env.production 文件配置你的域名和其他设置"
    fi
    
    echo "✅ 环境配置完成"
}

# SSL证书设置
setup_ssl() {
    print_step "设置SSL证书..."
    
    if [ ! -f ssl/fullchain.pem ] || [ ! -f ssl/privkey.pem ]; then
        print_warning "SSL证书不存在，请选择设置方式："
        echo "1) 使用Let's Encrypt自动获取"
        echo "2) 手动上传证书文件"
        echo "3) 跳过SSL配置（使用HTTP）"
        read -p "请选择 (1-3): " ssl_choice
        
        case $ssl_choice in
            1)
                setup_letsencrypt
                ;;
            2)
                print_warning "请将SSL证书文件放置到以下位置："
                echo "  - ssl/fullchain.pem (完整证书链)"
                echo "  - ssl/privkey.pem (私钥文件)"
                read -p "文件已放置，按回车继续..."
                ;;
            3)
                print_warning "跳过SSL配置，将使用HTTP部署"
                use_http_config
                ;;
        esac
    fi
}

# Let's Encrypt设置
setup_letsencrypt() {
    print_step "配置Let's Encrypt..."
    
    # 创建certbot配置
    cat > docker-compose.certbot.yml << EOF
version: '3.8'
services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./ssl:/etc/letsencrypt
      - ./data/certbot:/var/www/certbot
    command: certonly --webroot -w /var/www/certbot --email ${EMAIL} --agree-tos --no-eff-email -d ${DOMAIN}
EOF
    
    print_warning "即将获取SSL证书，请确保："
    echo "1. 域名 ${DOMAIN} 已正确解析到此服务器"
    echo "2. 80端口可以访问"
    read -p "确认后按回车继续..."
    
    docker-compose -f docker-compose.certbot.yml run --rm certbot
    
    # 复制证书到ssl目录
    cp ssl/live/${DOMAIN}/fullchain.pem ssl/
    cp ssl/live/${DOMAIN}/privkey.pem ssl/
    
    echo "✅ SSL证书获取完成"
}

# HTTP配置
use_http_config() {
    cp deployment/nginx-simple.conf deployment/nginx.prod.conf
    sed -i 's/443 ssl/80/g' docker-compose.prod.yml
    sed -i '/ssl_/d' deployment/nginx.prod.conf
}

# 数据库初始化
init_database() {
    print_step "初始化数据库..."
    
    if [ ! -f data/database/prod.db ]; then
        print_warning "首次部署，初始化数据库..."
        
        # 临时启动容器进行数据库迁移
        docker-compose -f docker-compose.prod.yml up -d app
        sleep 10
        
        # 运行数据库迁移
        docker-compose -f docker-compose.prod.yml exec app pnpm prisma db push
        
        # 可选：运行种子数据
        read -p "是否初始化种子数据？(y/n): " init_seed
        if [ "$init_seed" = "y" ]; then
            docker-compose -f docker-compose.prod.yml exec app pnpm db:seed:simple
        fi
        
        docker-compose -f docker-compose.prod.yml down
    fi
    
    echo "✅ 数据库初始化完成"
}

# 部署应用
deploy_app() {
    print_step "部署应用..."
    
    # 构建并启动服务
    docker-compose -f docker-compose.prod.yml up --build -d
    
    # 等待服务启动
    print_step "等待服务启动..."
    sleep 20
    
    # 健康检查
    if curl -f http://localhost:3000/api/status > /dev/null 2>&1; then
        echo "✅ 应用部署成功！"
        echo "🌐 访问地址: https://${DOMAIN}"
    else
        print_error "应用启动失败，请检查日志"
        docker-compose -f docker-compose.prod.yml logs app
        exit 1
    fi
}

# 显示部署信息
show_info() {
    print_step "部署完成信息:"
    echo "📱 应用名称: ${APP_NAME}"
    echo "🌐 访问地址: https://${DOMAIN}"
    echo "📊 监控命令: docker-compose -f docker-compose.prod.yml logs -f"
    echo "🔄 重启命令: docker-compose -f docker-compose.prod.yml restart"
    echo "🛑 停止命令: docker-compose -f docker-compose.prod.yml down"
    echo ""
    print_warning "重要提醒:"
    echo "1. 定期备份 data/ 目录"
    echo "2. 监控磁盘空间使用"
    echo "3. 定期更新SSL证书"
    echo "4. 查看应用日志排查问题"
}

# 主函数
main() {
    echo "🎯 T3应用生产环境部署脚本"
    echo "============================="
    
    check_docker
    create_directories
    setup_environment
    setup_ssl
    init_database
    deploy_app
    show_info
    
    print_step "🎉 部署完成！"
}

# 脚本参数处理
case "${1:-}" in
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "restart")
        docker-compose -f docker-compose.prod.yml restart
        ;;
    "stop")
        docker-compose -f docker-compose.prod.yml down
        ;;
    "status")
        docker-compose -f docker-compose.prod.yml ps
        ;;
    "update")
        print_step "更新应用..."
        docker-compose -f docker-compose.prod.yml up --build -d
        ;;
    *)
        main "$@"
        ;;
esac

