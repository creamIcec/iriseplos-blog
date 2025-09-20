// app/blogs/route.ts
// 和app/blog/route完全一致

import { NextRequest, NextResponse } from "next/server";
import { getSortedBlogMetadata } from "@/lib/blog-data/blog-data-service";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "文章",
};

export async function GET(req: NextRequest) {
  const sorted = await getSortedBlogMetadata();
  const targetPath = sorted?.[0]?.filename
    ? `/blog/${sorted[0].filename}`
    : "/";

  // 基于当前请求构造"绝对 URL"(Next.js中间件重定向仅支持绝对URL)
  const url = req.nextUrl.clone();
  url.pathname = targetPath;
  url.search = "";

  const res = NextResponse.redirect(url, 307);
  res.headers.set(
    "Cache-Control",
    "public, max-age=0, s-maxage=600, stale-while-revalidate=86400, stale-if-error=86400"
  );
  return res;
}
