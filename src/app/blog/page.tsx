// app/blog/page.tsx
// 一个中间page, 用于决定重定向到何处

import { redirect } from "next/navigation";
import { getSortedBlogMetadata } from "@/lib/blog-data/blog-data-service";
import { Suspense } from "react";
import { CircularProgress } from "actify";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "文章",
};

export default async function BlogPage() {
  const sortedBlogs = await getSortedBlogMetadata();

  if (sortedBlogs.length > 0) {
    const latestBlog = sortedBlogs[0];
    const blogSlug = latestBlog.filename;

    if (blogSlug) {
      redirect(`/blog/${blogSlug}`);
    }
  }

  // 没有博客时重定向到首页
  redirect("/");

  return (
    <Suspense>
      <CircularProgress isIndeterminate />
    </Suspense>
  );
}
