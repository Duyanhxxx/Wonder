/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tăng timeout cho API routes (đặc biệt là init-db)
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;

