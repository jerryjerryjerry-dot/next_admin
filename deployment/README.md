# 阿里云服务器部署指南

本指南提供了在阿里云服务器上部署 Next.js + Prisma + SQLite 应用的完整方案。

## 部署方案选择

### 方案一：Docker 部署（推荐）
- ✅ 环境一致性好
- ✅ 易于管理和扩展
- ✅ 自动化程度高
- ❌ 资源占用稍高

### 方案二：PM2 部署
- ✅ 资源占用少
- ✅ 性能更好
- ✅ 配置灵活
- ❌ 环境依赖复杂

## 服务器要求

### 最低配置
- CPU: 2核
- 内存: 4GB
- 存储: 40GB SSD
- 带宽: 1Mbps

### 推荐配置
- CPU: 4核
- 内存: 8GB
- 存储: 80GB SSD
- 带宽: 5Mbps

## 部署步骤

### 1. 服务器准备

```bash
# 登录服务器
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y
```

### 2. 上传代码

```bash
# 方法一：使用 Git（推荐）
git clone https://github.com/yourusername/your-repo.git /var/www/my-t3-app

# 方法二：使用 SCP 上传
scp -r ./your-project root@your-server-ip:/var/www/my-t3-app
```

### 3. 配置环境变量

```bash
cd /var/www/my-t3-app
cp deployment/env.production.example .env.production
nano .env.production  # 编辑配置
```

**重要配置项：**
```env
NODE_ENV=production
DATABASE_URL="file:./prod.db"
ENCRYPTION_KEY="your-32-character-encryption-key-here"
NEXTAUTH_URL=https://your-domain.com
```

### 4. 执行部署

#### Docker 部署
```bash
cd /var/www/my-t3-app
chmod +x deployment/deploy.sh
./deployment/deploy.sh docker
```

#### PM2 部署
```bash
cd /var/www/my-t3-app
chmod +x deployment/deploy.sh
./deployment/deploy.sh pm2
```

### 5. 配置域名和 SSL

#### 获取免费 SSL 证书（Let's Encrypt）
```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 更新 Nginx 配置
编辑 `/etc/nginx/sites-available/my-t3-app`，替换 `your-domain.com` 为实际域名。

## 日常维护

### 快速更新
```bash
cd /var/www/my-t3-app
chmod +x deployment/quick-deploy.sh
./deployment/quick-deploy.sh
```

### 查看日志
```bash
# Docker 方式
docker-compose logs -f app

# PM2 方式
pm2 logs my-t3-app

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 数据库管理
```bash
# 进入应用目录
cd /var/www/my-t3-app

# 数据库迁移
npx prisma migrate deploy

# 查看数据库
npx prisma studio

# 备份数据库
cp prisma/prod.db /var/backups/my-t3-app/db-backup-$(date +%Y%m%d).db
```

### 监控和健康检查
```bash
# 检查应用状态
curl http://localhost:3000/api/status

# 检查服务状态
systemctl status nginx
docker-compose ps  # Docker 方式
pm2 status         # PM2 方式

# 系统资源监控
htop
df -h
free -h
```

## 性能优化

### 1. 数据库优化
```bash
# 定期清理日志
find /var/log -name "*.log" -mtime +30 -delete

# 数据库 VACUUM（SQLite）
sqlite3 prisma/prod.db "VACUUM;"
```

### 2. 缓存配置
- 静态文件缓存：Nginx 配置已包含
- API 缓存：可考虑 Redis
- CDN：建议使用阿里云 CDN

### 3. 安全配置
```bash
# 配置防火墙
ufw enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# 禁用 root SSH 登录
nano /etc/ssh/sshd_config
# PermitRootLogin no
systemctl restart sshd
```

## 故障排除

### 常见问题

1. **应用无法启动**
   - 检查环境变量配置
   - 查看应用日志
   - 确认端口未被占用

2. **数据库连接失败**
   - 检查 DATABASE_URL 配置
   - 确认数据库文件权限
   - 运行数据库迁移

3. **静态文件 404**
   - 检查 Nginx 配置
   - 确认文件路径正确
   - 重启 Nginx 服务

4. **SSL 证书问题**
   - 检查域名解析
   - 重新申请证书
   - 更新 Nginx 配置

### 日志位置
- 应用日志：`/var/log/pm2/` 或 `docker-compose logs`
- Nginx 日志：`/var/log/nginx/`
- 系统日志：`/var/log/syslog`

## 备份策略

### 自动备份脚本
```bash
#!/bin/bash
# 添加到 crontab: 0 2 * * * /path/to/backup.sh

BACKUP_DIR="/var/backups/my-t3-app"
APP_DIR="/var/www/my-t3-app"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# 备份数据库
cp $APP_DIR/prisma/prod.db $BACKUP_DIR/db-$DATE.db

# 备份上传文件
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz $APP_DIR/public/uploads

# 清理 30 天前的备份
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## 联系支持

如遇到部署问题，请检查：
1. 服务器配置是否满足要求
2. 环境变量是否正确配置
3. 域名解析是否正确
4. 防火墙和安全组设置

---

**注意：** 部署前请务必备份重要数据，并在测试环境验证配置。
