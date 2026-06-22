import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@uniswap/sdk-core",
    "@uniswap/v2-sdk",
    "@uniswap/v3-sdk",
    "@uniswap/router-sdk",
    "@uniswap/permit2-sdk",
    "@uniswap/universal-router-sdk",
  ],
};

export default nextConfig;
