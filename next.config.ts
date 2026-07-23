import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pxfmvncfdfiuxobjzihw.supabase.co" },
    ],
  },
};

export default nextConfig;
