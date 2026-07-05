import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "169.254.83.107", "100.118.27.51"],
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
