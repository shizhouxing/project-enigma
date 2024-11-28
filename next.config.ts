import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: {
    appIsrStatus: false,
  },
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
    const backendHost = process.env.BACKEND_HOST || 'http://127.0.0.1'; // Fallback to localhost if not set
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? `${backendHost}:8000/:path*`
            : `${process.env.BACKEND_HOST}/:path*`,
      },
    ];
  },

};

export default nextConfig;