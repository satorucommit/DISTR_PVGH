import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Enable type checking for better error detection
  },
  reactStrictMode: true, // Enable React Strict Mode for production
  // Next.js 16 optimizations (swcMinify is enabled by default in Next.js 16)
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
