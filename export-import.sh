#!/bin/bash

# Docker镜像导出导入脚本
set -e

IMAGE_NAME="t3-app"
TAR_FILE="t3-app-image.tar"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 导出镜像
export_image() {
    print_step "导出Docker镜像..."
    
    # 构建镜像（如果不存在）
    if ! docker images | grep -q "^$IMAGE_NAME "; then
        print_step "构建镜像..."
        docker build -t $IMAGE_NAME .
    fi
    
    # 导出镜像
    docker save -o $TAR_FILE $IMAGE_NAME
    
    print_info "✅ 镜像已导出到: $TAR_FILE"
    print_info "📦 文件大小: $(du -h $TAR_FILE | cut -f1)"
    
    echo ""
    echo "🚀 传输镜像到服务器:"
    echo "   scp $TAR_FILE user@server-ip:/home/user/"
    echo ""
    echo "🐳 在服务器上导入镜像:"
    echo "   docker load -i $TAR_FILE"
    echo ""
}

# 导入镜像
import_image() {
    if [ ! -f "$TAR_FILE" ]; then
        echo "❌ 镜像文件 $TAR_FILE 不存在"
        exit 1
    fi
    
    print_step "导入Docker镜像..."
    docker load -i $TAR_FILE
    
    print_info "✅ 镜像导入完成"
    print_info "🔍 可用镜像:"
    docker images | grep $IMAGE_NAME || echo "无匹配镜像"
}

# 主函数
case "${1:-}" in
    "export")
        export_image
        ;;
    "import")
        import_image
        ;;
    *)
        echo "Docker镜像导出导入工具"
        echo ""
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  export    导出镜像为tar文件"
        echo "  import    从tar文件导入镜像"
        echo ""
        echo "默认导出镜像..."
        export_image
        ;;
esac
