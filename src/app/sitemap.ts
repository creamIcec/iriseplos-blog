// app/sitemap.ts

import { listArticles } from "@/lib/blog-data/blog-data-service";
import { Metadata, MetadataRoute } from "next";

import path from "path";
import fs from "fs";
import { SITE } from "@/lib/CONSTANTS";

const FIRST_RELEASE_DATE = new Date("2025-09-17");
export const revalidate = 3600; // 1小时重新生成周期

type LastmodMap = Record<string, string>;

// 从磁盘加载所有文章修改时间
async function loadLastmod(): Promise<LastmodMap> {
  try {
    const lastmodRecord = path.join(
      process.cwd(),
      "public",
      "blog-lastmod.json"
    );
    const raw = fs.readFileSync(lastmodRecord, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [postIDs, lastmod] = await Promise.all([listArticles(), loadLastmod()]);

  // 主页 + 其他页面
  const items: MetadataRoute.Sitemap = [
    {
      url: SITE,
      lastModified: new Date(
        postIDs
          .map((s) => lastmod[s])
          .filter(Boolean)
          .map((d) => +new Date(d as string))
          .sort((a, b) => b - a)[0] ?? Date.now()
      ),
      changeFrequency: "daily",
      priority: 0.9,
    },
    { url: `${SITE}/about`, lastModified: new Date(), priority: 0.5 },
    { url: `${SITE}/tools`, lastModified: FIRST_RELEASE_DATE, priority: 0.3 },
  ];

  // 文章页面
  for (const slug of postIDs) {
    items.push({
      url: `${SITE}/blog/${slug}`,
      lastModified: lastmod[slug] ? new Date(lastmod[slug]) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return items;
}
