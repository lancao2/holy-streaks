import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "natuhair-connect.local:3000",
    "natuhair-connect.local",
    "localhost:3000",
    "localhost",
    "*.local",
    "*.local:3000",
    "10.0.255.105:3000",
    "10.0.255.105"
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
