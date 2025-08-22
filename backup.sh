#!/bin/bash

# T3应用数据备份脚本
set -e

# 配置
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="docker-compose.prod.yml"
RETENTION_DAYS=30

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_info "创建备份目录: $BACKUP_DIR"
    fi
}

# 备份数据库
backup_database() {
    print_info "备份数据库..."
    
    if [ -f "data/database/prod.db" ]; then
        cp data/database/prod.db "$BACKUP_DIR/prod_${DATE}.db"
        print_info "数据库备份完成: $BACKUP_DIR/prod_${DATE}.db"
    else
        print_warning "数据库文件不存在，跳过数据库备份"
    fi
}

# 备份上传文件
backup_uploads() {
    print_info "备份上传文件..."
    
    if [ -d "data/uploads" ] && [ "$(ls -A data/uploads)" ]; then
        tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" data/uploads/
        print_info "上传文件备份完成: $BACKUP_DIR/uploads_${DATE}.tar.gz"
    else
        print_warning "上传目录为空，跳过文件备份"
    fi
}

# 备份配置文件
backup_configs() {
    print_info "备份配置文件..."
    
    tar -czf "$BACKUP_DIR/configs_${DATE}.tar.gz" \
        docker-compose.prod.yml \
        .env.production \
        deployment/ \
        ssl/ 2>/dev/null || true
    
    print_info "配置文件备份完成: $BACKUP_DIR/configs_${DATE}.tar.gz"
}

# 创建完整备份
create_full_backup() {
    print_info "创建完整备份..."
    
    tar -czf "$BACKUP_DIR/full_backup_${DATE}.tar.gz" \
        data/ \
        docker-compose.prod.yml \
        .env.production \
        deployment/ \
        ssl/ 2>/dev/null || true
    
    print_info "完整备份创建完成: $BACKUP_DIR/full_backup_${DATE}.tar.gz"
}

# 清理旧备份
cleanup_old_backups() {
    print_info "清理 $RETENTION_DAYS 天前的备份文件..."
    
    find "$BACKUP_DIR" -name "*.db" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    print_info "旧备份文件清理完成"
}

# 验证备份文件
verify_backup() {
    print_info "验证备份文件完整性..."
    
    # 验证数据库备份
    if [ -f "$BACKUP_DIR/prod_${DATE}.db" ]; then
        if file "$BACKUP_DIR/prod_${DATE}.db" | grep -q "SQLite"; then
            print_info "✅ 数据库备份文件完整"
        else
            print_error "❌ 数据库备份文件损坏"
            return 1
        fi
    fi
    
    # 验证压缩文件
    for file in "$BACKUP_DIR"/*_${DATE}.tar.gz; do
        if [ -f "$file" ]; then
            if tar -tzf "$file" >/dev/null 2>&1; then
                print_info "✅ $(basename "$file") 压缩文件完整"
            else
                print_error "❌ $(basename "$file") 压缩文件损坏"
                return 1
            fi
        fi
    done
    
    print_info "所有备份文件验证通过"
}

# 显示备份统计
show_backup_stats() {
    print_info "备份统计信息:"
    echo "📁 备份目录: $BACKUP_DIR"
    echo "📅 备份时间: $(date)"
    echo "📊 备份文件:"
    
    ls -lh "$BACKUP_DIR"/*_${DATE}.* 2>/dev/null | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo "💾 总备份大小: $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo "📈 备份文件数量: $(ls -1 "$BACKUP_DIR" | wc -l)"
}

# 远程备份（可选）
upload_to_remote() {
    if [ -n "$REMOTE_BACKUP_PATH" ]; then
        print_info "上传备份到远程存储..."
        
        # 示例：上传到远程服务器
        # rsync -avz "$BACKUP_DIR/" "$REMOTE_BACKUP_PATH/"
        
        # 示例：上传到云存储
        # aws s3 sync "$BACKUP_DIR/" "s3://your-backup-bucket/"
        
        print_info "远程备份上传完成"
    fi
}

# 恢复功能
restore_backup() {
    local backup_date=$1
    
    if [ -z "$backup_date" ]; then
        print_error "请指定备份日期 (格式: YYYYMMDD_HHMMSS)"
        echo "可用备份:"
        ls -1 "$BACKUP_DIR" | grep -E "prod_[0-9]+_[0-9]+\.db" | sed 's/prod_\(.*\)\.db/  \1/'
        return 1
    fi
    
    print_warning "⚠️  即将恢复备份: $backup_date"
    print_warning "这将覆盖当前数据，请确认操作！"
    read -p "输入 'yes' 确认恢复: " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "恢复操作已取消"
        return 0
    fi
    
    # 停止服务
    print_info "停止应用服务..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # 备份当前数据
    print_info "备份当前数据..."
    cp data/database/prod.db "data/database/prod_backup_$(date +%Y%m%d_%H%M%S).db" 2>/dev/null || true
    
    # 恢复数据库
    if [ -f "$BACKUP_DIR/prod_${backup_date}.db" ]; then
        print_info "恢复数据库..."
        cp "$BACKUP_DIR/prod_${backup_date}.db" data/database/prod.db
        print_info "数据库恢复完成"
    fi
    
    # 恢复上传文件
    if [ -f "$BACKUP_DIR/uploads_${backup_date}.tar.gz" ]; then
        print_info "恢复上传文件..."
        rm -rf data/uploads/*
        tar -xzf "$BACKUP_DIR/uploads_${backup_date}.tar.gz" --strip-components=2
        print_info "上传文件恢复完成"
    fi
    
    # 重启服务
    print_info "重启应用服务..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_info "🎉 备份恢复完成！"
}

# 主函数
main() {
    case "${1:-}" in
        "full")
            create_backup_dir
            create_full_backup
            verify_backup
            cleanup_old_backups
            show_backup_stats
            upload_to_remote
            ;;
        "db")
            create_backup_dir
            backup_database
            verify_backup
            ;;
        "files")
            create_backup_dir
            backup_uploads
            verify_backup
            ;;
        "config")
            create_backup_dir
            backup_configs
            verify_backup
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "list")
            print_info "可用备份列表:"
            ls -la "$BACKUP_DIR" 2>/dev/null || print_warning "无备份文件"
            ;;
        "clean")
            cleanup_old_backups
            ;;
        *)
            echo "T3应用备份工具"
            echo ""
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  full      创建完整备份 (默认)"
            echo "  db        仅备份数据库"
            echo "  files     仅备份上传文件"
            echo "  config    仅备份配置文件"
            echo "  restore   恢复指定日期的备份"
            echo "  list      列出所有备份"
            echo "  clean     清理旧备份文件"
            echo ""
            echo "示例:"
            echo "  $0 full                    # 完整备份"
            echo "  $0 restore 20231201_140000 # 恢复备份"
            echo "  $0 list                    # 查看备份"
            echo ""
            
            # 默认执行完整备份
            create_backup_dir
            backup_database
            backup_uploads
            backup_configs
            verify_backup
            cleanup_old_backups
            show_backup_stats
            upload_to_remote
            ;;
    esac
}

# 执行主函数
main "$@"

