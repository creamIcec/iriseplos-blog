import type { NextConfig } from "next";
const TTL = 600;

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

  async headers() {
    return [
      // 首页
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0" },
          {
            key: "CDN-Cache-Control",
            value: `public, max-age=${TTL}, stale-while-revalidate=86400, stale-if-error=86400`,
          },
        ],
      },
      // 文章页
      {
        source: "/blog/:slug",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0" },
          {
            key: "CDN-Cache-Control",
            value: `public, max-age=${TTL}, stale-while-revalidate=86400, stale-if-error=86400`,
          },
        ],
      },
      // 静态产物: 一年强缓存
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // 缓存sitemap和robots.txt
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0" },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // 604800 = 1星期
      {
        source: "/robots.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0" },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
