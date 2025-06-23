
/** @type {import('next').NextConfig} */
const nextConfig = {
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
      'recharts'
    ],
    // Enable faster compilation
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      }
    },
    // Faster builds
    optimisticClientCache: true
  },
  serverExternalPackages: ['postgres'],
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
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
  // Webpack optimizations for faster compilation
  webpack: (config, { dev, isServer }) => {
    // Speed up compilation
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    };

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            priority: 20,
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
    }

    // Development optimizations
    if (dev) {
      config.watchOptions = {
        poll: false, // Disable polling for better performance
        aggregateTimeout: 200, // Reduced from 300
        ignored: ['**/node_modules', '**/.git', '**/coverage', '**/drizzle', '**/.next']
      }
      
      // Faster module resolution in development
      config.resolve.symlinks = false;
      config.resolve.cacheWithContext = false;
    }

    // Additional optimizations for bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      // Replace heavy libraries with lighter alternatives in development
      'recharts': dev ? 'recharts/lib' : 'recharts',
    }

    return config
  }
}

module.exports = nextConfig
