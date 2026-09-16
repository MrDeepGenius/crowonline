import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;