// app/robots.ts

import { HOST, SITE } from "@/lib/CONSTANTS";
import { MetadataRoute } from "next";

export const revalidate = 86400; // 24h

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE}/sitemap.xml`,
    host: HOST,
  };
}
