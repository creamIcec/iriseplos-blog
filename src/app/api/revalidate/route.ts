// app/api/revalidate/route.ts

import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

async function purgeCloudflare(urls: string[]) {
  const zoneId = process.env.CF_ZONE_ID!;
  const token = process.env.CF_API_TOKEN!; // 需要有 Cache Purge 权限
  await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: urls }),
    }
  );
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== process.env.REVALIDATE_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { path, id } = await req.json().catch(() => ({}));

  const paths: string[] = [];

  if (typeof path === "string" && path.startsWith("/")) {
    revalidatePath(path);
    paths.push(path);
  }
  if (typeof id === "string" && id) {
    revalidatePath(`/blog/${id}`);
    paths.push(`/blog/${id}`);
  }

  // 顺手刷新重定向页面, 分类页和主页
  if (!path && !id) {
    revalidatePath("/blog");
    revalidatePath("/blog/category");
    revalidatePath("/");

    paths.push("/blog");
    paths.push("/blog/category");
    paths.push("/");
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://blog.irise.top";
  await purgeCloudflare(paths.map((p) => `${origin}${p}`));

  return new Response("ok");
}
