// app/api/blog-activity/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const file = path.join(process.cwd(), "public/activity-data.json");
    const data = JSON.parse(await fs.readFile(file, "utf8"));
    return NextResponse.json(data);
  } catch (e) {
    console.error("读取活动数据失败:", e);
    return NextResponse.json({ error: "获取活动数据失败" }, { status: 500 });
  }
}
