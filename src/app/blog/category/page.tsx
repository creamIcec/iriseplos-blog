import CategoryAccordin from "@/components/client/category-accordin";
import Cover from "@/components/cover";
import {
  ArticleLink,
  getArticleLinksInCategory,
} from "@/lib/blog-data/category-relation-data";
import { getCategories } from "@/lib/blog-data/statistics";
import { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "分类",
};

export default async function Category() {
  const categories = await getCategories();

  const categoryPromises = categories.map(async (category) => {
    const articles = await getArticleLinksInCategory(category);
    return [category, articles] as [string, ArticleLink[]];
  });

  const categoryEntries: Map<string, ArticleLink[]> = new Map(
    await Promise.all(categoryPromises)
  );

  return (
    <>
      <div className="relative -mt-16 mb-8">
        <Cover>
          <section className="absolute top-0 left-0 w-full h-full flex flex-row flex-wrap gap-8 justify-center items-center">
            <div className="flex flex-col gap-4 items-center flex-wrap">
              <h1 className="text-3xl md:text-6xl text-center text-white">
                分类
              </h1>
            </div>
          </section>
        </Cover>
      </div>
      {/*分类内容*/}
      <main className="w-full">
        <CategoryAccordin
          categories={categories}
          categoryEntries={categoryEntries}
        />
      </main>
    </>
  );
}
