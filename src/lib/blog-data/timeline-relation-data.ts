import { cacheAccessFactory } from "../cache-tool";
import { CACHE_EXPIRATION_TIME } from "../CONSTANTS";
import { getSortedBlogMetadataInternal } from "./blog-data-service";
import { pickCoverHref } from "./util";

export interface NavItemMetadata {
  title: string;
  preview?: string;
  tags: string[];
  link?: string;
  date?: string;
  category?: string;
  coverUrl?: string;
  coverAlt?: string;
}

/**
 * 获取最近的博客元数据
 */
export async function getRecentBlogsMetadataInternal(
  count: number
): Promise<NavItemMetadata[]> {
  try {
    const sortedMetadata = await getSortedBlogMetadataInternal();
    const actualCount = Math.min(Math.max(0, count), sortedMetadata.length);

    return sortedMetadata.slice(0, actualCount).map((meta) => ({
      title: meta.title || "无标题",
      preview: meta.preview,
      tags: meta.tags || [],
      link: meta.filename, // 移除 .md 扩展名
      date: meta.dateISO || meta.datetime,
      category: meta.category,
      coverUrl: pickCoverHref({
        envNode: process.env.NODE_ENV,
        envVercel: process.env.VERCEL_ENV,
        coverUrl: meta.coverUrl,
        coverPath: meta.coverPath,
      }),
      coverAlt: meta.coverAlt,
    }));
  } catch (error) {
    console.error("获取最近博客元数据失败:", error);
    return [];
  }
}

/**
 * 获取指定分类的最近文章
 */
export async function getRecentBlogsByCategoryInternal(
  category: string,
  count: number = 5
): Promise<NavItemMetadata[]> {
  try {
    const sortedMetadata = await getSortedBlogMetadataInternal();

    const categoryPosts = sortedMetadata
      .filter((meta) => meta.category === category)
      .slice(0, count);

    return categoryPosts.map((meta) => ({
      title: meta.title || "无标题",
      preview: meta.preview,
      tags: meta.tags || [],
      link: meta.filename?.slice(0, -3),
      date: meta.dateISO || meta.datetime,
      category: meta.category,
    }));
  } catch (error) {
    console.error(`获取分类 "${category}" 最近文章失败:`, error);
    return [];
  }
}

/**
 * 获取包含指定标签的最近文章
 */
export async function getRecentBlogsByTagInternal(
  tag: string,
  count: number = 5
): Promise<NavItemMetadata[]> {
  try {
    const sortedMetadata = await getSortedBlogMetadataInternal();

    const taggedPosts = sortedMetadata
      .filter((meta) => meta.tags?.includes(tag))
      .slice(0, count);

    return taggedPosts.map((meta) => ({
      title: meta.title || "无标题",
      preview: meta.preview,
      tags: meta.tags || [],
      link: meta.filename?.slice(0, -3),
      date: meta.dateISO || meta.datetime,
      category: meta.category,
    }));
  } catch (error) {
    console.error(`获取标签 "${tag}" 最近文章失败:`, error);
    return [];
  }
}

export const getRecentBlogsByTag = cacheAccessFactory(
  getRecentBlogsByTagInternal,
  ["recent", "tag"],
  CACHE_EXPIRATION_TIME
);

export const getRecentBlogsByCategory = cacheAccessFactory(
  getRecentBlogsByCategoryInternal,
  ["recent", "category"],
  CACHE_EXPIRATION_TIME
);

export const getRecentBlogsMetadata = cacheAccessFactory(
  getRecentBlogsMetadataInternal,
  ["recent", "metadata"],
  CACHE_EXPIRATION_TIME
);
