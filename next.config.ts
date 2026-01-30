// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Remove ignoreBuildErrors after migrating API routes to Next.js 16 async params
  // See: https://nextjs.org/docs/app/building-your-application/upgrading/version-16
  // 482 errors to fix - mostly related to params being Promise in route handlers
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
