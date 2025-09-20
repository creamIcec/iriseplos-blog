import fs from "fs";
import path from "path";

import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrism from "rehype-prism-plus";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

import { unified } from "unified";

import remarkExtractMetadata from "./markdown-tools/extract-and-remove-metadata";
import { extractHeadings } from "./markdown-tools/extract-headings";
import rehypeCodeToolbar from "./markdown-tools/rehype-code-toolbar";
import { extractMetadata, pickCoverHref, postsDir } from "./blog-data/util";
import { cacheAccessFactory } from "./cache-tool";
import { CACHE_EXPIRATION_TIME } from "./CONSTANTS";

export type Heading = {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id: string; // 方便锚点跳转
};

export type PostData = {
  title: string;
  subtitle?: string;
  datetime: string; // 或 Date，视你渲染器而定
  category?: string;
  tags?: string[];
  headings: Heading[];
  content: string; // HTML
  coverHref?: string; // 渲染用的最终地址
  coverAlt?: string;
  filename?: string; //和slug一致
};

export async function renderMarkdownToHtml(markdown: string, filename: string) {
  // 先提取元数据
  const metadata = await extractMetadata(markdown, filename);

  // 然后进行完整的渲染处理
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm) // 代码块, 表格等
    .use(remarkDirective)
    .use(remarkExtractMetadata, {
      // 这里会删除元数据节点
      position: "anywhere",
      strategy: "first",
      onMultiple: "warn",
    })
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true }) //转换成rehype, 允许原始html通过
    .use(rehypeRaw) //处理原始HTML节点, 准备后续特殊渲染
    .use(rehypeKatex) //处理latex公式
    .use(rehypeSlug) //标题ID(代码块被先处理了, 不会误判如python #号注释)
    .use(rehypePrism, {
      ignoreMissing: true,
      showLineNumbers: true,
    })
    .use(rehypeCodeToolbar)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { ariaLabel: "Permalink" },
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return {
    ...metadata, // 使用提前提取的元数据
    content: String(file), // 只有这里是处理后的HTML内容
  };
}

function ensureSafeId(id: string) {
  // 只允许字母数字、连字符、下划线，防止 ../ 穿越
  if (!/^[\w-]+$/.test(id)) {
    throw new Error(`Invalid post id: ${id}`);
  }
}

async function getPostDataInternal(id: string): Promise<PostData | undefined> {
  ensureSafeId(id);

  const fullPath = path.join(postsDir, `${id}.md`);

  if (!fs.existsSync(fullPath)) {
    return undefined;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");

  const {
    title,
    subtitle,
    category,
    datetime,
    tags,
    content,
    coverUrl,
    coverAlt,
    coverPath,
    filename,
  } = await renderMarkdownToHtml(fileContents, `${id}.md`);

  const TOCHeadings = await extractHeadings(fileContents);

  const coverHref = pickCoverHref({
    envNode: process.env.NODE_ENV,
    envVercel: process.env.VERCEL_ENV,
    coverUrl,
    coverPath,
  });

  return {
    title: title || "",
    subtitle,
    datetime: datetime || "2018-03-26",
    category,
    tags,
    headings: TOCHeadings,
    content: String(content),
    coverHref,
    coverAlt,
    filename,
  };
}

// 导出 API。在开发环境下为了实时预览, 不走缓存; 生产环境下使用10分钟的缓存策略
export const getPostData = cacheAccessFactory(
  getPostDataInternal,
  ["post"],
  CACHE_EXPIRATION_TIME
);
