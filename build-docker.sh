#!/bin/bash

# Docker 构建脚本
set -e

echo "🐳 开始构建 Docker 镜像..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否运行
check_docker() {
    log_info "检查 Docker 状态..."
    
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未启动！请先启动 Docker Desktop"
        log_warn "1. 在开始菜单搜索 'Docker Desktop'"
        log_warn "2. 双击启动，等待图标变绿"
        log_warn "3. 重新运行此脚本"
        exit 1
    fi
    
    log_info "✅ Docker 运行正常"
}

# 清理旧镜像
cleanup_old() {
    log_info "清理旧镜像..."
    docker rmi my-t3-app:latest 2>/dev/null || true
    docker system prune -f
}

# 构建镜像
build_image() {
    log_info "开始构建镜像..."
    log_warn "这可能需要 5-10 分钟，请耐心等待..."
    
    # 显示构建进度
    docker build -t my-t3-app:latest . --progress=plain
    
    if [ $? -eq 0 ]; then
        log_info "✅ 镜像构建成功！"
    else
        log_error "❌ 镜像构建失败"
        exit 1
    fi
}

# 查看镜像信息
show_image_info() {
    log_info "镜像信息："
    docker images my-t3-app:latest
    
    log_info "镜像大小：$(docker images my-t3-app:latest --format "{{.Size}}")"
    
    # 获取镜像详细信息
    CREATED=$(docker images my-t3-app:latest --format "{{.CreatedAt}}")
    log_info "创建时间：$CREATED"
}

# 测试镜像
test_image() {
    log_info "测试镜像..."
    
    # 停止可能存在的容器
    docker stop my-t3-app-test 2>/dev/null || true
    docker rm my-t3-app-test 2>/dev/null || true
    
    # 启动测试容器
    log_info "启动测试容器..."
    docker run -d --name my-t3-app-test -p 3001:3000 my-t3-app:latest
    
    # 等待启动
    log_info "等待应用启动（30秒）..."
    sleep 30
    
    # 健康检查
    if curl -f http://localhost:3001/api/status > /dev/null 2>&1; then
        log_info "✅ 应用启动成功！"
        log_info "🌐 测试地址: http://localhost:3001"
    else
        log_warn "⚠️  应用可能还在启动中..."
        log_info "📋 查看日志: docker logs my-t3-app-test"
    fi
    
    # 显示容器状态
    docker ps -f name=my-t3-app-test
}

# 使用说明
show_usage() {
    log_info "🎉 Docker 镜像构建完成！"
    echo ""
    log_info "📋 常用命令："
    echo "  🚀 启动应用: docker run -d -p 3000:3000 --name my-t3-app my-t3-app:latest"
    echo "  📊 查看状态: docker ps"
    echo "  📋 查看日志: docker logs my-t3-app"
    echo "  🛑 停止应用: docker stop my-t3-app"
    echo "  🗑️  删除容器: docker rm my-t3-app"
    echo ""
    log_info "🐳 Docker Compose:"
    echo "  🚀 启动服务: docker-compose up -d"
    echo "  🛑 停止服务: docker-compose down"
    echo ""
    log_info "🔧 清理测试容器:"
    echo "  docker stop my-t3-app-test && docker rm my-t3-app-test"
}

# 主执行流程
main() {
    log_info "🚀 开始 Docker 构建流程..."
    
    check_docker
    cleanup_old
    build_image
    show_image_info
    
    # 询问是否测试
    read -p "是否测试镜像？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_image
    fi
    
    show_usage
    
    log_info "✨ 构建流程完成！"
}

# 执行主流程
main "$@"



