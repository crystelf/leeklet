import type { NextConfig } from "next";

// 去掉结尾斜杠,否则 rewrite 目标会拼出 //path
const API_TARGET = (
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:7345"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_TARGET}/:path*`,
      },
    ];
  },
};

export default nextConfig;
