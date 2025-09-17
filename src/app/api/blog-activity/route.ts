// app/api/blog-activity/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { postsDir } from "@/lib/blog-data/util";
import { ActivityMap } from "@/components/client/activity/activity-wall";

export async function GET() {
  try {
    // 获取博客文章的更新活动
    const activityData = await getBlogActivityData(365);
    return NextResponse.json(activityData);
  } catch (error) {
    console.error("获取博客活动数据失败:", error);
    return NextResponse.json({ error: "获取活动数据失败" }, { status: 500 });
  }
}

/**
 * 获取博客文章的更新活动数据
 * 使用路由动态获取是为了保证数据最新
 */
async function getBlogActivityData(period: number = 365): Promise<ActivityMap> {
  // 初始化结果对象
  const activityMap: ActivityMap = {};

  const end = new Date();
  const start = new Date();

  // 如果传入的区间不合适, 使用一年的区间
  start.setDate(end.getDate() - Math.min(Math.max(0, period), 365));

  // 初始化日期范围内的所有日期为0 (没有活动)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD 格式
    activityMap[dateKey] = 0;
  }

  try {
    const files = await fs.readdir(postsDir);

    for (const file of files) {
      if (file.endsWith(".md") || file.endsWith(".mdx")) {
        const filePath = path.join(postsDir, file);
        const stats = await fs.stat(filePath);

        // 博客内容的时间是作者第一次编写的时间, 不代表最新的时间
        // 同上, 为了让用户可以看到准确的更新(如用于订阅等), 这里我们使用文件系统的最后修改时间
        const updateDate = stats.mtime;
        const dateKey = updateDate.toISOString().slice(0, 10);

        // 如果日期在查询范围内, 增加计数
        if (dateKey in activityMap) {
          activityMap[dateKey] += 1;
        }
      }
    }
  } catch (err) {
    console.warn("读取博客目录失败", err);
  }

  return activityMap;
}
