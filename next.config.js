/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Fix cross-origin warnings for Replit environment
  allowedDevOrigins: [
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
        ],
      },
    ]
  }
}

module.exports = nextConfig