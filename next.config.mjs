/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启服务端组件支持
  reactStrictMode: true,
  // 启用增量静态生成
  experimental: {
    serverActions: true,
  },
  // 禁用x-powered-by标头
  poweredByHeader: false,
};

export default nextConfig; 