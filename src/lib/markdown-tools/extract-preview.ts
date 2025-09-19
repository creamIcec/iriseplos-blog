import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";

export async function debugDirectives(markdown: string) {
  const processor = unified().use(remarkParse).use(remarkDirective);

  const ast = processor.parse(markdown) as Root;

  console.log(
    "AST children:",
    ast.children.slice(0, 5).map((node) => ({
      type: node.type,
      position: node.position,
      // @ts-expect-error node has name
      name: node.name,
      data: node.data,
    }))
  );

  visit(ast, (node, index, parent) => {
    if (parent === ast && index! < 3) {
      // 只看前3个节点
      console.log(`Node ${index}:`, {
        type: node.type,
        // @ts-expect-error node has name
        name: node.name,
        // @ts-expect-error node has attributes
        attributes: node.attributes,
      });
    }
  });
}

export async function extractPreview(
  markdown: string,
  maxLength: number = 200
): Promise<string> {
  const processor = unified().use(remarkParse).use(remarkDirective);

  const ast = processor.parse(markdown) as Root;

  let textContent = "";
  let shouldStop = false;
  let contentStarted = false;

  for (let i = 0; i < ast.children.length; i++) {
    const node = ast.children[i];

    if (!contentStarted) {
      if (
        node.type === "heading" || // 跳过标题
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective" ||
        node.type === "yaml"
      ) {
        continue;
      } else {
        contentStarted = true; // 找到正文内容
      }
    }

    // 提取正文文本
    if (contentStarted) {
      visit(node, "text", (textNode) => {
        if (shouldStop) return;

        textContent += textNode.value + " ";

        if (textContent.length > maxLength) {
          shouldStop = true;
        }
      });

      if (shouldStop) break;
    }
  }

  const cleanText = textContent.replace(/\s+/g, " ").trim();

  return cleanText.length > maxLength
    ? cleanText.substring(0, maxLength).trim() + "..."
    : cleanText;
}
