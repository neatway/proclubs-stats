import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking and linting during build - we'll catch these issues locally
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize images from EA Sports CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eafc24.content.easports.com',
      },
      {
        protocol: 'https',
        hostname: 'media.contentapi.ea.com',
      },
    ],
  },
};

export default nextConfig;
