# 简化版 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache libc6-compat

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 复制 Prisma schema（postinstall 需要）
COPY prisma/schema.prisma ./prisma/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制其余源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# 生成 Prisma 客户端
RUN pnpm prisma generate

# 构建应用
RUN pnpm build

# 创建上传目录
RUN mkdir -p /app/public/uploads

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000

# 启动应用
CMD ["pnpm", "start"]
