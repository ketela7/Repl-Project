import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        buildDependencies: {
          config: [__filename]
        }
      };
    }
    return config;
  },
  allowedDevOrigins: [
    "*.replit.dev",
     "127.0.0.1",
    "localhost"
  ],
};

export default nextConfig;
