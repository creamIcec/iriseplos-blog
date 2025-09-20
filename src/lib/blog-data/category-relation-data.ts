import { cacheAccessFactory } from "../cache-tool";
import { CACHE_EXPIRATION_TIME } from "../CONSTANTS";
import { getAllBlogMetadata } from "./blog-data-service";

export interface ArticleLink {
  link: string;
  title: string;
}

/**
 * 获取指定分类下的所有文章链接
 */
async function getArticleLinksInCategoryInternal(
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

export const getArticleLinksInCategory = cacheAccessFactory(
  getArticleLinksInCategoryInternal,
  ["links"],
  CACHE_EXPIRATION_TIME
);
