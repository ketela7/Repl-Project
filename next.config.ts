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
  allowedDevOrigins: [
    "*.replit.dev",
     "127.0.0.1",
    "localhost"
  ],
};

export default nextConfig;
