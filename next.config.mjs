/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启服务端组件支持
  reactStrictMode: true,
  // 启用增量静态生成
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // 禁用x-powered-by标头
  poweredByHeader: false,
  // 跳过类型检查
  typescript: {
    ignoreBuildErrors: true,
  },
  // 忽略ESLint错误
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig; 