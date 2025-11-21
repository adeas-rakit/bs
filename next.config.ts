import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {}, 
  typescript: {
    ignoreBuildErrors: true,
  }, 
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) { 
      config.watchOptions = {
        ignored: ["**/*"],  
      };
    }
    return config;
  }
};

export default nextConfig;
