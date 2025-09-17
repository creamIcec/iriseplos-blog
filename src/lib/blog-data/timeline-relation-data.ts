import { getSortedBlogMetadata } from "./blog-data-service";

export interface NavItemMetadata {
  title: string;
  preview?: string;
  tags: string[];
  link?: string;
  date?: string;
  category?: string;
}

/**
 * 获取最近的博客元数据
 */
export async function getRecentBlogsMetadata(
  count: number
): Promise<NavItemMetadata[]> {
  try {
    const sortedMetadata = await getSortedBlogMetadata();
    const actualCount = Math.min(Math.max(0, count), sortedMetadata.length);

    return sortedMetadata.slice(0, actualCount).map((meta) => ({
      title: meta.title || "无标题",
      preview: meta.preview,
      tags: meta.tags || [],
      link: meta.filename, // 移除 .md 扩展名
      date: meta.dateISO || meta.datetime,
      category: meta.category,
    }));
  } catch (error) {
    console.error("获取最近博客元数据失败:", error);
    return [];
  }
}

/**
 * 获取指定分类的最近文章
 */
export async function getRecentBlogsByCategory(
  category: string,
  count: number = 5
): Promise<NavItemMetadata[]> {
  try {
    const sortedMetadata = await getSortedBlogMetadata();

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
export async function getRecentBlogsByTag(
  tag: string,
  count: number = 5
): Promise<NavItemMetadata[]> {
  try {
    const sortedMetadata = await getSortedBlogMetadata();

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
