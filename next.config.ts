import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Самодостаточная сборка для Docker-образа (см. Dockerfile).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Файлы заказа (до 4 МБ вместе) приходят в Server Action вместе с формой.
    serverActions: { bodySizeLimit: "5mb" },
  },
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
