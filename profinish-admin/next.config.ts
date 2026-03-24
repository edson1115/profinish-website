import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Explicitly tell Turbopack where the project root is to fix the file watcher
  turbopack: {
    root: process.cwd(), 
  },
};

export default nextConfig;
