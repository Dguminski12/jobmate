import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "169.254.83.107"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
