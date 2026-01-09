import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Proxy for local development (routes /api and /socket.io to backend)
  // In production (Kubernetes), Ingress handles this routing
  async rewrites() {
    // Only apply rewrites in development
    if (process.env.NODE_ENV === 'development') {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: '/socket.io/:path*',
          destination: `${backendUrl}/socket.io/:path*`,
        },
      ];
    }
    return [];
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
