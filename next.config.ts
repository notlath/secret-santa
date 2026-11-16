import type { NextConfig } from "next";

const isE2E = process.env.E2E_TEST === "1";

const nextConfig: NextConfig = {
  distDir: isE2E ? ".next-e2e" : ".next",
  typescript: { tsconfigPath: isE2E ? "tsconfig.e2e.json" : "tsconfig.json" },
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
