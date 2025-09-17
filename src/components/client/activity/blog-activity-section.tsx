"use client";

import ActivityWall, {
  ActivityMap,
} from "@/components/client/activity/activity-wall";
import { useEffect, useMemo, useState } from "react";

// 伪数据：把最近 365 天随机写入若干计数
function mockActivity(days = 365): ActivityMap {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  const out: ActivityMap = {};
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    // 模拟：周末活跃少、周中多
    const base = [0, 1, 2, 3, 2, 1, 0][d.getDay()];
    const noise = Math.random() < 0.4 ? 0 : Math.floor(Math.random() * 3);
    out[k] = base + noise;
  }
  return out;
}

interface BlogActivitySectionProps {
  className?: string;
}

export default function BlogActivitySection({
  className,
}: BlogActivitySectionProps) {
  const [data, setData] = useState<ActivityMap>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchActivityData() {
      try {
        const response = await fetch("/api/blog-activity");
        if (!response.ok) {
          throw new Error("获取博客活动数据失败");
        }
        const activityData = await response.json();
        setData(activityData);
      } catch (err) {
        console.error("获取活动数据错误:", err);
        setError("无法加载博客活动数据");
      } finally {
        setLoading(false);
      }
    }

    fetchActivityData();
  }, []);

  return (
    <section className={`${className}`}>
      <ActivityWall
        data={data}
        title="笔记本更新墙"
        weeks={53}
        weekStartsOn={0}
        levels={[0, 1, 3, 6, 10]}
        onTileClick={(date, count) => {
          console.log("activity cell clicked", date, count);
        }}
      />
    </section>
  );
}
