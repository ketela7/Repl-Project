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
    ]
  },
  serverExternalPackages: ['postgres'],
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    }
  },
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
  // Fix cross-origin warnings for Replit environment
  allowedDevOrigins: [
    '96579b48-779c-4618-b70e-cb4fc336daeb-00-2r8o1xutf6nav.pike.replit.dev',
    'bd5a8906-78eb-4d65-b250-a5c5030f791e-00-1yllcdgdu70j.pike.replit.dev',
    'bb64e31b-ac24-4c3a-8cd5-573d340fa502-00-19jdtdb0p5b6l.sisko.replit.dev',
    'fa7ac8b3-168b-4a9f-9389-89242052fa22-00-3aylzawvp0naa.sisko.replit.dev',
    '127.0.0.1',
    'localhost'
  ],
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
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/coverage', '**/drizzle']
      }
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