# Docker 镜像详解 - 你的 T3 项目示例

## 🎁 你的项目会被打包成什么样？

### 镜像内容清单
```
my-t3-app:latest 镜像包含：
├── 🐧 Alpine Linux (轻量级系统)
├── 📱 Node.js 18 (JavaScript 运行环境)
├── 📁 你的完整项目代码
│   ├── src/ (所有源代码)
│   ├── prisma/ (数据库配置)
│   ├── public/ (静态文件)
│   └── package.json (项目配置)
├── 📦 所有 npm 依赖包
│   ├── Next.js
│   ├── React
│   ├── Prisma
│   ├── tRPC
│   └── 其他 500+ 个包
├── 🗄️ SQLite 数据库
├── ⚙️ 环境配置
└── 🚀 启动脚本
```

### 镜像大小估算
```
基础系统 (Alpine Linux): ~5MB
Node.js 18: ~50MB  
你的项目代码: ~10MB
依赖包 (node_modules): ~200MB
构建产物 (.next): ~30MB
─────────────────────────────
总镜像大小: ~300MB
```

## 🔄 构建过程详解

### Step 1: 准备基础环境
```dockerfile
FROM node:18-alpine
# 下载一个包含 Node.js 的 Linux 系统
```

### Step 2: 设置工作目录
```dockerfile
WORKDIR /app
# 在容器内创建 /app 文件夹
```

### Step 3: 复制项目文件
```dockerfile
COPY package.json ./
COPY . .
# 把你电脑上的代码复制到容器里
```

### Step 4: 安装依赖
```dockerfile
RUN npm ci
# 在容器内安装所有依赖包
```

### Step 5: 构建项目
```dockerfile
RUN npm run build
# 编译 TypeScript，打包 React 组件等
```

### Step 6: 设置启动命令
```dockerfile
CMD ["npm", "start"]
# 告诉容器如何启动你的应用
```

## 🎯 镜像 vs 容器

### 镜像 (Image) = 模板
```
镜像就像一个"应用安装包"：
📦 my-t3-app:latest
├── 只读的
├── 可以复制无数份
├── 可以分享给别人
└── 存储在硬盘上
```

### 容器 (Container) = 运行实例  
```
容器就是"正在运行的应用"：
🏃‍♂️ my-t3-app-container
├── 基于镜像创建
├── 正在运行中
├── 可以读写数据
└── 占用内存和CPU
```

## 🚀 实际使用场景

### 场景 1：本地开发测试
```bash
# 构建镜像
docker build -t my-t3-app .

# 运行容器
docker run -p 3000:3000 my-t3-app

# 访问应用
curl http://localhost:3000
```

### 场景 2：部署到服务器
```bash
# 在服务器上直接运行
docker run -d -p 80:3000 my-t3-app

# 或者用 docker-compose
docker-compose up -d
```

### 场景 3：分享给团队
```bash
# 推送到 Docker Hub
docker push your-username/my-t3-app

# 团队成员直接使用
docker pull your-username/my-t3-app
docker run -p 3000:3000 your-username/my-t3-app
```

## 💡 为什么需要打包成镜像？

### 问题：传统部署的痛点
```
❌ 环境不一致："在我机器上能跑"
❌ 依赖冲突：版本不匹配
❌ 配置复杂：需要装很多东西
❌ 部署繁琐：步骤多易出错
❌ 扩展困难：复制环境麻烦
```

### 解决：Docker 镜像的优势
```
✅ 环境一致：打包了完整环境
✅ 依赖隔离：每个应用独立环境
✅ 部署简单：一条命令搞定
✅ 易于扩展：秒级启动新实例
✅ 版本管理：像代码一样管理环境
```

## 🎨 类比理解

### 传统部署 = 搬家
```
每次搬到新地方都要：
🏠 找房子 (准备服务器)
🔌 装水电 (安装环境)
📦 搬东西 (部署代码)
🔧 修修补补 (解决问题)
```

### Docker 镜像 = 胶囊屋
```
一个完整的"胶囊屋"包含：
🏠 房子本身 (应用代码)
🔌 水电设施 (运行环境)  
🛏️ 家具电器 (依赖包)
📋 使用说明 (配置文件)

到任何地方都能立即入住！
```

## 🔍 查看镜像内容

如果你想看看镜像里有什么：

```bash
# 构建镜像
docker build -t my-t3-app .

# 运行容器并进入
docker run -it my-t3-app sh

# 查看文件结构
ls -la
cat package.json
```

总的来说，Docker 镜像就是把你的应用和运行环境"冻结"成一个可移植的包，确保在任何地方都能完全一致地运行！
