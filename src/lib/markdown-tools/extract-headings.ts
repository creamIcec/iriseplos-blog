import GithubSlugger from "github-slugger";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { Heading } from "../markdown-data";

export async function extractHeadings(markdown: string): Promise<Heading[]> {
  const tree = unified().use(remarkParse).parse(markdown);
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();

  visit(tree, "heading", (node) => {
    const depth = node.depth as Heading["depth"];
    // 把子节点（text、inlineCode、emphasis等）拼成纯文本
    const text = node.children
      .map((c) =>
        "value" in c
          ? c.value
          : "children" in c
          ? //@ts-expect-error cc is undermined
            c.children?.map((cc) => cc.value ?? "").join("")
          : ""
      )
      .join("")
      .trim();

    if (text) {
      headings.push({
        depth,
        text,
        id: slugger.slug(text), // 和 GitHub 一样的 slug 规则
      });
    }
  });

  return headings;
}
