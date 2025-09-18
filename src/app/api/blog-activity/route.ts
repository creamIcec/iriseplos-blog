// app/api/blog-activity/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { postsDir } from "@/lib/blog-data/util";
import { ActivityMap } from "@/components/client/activity/activity-wall";

export async function GET() {
  try {
    // 添加调试信息
    console.log("Posts directory:", postsDir);
    console.log("Current working directory:", process.cwd());
    console.log("__dirname:", __dirname);

    // 检查目录是否存在
    try {
      const dirExists = await fs.access(postsDir);
      console.log("Directory exists:", true);
    } catch {
      console.log("Directory does not exist:", postsDir);
    }

    const activityData = await getBlogActivityData(365);
    return NextResponse.json(activityData);
  } catch (error) {
    console.error("获取博客活动数据失败:", error);
    return NextResponse.json({ error: "获取活动数据失败" }, { status: 500 });
  }
}

async function getBlogActivityData(period: number = 365): Promise<ActivityMap> {
  const activityMap: ActivityMap = {};
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Math.min(Math.max(0, period), 365));

  // 初始化日期范围
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().slice(0, 10);
    activityMap[dateKey] = 0;
  }

  try {
    // 添加更多调试信息
    console.log("Trying to read directory:", postsDir);
    const files = await fs.readdir(postsDir);
    console.log("Found files:", files.length);

    for (const file of files) {
      if (file.endsWith(".md") || file.endsWith(".mdx")) {
        const filePath = path.join(postsDir, file);
        console.log("Processing file:", filePath);

        const stats = await fs.stat(filePath);
        const updateDate = stats.mtime;
        const dateKey = updateDate.toISOString().slice(0, 10);

        console.log("日期:" + dateKey);

        if (dateKey in activityMap) {
          activityMap[dateKey] += 1;
        }
      }
    }
  } catch (err) {
    console.error("读取博客目录失败:", err);
    // 返回详细错误信息用于调试
    throw new Error(`Failed to read posts directory: ${err}`);
  }

  return activityMap;
}
