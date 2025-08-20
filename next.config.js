/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // 修复workspace root推断警告
  outputFileTracingRoot: process.cwd(),

  // 优化构建性能
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-tabs', '@radix-ui/react-dialog'],
  },

  // TypeScript配置
  typescript: {
    // 在开发环境中忽略构建错误，但在生产环境中保持严格检查
    ignoreBuildErrors: false,
  },
};

export default config;
