/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression for all responses
  compress: true,

  // Production optimization
  reactStrictMode: true, // Enable for production stability

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@tanstack/react-table',
      'date-fns',
      'zod'
    ],
    optimisticClientCache: true,
    useWasmBinary: false,
    },

  

  serverExternalPackages: ['googleapis'],

  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/thumbnail/**',
      },
      {
        protocol: 'https',
        hostname: 'docs.google.com',
        port: '',
        pathname: '/**',
      },
    ],
    domains: ['lh3.googleusercontent.com', 'drive.google.com', 'docs.google.com'],
  
  },

  // Production TypeScript compilation
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
    tsconfigPath: './tsconfig.json',
  },

  // Enable ESLint for production builds
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  allowedDevOrigins: ['127.0.0.1', 'localhost', '*.pike.replit.dev', '*.sisko.replit.dev'],

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Production security headers
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Production compilation settings
  output: 'standalone',
  productionBrowserSourceMaps: true,

  // Development optimizations
  onDemandEntries: {
  //  maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },

  // Webpack optimizations for production
  webpack: (config, { dev, isServer }) => {
    // Enable filesystem caching for both dev and production
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }

    // Aggressive chunk splitting for performance optimization
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000, // Limit chunk size to 250KB
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          // Split Google APIs into separate chunk
          googleapis: {
            test: /[\\/]node_modules[\\/](googleapis)[\\/]/,
            name: 'googleapis',
            priority: 30,
            chunks: 'all',
          },
          // Split NextAuth into separate chunk
          nextauth: {
            test: /[\\/]node_modules[\\/](next-auth|@auth)[\\/]/,
            name: 'nextauth',
            priority: 25,
            chunks: 'all',
          },
          // Split Radix UI components
          radix: {
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            name: 'radix-ui',
            priority: 20,
            chunks: 'all',
          },
          // Split React table
          table: {
            test: /[\\/]node_modules[\\/](@tanstack[\\/]react-table)[\\/]/,
            name: 'react-table',
            priority: 15,
            chunks: 'all',
          },
          // Split utility libraries
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|zod|clsx|class-variance-authority)[\\/]/,
            name: 'utils',
            priority: 10,
            chunks: 'all',
          },
          // General vendor chunk for remaining packages
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          }
        },
      },
    }

    // Enable tree shaking for specific modules
    config.resolve.alias = {
      ...config.resolve.alias,
      // Ensure lodash uses ES modules for tree shaking
      'lodash': 'lodash-es'
    }

    return config
  },
}

module.exports = nextConfig
