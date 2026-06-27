import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Vercel não executa server.ts — Socket.IO só funciona com servidor Node dedicado.
    NEXT_PUBLIC_REALTIME_ENABLED:
      process.env.NEXT_PUBLIC_REALTIME_ENABLED ??
      (process.env.VERCEL ? "false" : "true"),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
