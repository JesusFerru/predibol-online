import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images - prevent rerenders from image loading
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/w160/**",
      },
    ],
  },

  // React optimizations
  reactStrictMode: true,

  // Turbopack configuration - use sparingly to avoid issues
  turbopack: {
    resolveAlias: {
      "@": "./src",
    },
  },

  // Headers for caching static assets
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*\\.woff2",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
