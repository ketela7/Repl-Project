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
        ],
      },
    ]
  }
}

module.exports = nextConfig