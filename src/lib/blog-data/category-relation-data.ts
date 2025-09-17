import { getAllBlogMetadata } from "./blog-data-service";

export interface ArticleLink {
  link: string;
  title: string;
}

/**
 * 获取指定分类下的所有文章链接
 */
export async function getArticleLinksInCategory(
  category?: string
): Promise<ArticleLink[]> {
  if (!category || category === "杂项") {
    return [];
  }

  try {
    const allMetadata = await getAllBlogMetadata();

    return allMetadata
      .filter((item) => item.category === category)
      .map((item) => ({
        link: item.filename || "", // 移除 .md 扩展名
        title: item.title || "无标题",
      }));
  } catch (error) {
    console.error(`获取分类 "${category}" 文章失败:`, error);
    return [];
  }
}

/**
 * 获取所有分类及其文章数量
 */
export async function getCategoriesWithCount(): Promise<
  Array<{ category: string; count: number }>
> {
  try {
    const allMetadata = await getAllBlogMetadata();
    const categoryMap = new Map<string, number>();

    allMetadata.forEach((item) => {
      const category = item.category || "未分类";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count); // 按文章数量降序
  } catch (error) {
    console.error("获取分类统计失败:", error);
    return [];
  }
}
