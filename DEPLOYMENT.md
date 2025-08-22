# 🚀 T3 应用 Docker 生产环境部署指南

## 📋 部署概览

本项目提供完整的Docker生产环境部署方案，包括：
- Next.js T3应用容器
- Nginx反向代理
- SSL/HTTPS支持
- 数据持久化
- 自动重启
- 健康检查

## 🛠 系统要求

### 服务器配置
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **内存**: 最低2GB，推荐4GB+
- **存储**: 最低20GB可用空间
- **网络**: 公网IP，开放80/443端口

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- 域名（如需HTTPS）

## 📦 快速部署

### 1. 一键部署脚本
```bash
# 克隆项目（或上传项目文件）
git clone <your-repo> t3-app
cd t3-app

# 运行部署脚本
./deploy.sh
```

### 2. 手动部署步骤

#### 步骤1: 环境准备
```bash
# 创建必要目录
mkdir -p data/database data/uploads ssl logs

# 复制环境配置
cp .env.example .env.production
```

#### 步骤2: 配置环境变量
编辑 `.env.production` 文件：
```env
NODE_ENV=production
DATABASE_URL=file:./prod.db
NEXTAUTH_SECRET=your-super-secret-key-change-this
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### 步骤3: SSL证书配置
**选项A: 使用Let's Encrypt（推荐）**
```bash
# 自动获取证书
docker run --rm -v ./ssl:/etc/letsencrypt -v ./data/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  --email your-email@domain.com --agree-tos --no-eff-email -d yourdomain.com

# 复制证书
cp ssl/live/yourdomain.com/fullchain.pem ssl/
cp ssl/live/yourdomain.com/privkey.pem ssl/
```

**选项B: 手动上传证书**
```bash
# 将证书文件放置到以下位置：
# ssl/fullchain.pem - 完整证书链
# ssl/privkey.pem - 私钥文件
```

**选项C: 仅HTTP部署**
修改 `docker-compose.prod.yml`，移除HTTPS相关配置

#### 步骤4: 部署应用
```bash
# 构建并启动
docker-compose -f docker-compose.prod.yml up --build -d

# 初始化数据库
docker-compose -f docker-compose.prod.yml exec app pnpm prisma db push

# 可选: 添加种子数据
docker-compose -f docker-compose.prod.yml exec app pnpm db:seed:simple
```

## 🔧 配置文件说明

### docker-compose.prod.yml
生产环境Docker Compose配置，包含：
- **app**: Next.js应用容器
- **nginx**: 反向代理容器  
- **redis**: 缓存容器（可选）

### nginx.prod.conf
Nginx生产环境配置，特性：
- SSL/TLS配置
- Gzip压缩
- 静态文件缓存
- 安全头设置
- 代理配置

### Dockerfile.prod
优化的生产环境Dockerfile：
- 多阶段构建
- 最小化镜像大小
- 非root用户运行
- 健康检查

## 🎛 管理命令

### 日常运维
```bash
# 查看服务状态
./deploy.sh status
docker-compose -f docker-compose.prod.yml ps

# 查看日志
./deploy.sh logs
docker-compose -f docker-compose.prod.yml logs -f app

# 重启服务
./deploy.sh restart
docker-compose -f docker-compose.prod.yml restart

# 停止服务
./deploy.sh stop
docker-compose -f docker-compose.prod.yml down

# 更新应用
./deploy.sh update
```

### 数据库操作
```bash
# 数据库迁移
docker-compose -f docker-compose.prod.yml exec app pnpm prisma db push

# 重置数据库
docker-compose -f docker-compose.prod.yml exec app pnpm prisma db reset

# 数据库备份
docker-compose -f docker-compose.prod.yml exec app cp /app/prisma/prod.db /app/backup/
docker cp container_name:/app/backup/prod.db ./backup/
```

## 📊 监控和维护

### 健康检查
```bash
# 应用健康状态
curl https://yourdomain.com/api/status

# 容器健康状态  
docker-compose -f docker-compose.prod.yml ps
```

### 日志管理
```bash
# 应用日志
docker-compose -f docker-compose.prod.yml logs app

# Nginx日志
docker-compose -f docker-compose.prod.yml logs nginx

# 系统资源监控
docker stats
```

### 备份策略
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
tar -czf backups/data_backup_$DATE.tar.gz data/
echo "备份完成: backups/data_backup_$DATE.tar.gz"
EOF

chmod +x backup.sh

# 设置定时备份（每天3点）
echo "0 3 * * * /path/to/your/app/backup.sh" | crontab -
```

## 🔒 安全配置

### Nginx安全优化
- SSL/TLS 1.2+ 
- HSTS启用
- 安全头设置
- Rate limiting

### 应用安全
- 非root用户运行
- 最小权限原则
- 环境变量隔离
- 定期更新依赖

### 防火墙配置
```bash
# Ubuntu/Debian
ufw allow 80
ufw allow 443
ufw allow 22
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

## 🚨 故障排查

### 常见问题

#### 1. 容器无法启动
```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs app

# 检查配置文件
docker-compose -f docker-compose.prod.yml config
```

#### 2. 数据库连接失败
```bash
# 检查数据库文件权限
ls -la data/database/

# 重新初始化数据库
docker-compose -f docker-compose.prod.yml exec app pnpm prisma db push
```

#### 3. SSL证书问题
```bash
# 检查证书文件
ls -la ssl/

# 重新获取证书
certbot renew --dry-run
```

#### 4. Nginx配置错误
```bash
# 测试配置
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# 重新加载配置
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 性能优化

#### 应用层优化
- 启用Next.js缓存
- 优化图片加载
- 代码分割

#### 基础设施优化  
- 使用CDN
- 启用Gzip压缩
- 配置缓存策略

## 📈 扩展部署

### 多服务器部署
- 使用Docker Swarm
- 配置负载均衡
- 共享存储方案

### CI/CD集成
```yaml
# GitHub Actions示例
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && git pull && ./deploy.sh update'
```

## 📞 支持

### 获取帮助
- 查看应用日志
- 检查Docker状态  
- 参考官方文档

### 联系方式
- 项目Issues
- 技术支持邮箱
- 社区论坛

---

**部署完成后，访问 `https://yourdomain.com` 即可使用你的T3应用！** 🎉

