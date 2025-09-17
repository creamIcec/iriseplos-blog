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
import { extractMetadata, postsDir } from "./blog-data/util";

export type Heading = {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id: string; // 方便锚点跳转
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

export async function getPostData(id: string) {
  const fullPath = path.join(postsDir, `${id}.md`);

  if (!fs.existsSync(fullPath)) {
    return undefined;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");

  const { title, subtitle, category, datetime, tags, content } =
    await renderMarkdownToHtml(fileContents, `${id}.md`);
  console.log(datetime);
  const TOCHeadings = await extractHeadings(fileContents);

  return {
    title, //标题
    subtitle, //副标题
    datetime, //日期时间
    category, //类型
    tags,
    headings: TOCHeadings, //目录项
    content: String(content), //渲染成HTML的内容
  };
}
