import { getAllBlogMetadata } from "./blog-data-service";

export interface BlogStatistics {
  articleCount: number;
  categoryCount: number;
  tagCount: number;
  categories: string[];
  tags: string[];
  recentArticles: number; // 最近30天的文章数
}

export async function getStatistics(): Promise<BlogStatistics> {
  try {
    const allMetadata = await getAllBlogMetadata();

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
export async function getCategories(): Promise<string[]> {
  const stats = await getStatistics();
  return stats.categories;
}

/**
 * 仅获取标签列表
 */
export async function getTags(): Promise<string[]> {
  const stats = await getStatistics();
  return stats.tags;
}

/**
 * 获取标签使用统计
 */
export async function getTagsWithCount(): Promise<
  Array<{ tag: string; count: number }>
> {
  try {
    const allMetadata = await getAllBlogMetadata();
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
