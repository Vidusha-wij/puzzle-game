import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't fail production builds on lint warnings (types are still checked).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
