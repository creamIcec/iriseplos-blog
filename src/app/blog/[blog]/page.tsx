import BlogTitleSetter from "@/components/client/blog-title-setter";
import CategoryLink from "@/components/client/category-link";
import CodeToolbarClient from "@/components/client/code-toolbar";
import Cover from "@/components/cover";
import TOC from "@/components/toc";
import { getArticleLinksInCategory } from "@/lib/blog-data/category-relation-data";
import { getPostData } from "@/lib/markdown-data";
import { Card, Icon, List, ListItem, Ripple } from "actify";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: { blog: string };
}): Promise<Metadata> {
  const { blog } = params;
  const data = await getPostData(blog);

  if (data === undefined) {
    return {
      title: "欢迎随时回来。",
    };
  }

  return {
    title: `${data.title}`,
    description: data.subtitle || `阅读关于 ${data.title} 的文章`,
    openGraph: {
      title: data.title,
      description: data.subtitle || `阅读关于 ${data.title} 的文章`,
      type: "article",
      publishedTime: data.datetime,
      tags: data.tags,
    },
  };
}

export default async function Blog({
  params,
}: {
  params: Promise<{ blog: string }>;
}) {
  const { blog } = await params;
  const data = await getPostData(blog);

  if (data === undefined) {
    notFound();
  }

  const {
    title,
    subtitle,
    datetime,
    category,
    tags,
    headings,
    content,
    coverHref,
    coverAlt,
  } = data;

  const relatedArticles = await getArticleLinksInCategory(category);

  return (
    <>
      <BlogTitleSetter title={title} />
      <Cover src={coverHref} alt={coverAlt} enableMask={false} />
      <div className="flex flex-row gap-2 text-on-surface justify-between p-4">
        {/*侧边栏*/}
        <aside className="flex-col gap-4 min-w-48 max-w-72 ml-4 hidden md:flex">
          <Card variant="filled">
            <section className="h-full w-full p-4 flex flex-col flex-wrap gap-4">
              <h3 className="text-2xl text-on-primary">文章信息</h3>
              <CategoryLink
                category={category}
                datetime={datetime}
                tags={tags}
              />
            </section>
          </Card>
          <div className="sticky top-24 left-0 z-10 flex flex-col gap-4">
            <Card variant="outlined">
              <section className="h-full w-full p-4 flex flex-col flex-wrap gap-4">
                <h3 className="text-2xl font-light">本文目录</h3>
                {<TOC headings={headings} />}
              </section>
            </Card>
            {relatedArticles.length > 1 && (
              <Card variant="filled">
                <section className="h-full w-full p-4 flex flex-col flex-wrap gap-4">
                  <h3 className="text-2xl font-light text-on-secondary">
                    同栏目的其他文章
                  </h3>
                  <List className="rounded-lg min-h-48 max-h-256 overflow-auto! scrollbar-material scrollbar-gutter-stable">
                    {relatedArticles
                      .filter((link) => link.link !== blog)
                      .map((link) => (
                        <Link key={link.link} href={`/blog/${link.link}`}>
                          <ListItem>{link.title}</ListItem>
                        </Link>
                      ))}
                  </List>
                </section>
              </Card>
            )}
          </div>
        </aside>

        <div className="w-px bg-outline-variant ml-4 mr-4 self-stretch hidden md:block" />

        <main className="flex flex-col flex-1 min-w-0">
          {/*标题部分*/}
          <div className="max-w-[512px] flex flex-wrap font-article flex-col gap-6">
            <h1 className="text-4xl/snug">{title}</h1>
            <span className="text-xl/tight font-bold">{subtitle}</span>
            <div className="relative text-on-primary rounded-4xl bg-primary flex items-center justify-evenly max-w-84 p-2 gap-4">
              <Ripple />
              <div className="flex gap-1 items-center">
                <Icon>Person</Icon>
                <span>Apryes</span>
              </div>
              <div className="flex gap-1 items-center">
                <Icon>Date_Range</Icon>
                <p>{datetime}</p>
              </div>
            </div>
          </div>
          {/*内容部分*/}
          <CodeToolbarClient />
          <div
            className="pt-4 pr-4 max-w-full font-article text-lg/relaxed markdown-content"
            dangerouslySetInnerHTML={{ __html: content }}
          ></div>
        </main>
      </div>
    </>
  );
}
