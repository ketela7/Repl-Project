import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  port: 5000,
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
    "*.pike.replit.dev",
    "ff9fb4ba-8323-4b29-b013-d3e4cf9974de-00-7plue05qojw9.pike.replit.dev",
    "127.0.0.1",
    "localhost"
  ],
};

export default nextConfig;
