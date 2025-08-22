#!/bin/bash

# PM2 专用部署脚本 - 追求极致性能
set -e

echo "🚀 PM2 高性能部署开始..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 检查 Node.js 版本
check_node() {
    if ! command -v node &> /dev/null; then
        log_warn "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_warn "Node.js 版本过低，建议使用 18+，当前版本：$(node -v)"
    else
        log_info "Node.js 版本检查通过：$(node -v)"
    fi
}

# 安装 PM2
install_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_info "安装 PM2..."
        npm install -g pm2
        pm2 startup
        log_info "PM2 安装完成"
    else
        log_info "PM2 已安装：$(pm2 -v)"
    fi
}

# 优化系统设置
optimize_system() {
    log_info "优化系统设置..."
    
    # 增加文件描述符限制
    echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
    echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf
    
    # 优化内核参数
    echo "net.core.somaxconn = 65535" | sudo tee -a /etc/sysctl.conf
    echo "net.ipv4.tcp_max_syn_backlog = 65535" | sudo tee -a /etc/sysctl.conf
    
    sudo sysctl -p
}

# 项目构建
build_project() {
    log_info "构建项目..."
    
    # 清理缓存
    rm -rf .next node_modules/.cache
    
    # 安装依赖
    log_info "安装所有依赖..."
    pnpm install --frozen-lockfile
    
    # 生成 Prisma 客户端
    log_info "生成数据库客户端..."
    pnpm db:generate
    
    # 构建项目
    log_info "构建应用..."
    pnpm build
    
    log_info "构建完成！"
}

# 数据库设置
setup_database() {
    log_info "设置数据库..."
    
    # 运行迁移
    pnpm db:migrate:deploy
    
    # 如果是首次部署，运行种子数据
    if [ ! -f "prisma/prod.db" ]; then
        log_info "首次部署，初始化数据..."
        pnpm db:seed
    fi
}

# PM2 配置优化
create_pm2_config() {
    log_info "创建 PM2 优化配置..."
    
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'my-t3-app',
    script: 'pnpm',
    args: 'start',
    instances: 'max', // 使用所有 CPU 核心
    exec_mode: 'cluster',
    
    // 环境变量
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'file:./prisma/prod.db'
    },
    
    // 性能优化
    node_args: [
      '--max-old-space-size=2048', // 增加内存限制
      '--optimize-for-size'         // 优化内存使用
    ],
    
    // 自动重启配置
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // 日志配置
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 监控配置
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    
    // 优雅关闭
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000
  }]
};
EOF
}

# 启动服务
start_service() {
    log_info "启动 PM2 服务..."
    
    # 创建日志目录
    mkdir -p logs
    
    # 停止旧服务
    pm2 delete my-t3-app 2>/dev/null || true
    
    # 启动新服务
    pm2 start ecosystem.config.js --env production
    
    # 保存 PM2 配置
    pm2 save
    
    # 显示状态
    pm2 status
    pm2 monit --no-daemon &
    
    log_info "服务启动完成！"
}

# 性能测试
performance_test() {
    log_info "等待服务启动..."
    sleep 10
    
    log_info "执行性能测试..."
    
    # 检查服务是否正常
    if curl -f http://localhost:3000/api/status > /dev/null 2>&1; then
        log_info "✅ 服务运行正常"
        
        # 简单性能测试
        echo "🔥 性能测试结果："
        curl -w "响应时间: %{time_total}s\n" -s -o /dev/null http://localhost:3000
        
        # 显示系统资源使用
        echo "💻 系统资源使用："
        pm2 show my-t3-app
        
    else
        log_warn "❌ 服务启动失败，请检查日志"
        pm2 logs my-t3-app --lines 50
        exit 1
    fi
}

# 主执行流程
main() {
    log_info "开始 PM2 高性能部署..."
    
    check_node
    install_pm2
    
    # 如果是生产服务器，优化系统设置
    if [ "$1" = "--optimize" ]; then
        optimize_system
    fi
    
    build_project
    setup_database
    create_pm2_config
    start_service
    performance_test
    
    echo ""
    log_info "🎉 PM2 部署完成！"
    log_info "🌐 访问地址: http://localhost:3000"
    log_info "📊 监控面板: pm2 monit"
    log_info "📋 查看日志: pm2 logs my-t3-app"
    log_info "🔄 重启服务: pm2 restart my-t3-app"
    log_info "⚡ 重载服务: pm2 reload my-t3-app"
}

# 执行主流程
main "$@"



