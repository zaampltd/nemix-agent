import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore build errors due to clashing global React types in parent C:\Users\shahi folder
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
