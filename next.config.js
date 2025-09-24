/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.pexels.com', 'cdn.dribbble.com', 'mir-s3-cdn-cf.behance.net']
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
};

module.exports = nextConfig;