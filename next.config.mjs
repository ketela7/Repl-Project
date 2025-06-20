/** @type {import('next').NextConfig} */
const nextConfig = {
  // Replit optimization
  port: 5000,
  hostname: '0.0.0.0',
  
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Reduce memory pressure
    turbo: {
      memoryLimit: 512,
    },
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    formats: ['image/webp', 'image/avif'],
  },
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
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  allowedDevOrigins: ['*.replit.dev'],
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/default",
        permanent: false,
      },
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
}

export default nextConfig
