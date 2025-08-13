import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    return [
      // Proxy all API routes to the Node/Express server
      { source: '/api/:path*', destination: `${apiBase}/api/:path*` },
    ];
  },
};

export default nextConfig;
