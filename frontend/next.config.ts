import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.logo.dev',
      },
    ],
  },
};

export default nextConfig;