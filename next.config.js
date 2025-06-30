/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression for all responses
  compress: true,

  // Fast development optimizations
  reactStrictMode: false, // Disable for faster development

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'recharts',
    ],
    optimisticClientCache: true,
    useWasmBinary: false,
    },

  // Turbopack configuration (stable in Next.js 15+)
  turbo: {
    rules: {
      '*.tsx': {
        loaders: ['@/components/ui/**'],
      },
    },
  },

  serverExternalPackages: ['googleapis'],

  // Fast TypeScript compilation
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },

  // Skip ESLint during builds for speed
  eslint: {
    ignoreDuringBuilds: true,
  },

  allowedDevOrigins: ['127.0.0.1', 'localhost', '*.pike.replit.dev', '*.sisko.replit.dev'],

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Simplified headers for development speed
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Fast compilation settings
  output: 'standalone',
  productionBrowserSourceMaps: false,

  // Development optimizations
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },

  // Webpack optimizations for lazy loading
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Enable filesystem caching
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }

      // Optimize chunk splitting for lazy components
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig
