import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkExtractMetadata from "../markdown-tools/extract-and-remove-metadata";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

import path from "path";
import fs from "fs";
import { extractPreview } from "../markdown-tools/extract-preview";

import type { Data } from "unified";

export interface BlogMetadata {
  title?: string;
  subtitle?: string;
  // 日期 (多种格式)
  datetime?: string;
  dateISO?: string;
  dateRaw?: string;
  // 分类
  category?: string;
  categories?: string[];
  categoryRaw?: string;

  // 标签
  tags?: string[];
  tagsRaw?: string[];

  //预览
  preview?: string;

  //文件名
  filename?: string;

  //封面图
  coverUrl?: string;
  coverAlt?: string;
  coverPath?: string;
}

export const postsDir = path.join(process.cwd(), "src/posts");

type RawBlogMetaData = Data & {
  extractedTitle: string;
  subtitle: string;
  datetime: string;
  dateISO: string;
  dateRaw: string;
  category: string;
  categories: string[];
  categoryRaw: string;
  tags: string[];
  tagsRaw: string[];
  coverUrl: string;
  coverAlt: string;
  coverPath: string;
};

export async function extractMetadata(
  markdown: string,
  fileName: string
): Promise<BlogMetadata> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkExtractMetadata, {
      position: "anywhere",
      strategy: "first",
      onMultiple: "warn",
    })
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);

  const preview = await extractPreview(markdown, 50);

  const data = file.data as unknown as RawBlogMetaData;

  return {
    // 标题 (支持 H1 和 file.data)
    title: data?.extractedTitle ?? null,
    subtitle: data?.subtitle ?? null,

    // 日期 (多种格式)
    datetime: data?.datetime ?? null,
    dateISO: data?.dateISO ?? null,
    dateRaw: data?.dateRaw ?? null,

    // 分类
    category: data?.category ?? "杂项",
    categories: data?.categories ?? ["杂项"],
    categoryRaw: data?.categoryRaw ?? null,

    // 标签
    tags: data?.tags ?? [],
    tagsRaw: data?.tagsRaw ?? null,

    //预览
    preview,

    //文件名(去掉.md)
    filename: fileName.slice(0, -3),

    coverUrl: data?.coverUrl,
    coverAlt: data?.coverAlt,
    coverPath: data?.coverPath,
  };
}

export async function extractAllMetadata() {
  const allFileNames = fs.readdirSync(postsDir);

  const allMetadata = await Promise.all(
    allFileNames.map(async (name) => {
      const content = fs.readFileSync(path.join(postsDir, name), "utf8");
      return await extractMetadata(content, name);
    })
  );

  return allMetadata;
}
