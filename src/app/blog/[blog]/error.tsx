"use client";

import { Button } from "actify";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 新部署导致的 chunk 加载失败
    const isChunkLoadError = /ChunkLoadError|Loading chunk .* failed/i.test(
      error.message
    );

    if (isChunkLoadError) {
      // 如果是部署缓存不一致导致的错误, 强制刷新页面。浏览器会下载最新的 HTML 和 JS, 问题自动解决。
      window.location.reload();
    } else {
      // 对于其他类型的错误, 直接输出日志
      console.error(error);
    }
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center min-h-[83vh]">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-3xl font-bold mb-4 text-error">出错了</h1>
        <p className="text-secondary mb-8">
          A-oh.😢 页面加载出现错误。等会儿再试一下好不好?
        </p>

        <div className="space-y-4">
          <div className="flex flex-row gap-4 justify-center">
            <Button
              onClick={() => reset()}
              variant="elevated"
              className="min-w-32 p-4"
            >
              重新试试
            </Button>
            <Button variant="elevated" className="min-w-32">
              <Link href="/" className="block w-full p-4">
                返回首页
              </Link>
            </Button>
          </div>
          <Link
            href="/blog/search"
            className="block w-full py-3 px-6 text-primary"
          >
            Tip💡: 点击右上角也可以搜索文章(开发中~敬请期待)
          </Link>
        </div>
      </div>
    </div>
  );
}
