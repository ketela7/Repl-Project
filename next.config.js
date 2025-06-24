
/** @type {import('next').NextConfig} */
const nextConfig = {
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
      'recharts'
    ],
    optimisticClientCache: true,
    useWasmBinary: false,
  },
  
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  serverExternalPackages: ['postgres', 'googleapis'],
  
  // Fast TypeScript compilation
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json'
  },
  
  // Skip ESLint during builds for speed
  eslint: {
    ignoreDuringBuilds: true
  },

  allowedDevOrigins: ['*.pike.replit.dev', '*.sisko.replit.dev'],
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
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
}

module.exports = nextConfig
