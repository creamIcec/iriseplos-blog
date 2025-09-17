import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";

export async function debugDirectives(markdown: string) {
  const processor = unified().use(remarkParse).use(remarkDirective);

  const ast = processor.parse(markdown) as Root;

  // ✅ 打印前几个节点，看看结构
  console.log(
    "AST children:",
    ast.children.slice(0, 5).map((node) => ({
      type: node.type,
      position: node.position,
      // @ts-ignore
      name: node.name,
      // @ts-ignore
      data: node.data,
    }))
  );

  visit(ast, (node, index, parent) => {
    if (parent === ast && index! < 3) {
      // 只看前3个节点
      console.log(`Node ${index}:`, {
        type: node.type,
        // @ts-ignore
        name: node.name,
        // @ts-ignore
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

  // ✅ 跳过开头的元数据区域
  for (let i = 0; i < ast.children.length; i++) {
    const node = ast.children[i];

    if (!contentStarted) {
      // ✅ 跳过标题、各种 directive 和元数据
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
      visit(node, "text", (textNode: any) => {
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
