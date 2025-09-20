import { cacheAccessFactory } from "../cache-tool";
import { CACHE_EXPIRATION_TIME } from "../CONSTANTS";
import { getAllBlogMetadataInternal } from "./blog-data-service";
export interface BlogStatistics {
  articleCount: number;
  categoryCount: number;
  tagCount: number;
  categories: string[];
  tags: string[];
  recentArticles: number; // 最近30天的文章数
}

async function getStatisticsInternal(): Promise<BlogStatistics> {
  try {
    const allMetadata = await getAllBlogMetadataInternal();

    // 获取所有分类
    const categories = [
      ...new Set(
        allMetadata
          .map((meta) => meta.category)
          .filter((item) => item !== undefined)
      ),
    ];

    // 获取所有标签
    const tags = [
      ...new Set(
        allMetadata
          .flatMap((meta) => meta.tags || [])
          .filter((item) => item !== undefined)
      ),
    ];

    // 计算最近30天的文章数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentArticles = allMetadata.filter((meta) => {
      const articleDate = new Date(meta.dateISO || meta.datetime || "");
      return articleDate >= thirtyDaysAgo;
    }).length;

    return {
      articleCount: allMetadata.length,
      categoryCount: categories.length,
      tagCount: tags.length,
      categories,
      tags,
      recentArticles,
    };
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return {
      articleCount: 0,
      categoryCount: 0,
      tagCount: 0,
      categories: [],
      tags: [],
      recentArticles: 0,
    };
  }
}

/**
 * 仅获取分类列表
 */
async function getCategoriesInternal(): Promise<string[]> {
  const stats = await getStatisticsInternal();
  return stats.categories;
}

/**
 * 仅获取标签列表
 */
async function getTagsInternal(): Promise<string[]> {
  const stats = await getStatisticsInternal();
  return stats.tags;
}

/**
 * 获取标签使用统计
 */
async function getTagsWithCountInternal(): Promise<
  Array<{ tag: string; count: number }>
> {
  try {
    const allMetadata = await getAllBlogMetadataInternal();
    const tagMap = new Map<string, number>();

    allMetadata.forEach((meta) => {
      (meta.tags || []).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("获取标签统计失败:", error);
    return [];
  }
}

export const getStatistics = cacheAccessFactory(
  getStatisticsInternal,
  ["stats", "summary"],
  CACHE_EXPIRATION_TIME
);

export const getCategories = cacheAccessFactory(
  getCategoriesInternal,
  ["stats", "categories"],
  CACHE_EXPIRATION_TIME
);

export const getTags = cacheAccessFactory(
  getTagsInternal,
  ["stats", "tags"],
  CACHE_EXPIRATION_TIME
);

export const getTagsWithCount = cacheAccessFactory(
  getTagsWithCountInternal,
  ["stats", "tags-with-count"],
  CACHE_EXPIRATION_TIME
);
