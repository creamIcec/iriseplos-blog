"use client";

import ActivityWall, {
  ActivityMap,
} from "@/components/client/activity/activity-wall";
import { CircularProgress } from "actify";
import { Suspense, useEffect, useState } from "react";

interface BlogActivitySectionProps {
  className?: string;
}

export default function BlogActivitySection({
  className,
}: BlogActivitySectionProps) {
  const [data, setData] = useState<ActivityMap>();
  const [, setError] = useState<string>();
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
      <Suspense fallback={<CircularProgress isIndeterminate />}>
        {!loading && (
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
        )}
      </Suspense>
    </section>
  );
}
