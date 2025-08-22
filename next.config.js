/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // 生产环境输出配置
  output: 'standalone',

  // 静态文件优化
  images: {
    unoptimized: true,
  },

  // TypeScript配置 - 宽松模式
  typescript: {
    ignoreBuildErrors: true, // 忽略 TS 构建错误
  },

  // ESLint配置 - 宽松模式
  eslint: {
    ignoreDuringBuilds: true, // 构建时忽略 ESLint 错误
  },

  // 关闭严格模式以提高兼容性
  reactStrictMode: false,

  // 关闭遥测
  telemetry: {
    enabled: false,
  },
};

export default config;
