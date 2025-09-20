// app/api/revalidate/route.ts

import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== process.env.REVALIDATE_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { path, slug } = await req.json().catch(() => ({}));

  if (typeof path === "string" && path.startsWith("/")) {
    revalidatePath(path);
  }
  if (typeof slug === "string" && slug) {
    revalidatePath(`/blog/${slug}`);
  }

  // 顺手刷新重定向页面, 分类页和主页
  if (!path && !slug) {
    revalidatePath("/blog");
    revalidatePath("/blog/category");
    revalidatePath("/");
  }

  return new Response("ok");
}
