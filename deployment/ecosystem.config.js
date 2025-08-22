module.exports = {
  apps: [
    {
      name: 'my-t3-app',
      script: 'pnpm',
      args: 'start',
      cwd: '/var/www/my-t3-app',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'file:./prod.db'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'file:./prod.db'
      },
      // 日志配置
      log_file: '/var/log/pm2/my-t3-app.log',
      out_file: '/var/log/pm2/my-t3-app-out.log',
      error_file: '/var/log/pm2/my-t3-app-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 自动重启配置
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',

      // 健康检查
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,

      // 其他配置
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/your-repo.git',
      path: '/var/www/my-t3-app',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install --frozen-lockfile && pnpm db:generate && pnpm build && pnpm db:migrate:deploy && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
