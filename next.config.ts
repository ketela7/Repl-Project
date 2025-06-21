import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['node_modules', '.next', 'coverage'],
      };
    }
    
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
          },
        },
      },
    };
    
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