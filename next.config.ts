import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence the lockfile workspace-root warning
  outputFileTracingRoot: path.join(__dirname),

  compress: true,

  experimental: {
    serverActions: {
      bodySizeLimit: "52mb",
    },
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;
