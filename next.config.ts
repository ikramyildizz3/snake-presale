import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/",                 // snaketoken.app/
        destination: "/snake-token.html", // public içindeki statik HTML
      },
    ];
  },
};

export default nextConfig;
