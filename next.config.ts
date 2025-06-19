import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack temporarily to fix chunk loading issues
  // experimental: {
  //   turbo: {
  //     rules: {
  //       "*.svg": {
  //         loaders: ["@svgr/webpack"],
  //         as: "*.js",
  //       },
  //     },
  //   },
  // },
};

export default nextConfig;
