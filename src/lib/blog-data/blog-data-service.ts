import { extractAllMetadata, type BlogMetadata } from "./util";

let cachedMetadata: BlogMetadata[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取所有博客元数据（带缓存）
 */
export async function getAllBlogMetadata(
  forceRefresh = false
): Promise<BlogMetadata[]> {
  const now = Date.now();

  if (!forceRefresh && cachedMetadata && now - lastCacheTime < CACHE_DURATION) {
    return cachedMetadata;
  }

  try {
    cachedMetadata = await extractAllMetadata();
    lastCacheTime = now;
    return cachedMetadata;
  } catch (error) {
    console.error("获取博客元数据失败:", error);
    return [];
  }
}

/**
 * 清除缓存（开发环境或数据更新时使用）
 */
export function clearBlogCache(): void {
  cachedMetadata = null;
  lastCacheTime = 0;
}

/**
 * 按时间排序的元数据
 */
export async function getSortedBlogMetadata(): Promise<BlogMetadata[]> {
  const allMetadata = await getAllBlogMetadata();

  return [...allMetadata].sort((a, b) => {
    const dateA = a.dateISO || a.datetime || "";
    const dateB = b.dateISO || b.datetime || "";
    return dateB.localeCompare(dateA);
  });
}
