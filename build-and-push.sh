#!/bin/bash

# Docker镜像构建和推送脚本
set -e

# 配置
if [ -z "$1" ]; then
    read -p "请输入你的Docker Hub用户名: " DOCKER_USERNAME
else
    DOCKER_USERNAME="$1"
fi

IMAGE_NAME="$DOCKER_USERNAME/t3-app"
VERSION="latest"
DOCKERFILE="Dockerfile"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 标记现有镜像
tag_existing_image() {
    print_step "标记现有镜像..."
    
    # 使用现有的 new-app-app:latest 镜像
    LOCAL_IMAGE="new-app-app:latest"
    
    if ! docker images | grep -q "^new-app-app "; then
        print_warning "本地镜像 $LOCAL_IMAGE 不存在，开始构建..."
        docker build -t $LOCAL_IMAGE .
    fi
    
    # 给现有镜像打上新标签
    docker tag $LOCAL_IMAGE $IMAGE_NAME:$VERSION
    echo "✅ 镜像标记完成: $LOCAL_IMAGE -> $IMAGE_NAME:$VERSION"
}

# 构建镜像（备用方法）
build_image() {
    print_step "构建Docker镜像..."
    docker build -t $IMAGE_NAME:$VERSION .
    echo "✅ 镜像构建完成: $IMAGE_NAME:$VERSION"
}

# 登录Docker Hub
docker_login() {
    print_step "登录Docker Hub..."
    print_warning "请输入你的Docker Hub用户名和密码"
    docker login
    echo "✅ Docker Hub登录成功"
}

# 推送镜像
push_image() {
    print_step "推送镜像到Docker Hub..."
    docker push $IMAGE_NAME:$VERSION
    echo "✅ 镜像推送完成"
    echo "📦 镜像地址: $IMAGE_NAME:$VERSION"
}

# 显示使用说明
show_usage() {
    echo ""
    echo "🎉 镜像构建和推送完成！"
    echo ""
    echo "在任何服务器上使用这个镜像："
    echo ""
    echo "1. 创建 docker-compose.yml:"
    echo "   version: '3.8'"
    echo "   services:"
    echo "     app:"
    echo "       image: $IMAGE_NAME:$VERSION"
    echo "       ports:"
    echo "         - \"3000:3000\""
    echo "       environment:"
    echo "         - NODE_ENV=production"
    echo "       volumes:"
    echo "         - ./data:/app/prisma"
    echo ""
    echo "2. 启动应用:"
    echo "   docker-compose up -d"
    echo ""
}

# 主函数
main() {
    case "${1:-}" in
        "build")
            build_image
            ;;
        "tag")
            tag_existing_image
            ;;
        "push")
            docker_login
            push_image
            ;;
        "all")
            tag_existing_image
            docker_login
            push_image
            show_usage
            ;;
        *)
            echo "Docker镜像构建和推送工具"
            echo ""
            echo "用法: $0 [选项] [docker-hub-username]"
            echo ""
            echo "选项:"
            echo "  tag       标记现有镜像"
            echo "  build     重新构建镜像"
            echo "  push      仅推送镜像"
            echo "  all       标记并推送镜像 (默认)"
            echo ""
            echo "示例:"
            echo "  $0 all myusername    # 使用指定用户名"
            echo "  $0                   # 交互式输入用户名"
            echo ""
            
            # 默认执行完整流程 - 使用现有镜像
            tag_existing_image
            docker_login
            push_image
            show_usage
            ;;
    esac
}

main "$@"
