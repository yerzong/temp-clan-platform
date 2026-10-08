import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents (experimental) left off for now: we use classic dynamic
  // rendering for session-based pages. Revisit adopting it later.
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
