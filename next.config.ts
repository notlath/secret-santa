import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev indicator covers bottom-left buttons at phone width and blocks Playwright clicks.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
