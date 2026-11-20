import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth + MySQL routes are request-time; keep classic dynamic rendering.
  cacheComponents: false,
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
