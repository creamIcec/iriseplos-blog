// app/blog/not-found.tsx
import { Button } from "actify";
import Link from "next/link";

export default function BlogNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center min-h-[83vh]">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-3xl font-bold mb-4 text-error">博客文章未找到</h1>
        <p className="text-secondary mb-8">A-oh.☹️ 博客不存在。要不看看别的?</p>

        <div className="space-y-4">
          <Button variant="elevated">
            <Link href="/" className="block w-full py-3 px-6">
              返回首页
            </Link>
          </Button>
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
