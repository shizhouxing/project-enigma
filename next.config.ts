import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'avatars.githubusercontent.com',
            port: '',
            pathname: '/u/**',
        },
    ],
  },
  rewrites: async () => {
    return [
      {
        source : "/api/game",
        destination : 
          process.env.NODE_ENV === "development"
          ? "http://127.0.0.1:8000/game/"
          : "game/",
      },
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/:path*"
            : ":path*",
      },

    ];
  },

};

export default nextConfig;