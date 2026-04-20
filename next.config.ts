import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow preview panel cross-origin requests
  allowedDevOrigins: [
    'preview-chat-fef0d1e3-5976-4b9a-8087-7e07180c028a.space.z.ai',
    '.space.z.ai',
    'localhost:3000',
  ],
};

export default nextConfig;
