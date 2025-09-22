// src/lib/cache-tool.ts
// 缓存策略函数工厂

import { unstable_cache, unstable_noStore } from "next/cache";

/* eslint-disable  @typescript-eslint/no-explicit-any */
type AsyncFn = (...args: any[]) => Promise<any>;

// 区分开发和生产环境。开发环境下直通访问, 生产环境带缓存策略

export function cacheAccessFactory<T extends AsyncFn>(
  accessor: T,
  keyParts: string[],
  revalidateTime: number
): T {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    // 生产: 用 next/cache 的数据缓存(ISR)
    // 如果来源页面启用了"force-static", 则会直接使用预渲染好的页面数据, 不会再访问第二次
    // 说明: unstable_cache 会把 "参数值" 一并纳入键; keyParts 只是前缀
    const cached = unstable_cache(accessor, keyParts, {
      revalidate: revalidateTime,
    });
    return cached as unknown as T;
  }

  // 开发：每次都直通读取，并在调用时 noStore()
  const devWrapper = (async (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> => {
    unstable_noStore(); // 发生在"请求期间", 合法且生效
    return accessor(...args);
  }) as T;

  return devWrapper;
}
