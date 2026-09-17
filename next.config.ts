import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.app.github.dev",
    "*.preview.app.github.dev",
    "*.github.dev",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "*.app.github.dev",
        "*.preview.app.github.dev",
        "*.github.dev",
      ],
    },
  },
};

export default nextConfig;
