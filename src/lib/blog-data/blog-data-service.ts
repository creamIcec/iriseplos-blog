import { cacheAccessFactory } from "../cache-tool";
import { CACHE_EXPIRATION_TIME } from "../CONSTANTS";
import {
  extractAllMetadata,
  isArticleFile,
  postsDir,
  toPostId,
  type BlogMetadata,
} from "./util";
import fs from "fs";

let cachedMetadata: BlogMetadata[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 清除缓存（开发环境或数据更新时使用）
 */
export function clearBlogCache(): void {
  cachedMetadata = null;
  lastCacheTime = 0;
}

/**
 * 获取所有博客元数据（带缓存）
 */
// 对于本函数而言, 相当于使用了二级缓存
export async function getAllBlogMetadataInternal(
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

// 获取所有文章文件名列表
export async function listArticles() {
  const entries = fs.readdirSync(postsDir, { withFileTypes: true });

  return entries
    .filter((d) => d.isFile() && isArticleFile(d.name))
    .map((d) => toPostId(d.name));
}

/**
 * 按时间排序的元数据
 */
export async function getSortedBlogMetadataInternal(): Promise<BlogMetadata[]> {
  const allMetadata = await getAllBlogMetadataInternal(true);

  return [...allMetadata].sort((a, b) => {
    const dateA = a.dateISO || a.datetime || "";
    const dateB = b.dateISO || b.datetime || "";
    return dateB.localeCompare(dateA);
  });
}

export const getAllBlogMetadata = cacheAccessFactory(
  getAllBlogMetadataInternal,
  ["blog-metadata"],
  CACHE_EXPIRATION_TIME
);

export const getSortedBlogMetadata = cacheAccessFactory(
  getSortedBlogMetadataInternal,
  ["blog-sorted-metadata"],
  CACHE_EXPIRATION_TIME
);
