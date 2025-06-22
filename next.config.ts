import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cross-origin configuration for Replit environment
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: [
      '127.0.0.1:5000',
      'localhost:5000',
      '70a2a01c-1a63-4e03-b3ad-142a6ad017fc-00-ni2eddwx0mcm.sisko.replit.dev'
    ],
  }),
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons', 
      'lucide-react',
      '@tanstack/react-table',
      '@tanstack/react-query',
      'date-fns'
    ],
  },
  
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    resolveAlias: {
      '@/': './src/',
    },
  },
  
  // Webpack optimizations (safe configuration)
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    
    // Only apply optimizations for client-side builds
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    
    return config;
  },

  // Environment-specific configurations
  ...(process.env.NODE_ENV === 'development' && {
    // Development-only settings
    typescript: {
      ignoreBuildErrors: false,
    },
  }),

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
  }),
};

export default nextConfig;