import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce React Strict Mode for robust React 19 concurrent features
  reactStrictMode: true,

  // Disable 'X-Powered-By: Next.js' header for improved security and smaller response size
  poweredByHeader: false,

  // Enable Gzip/Brotli compression for server responses
  compress: true,

  // Keep heavy binary & native node modules isolated from client bundler
  serverExternalPackages: ["pg", "node:sqlite", "@neondatabase/serverless"],

  // Turbopack configuration for Next.js 16
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Next.js 16 optimization flags
  experimental: {
    // Automatically tree-shake barrel imports from large icon libraries
    optimizePackageImports: ["lucide-react"],
  },

  // Compiler optimizations for production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Advanced HTTP headers: CORS, Security hardening, and static SDK caching
  async headers() {
    return [
      {
        source: "/sdk/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" },
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          { key: "Timing-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, X-AbuseShield-Key, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
