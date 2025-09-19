import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL("https://picsum.photos/seed/**"),
      {
        protocol: "https",
        hostname: "fvatprawuixmpa1x.public.blob.vercel-storage.com",
        port: "",
        pathname: "/images/**",
      },
    ],
  },

  outputFileTracingIncludes: {
    "/api/blog-activity": ["./public/activity-data.json", "./src/posts/**/*"],
  },
};

export default nextConfig;
