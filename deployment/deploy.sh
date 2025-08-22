#!/bin/bash

# 阿里云服务器部署脚本
# 使用方法: ./deploy.sh [docker|pm2]

set -e

DEPLOY_METHOD=${1:-docker}
APP_NAME="my-t3-app"
DEPLOY_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"

echo "🚀 开始部署 $APP_NAME (方式: $DEPLOY_METHOD)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要 root 权限运行"
        exit 1
    fi
}

# 安装系统依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    # 更新系统
    apt update && apt upgrade -y
    
    # 安装基础工具
    apt install -y curl wget git unzip nginx
    
    if [[ "$DEPLOY_METHOD" == "docker" ]]; then
        # 安装 Docker
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            systemctl enable docker
            systemctl start docker
        fi
        
        # 安装 Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
    else
        # 安装 Node.js
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            apt install -y nodejs
        fi
        
        # 安装 pnpm
        npm install -g pnpm@latest
        
        # 安装 PM2
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
            pm2 startup
        fi
    fi
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."
    mkdir -p $DEPLOY_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /var/log/nginx
    mkdir -p /var/log/pm2
    mkdir -p /var/www/uploads
    chown -R www-data:www-data /var/www/uploads
}

# 备份现有部署
backup_current() {
    if [ -d "$DEPLOY_DIR" ]; then
        log_info "备份当前部署..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        cp -r $DEPLOY_DIR $BACKUP_DIR/$BACKUP_NAME
        log_info "备份保存到: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# 克隆或更新代码
deploy_code() {
    log_info "部署代码..."
    
    if [ ! -d "$DEPLOY_DIR/.git" ]; then
        log_info "克隆代码库..."
        # 替换为你的实际 Git 仓库地址
        git clone https://github.com/yourusername/your-repo.git $DEPLOY_DIR
    else
        log_info "更新代码..."
        cd $DEPLOY_DIR
        git pull origin main
    fi
    
    cd $DEPLOY_DIR
}

# Docker 部署
deploy_with_docker() {
    log_info "使用 Docker 部署..."
    
    # 复制环境配置
    if [ ! -f ".env.production" ]; then
        cp deployment/env.production.example .env.production
        log_warn "请编辑 .env.production 文件配置环境变量"
    fi
    
    # 构建和启动服务
    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 运行数据库迁移
    docker-compose exec app npx prisma migrate deploy
    
    log_info "Docker 部署完成!"
}

# PM2 部署
deploy_with_pm2() {
    log_info "使用 PM2 部署..."
    
    # 安装依赖
    pnpm install --frozen-lockfile
    
    # 生成 Prisma 客户端
    pnpm db:generate
    
    # 构建应用
    pnpm build
    
    # 运行数据库迁移
    pnpm db:migrate:deploy
    
    # 启动 PM2
    pm2 delete $APP_NAME || true
    pm2 start deployment/ecosystem.config.js --env production
    pm2 save
    
    log_info "PM2 部署完成!"
}

# 配置 Nginx
configure_nginx() {
    log_info "配置 Nginx..."
    
    # 复制 Nginx 配置
    cp deployment/nginx.conf /etc/nginx/sites-available/$APP_NAME
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    
    # 重启 Nginx
    systemctl reload nginx
    systemctl enable nginx
    
    log_info "Nginx 配置完成!"
}

# 设置防火墙
setup_firewall() {
    log_info "配置防火墙..."
    
    # 安装 ufw
    apt install -y ufw
    
    # 基础规则
    ufw default deny incoming
    ufw default allow outgoing
    
    # 允许必要端口
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # 启用防火墙
    ufw --force enable
    
    log_info "防火墙配置完成!"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    sleep 10
    
    if curl -f http://localhost:3000/api/status > /dev/null 2>&1; then
        log_info "✅ 应用健康检查通过!"
    else
        log_error "❌ 应用健康检查失败!"
        exit 1
    fi
}

# 主部署流程
main() {
    check_root
    install_dependencies
    create_directories
    backup_current
    deploy_code
    
    if [[ "$DEPLOY_METHOD" == "docker" ]]; then
        deploy_with_docker
    else
        deploy_with_pm2
    fi
    
    configure_nginx
    setup_firewall
    health_check
    
    log_info "🎉 部署完成!"
    log_info "应用访问地址: http://your-domain.com"
    log_info "请确保配置域名解析和 SSL 证书"
}

# 执行主流程
main "$@"
