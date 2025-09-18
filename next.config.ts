import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL("https://picsum.photos/seed/**")],
  },

  outputFileTracingIncludes: {
    "/api/blog-activity": ["./public/activity-data.json", "./src/posts/**/*"],
  },
};

export default nextConfig;
