import type { Root } from "hast";
import { h } from "hastscript";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

function toBadge(langClass?: string) {
  const m = langClass?.match(/language-([\w+-]+)/i);
  const raw = (m?.[1] ?? "text").toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    bash: "bash",
    shell: "shell",
    sh: "shell",
    html: "html",
    css: "css",
    md: "markdown",
    markdown: "markdown",
    py: "python",
    python: "python",
    java: "java",
    go: "go",
    rust: "rust",
    c: "c",
    cpp: "cpp",
    cxx: "cpp",
    yaml: "yaml",
    yml: "yaml",
    sql: "sql",
  };

  return map[raw] ?? raw;
}

/**
 * <pre><code class="language-xxx">...</code></pre>
 *  => 在 pre 里插入 toolbar（不包外层、不加边框）
 *
 * <pre class="m3-pre" data-language="TS">
 *   <div class="m3-pre__toolbar" data-lang="TS">
 *     <span class="m3-pre__lang">TS</span>
 *     <span class="m3-pre__copy-mount" data-copy-mount></span> <-- 客户端在此挂载 Actify IconButton
 *   </div>
 *   <code class="language-ts">...</code>
 * </pre>
 */
const rehypeCodeToolbar: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node) => {
    if (node.tagName !== "pre") return;
    const code = node.children?.[0];
    if (!code || code.type !== "element" || code.tagName !== "code") return;

    const className: string[] = Array.isArray(code.properties?.className)
      ? (code.properties!.className as string[])
      : typeof code.properties?.className === "string"
      ? (code.properties!.className as string).split(/\s+/)
      : [];

    const langClass = className.find((c) => c.startsWith("language-"));
    const badge = toBadge(langClass);

    // 给 pre 打上类名和 data
    node.properties = node.properties || {};
    const preClass = new Set<string>([
      ...((node.properties.className as string[]) || []),
      "m3-pre",
    ]);
    node.properties.className = Array.from(preClass);
    (node.properties as any)["data-language"] = badge;

    // 插入 toolbar 到 pre 的开头
    const toolbar = h("div.m3-pre__toolbar", { "data-lang": badge }, [
      h("span.m3-pre__lang", badge),
      h("span.m3-pre__copy-mount", { "data-copy-mount": "" }), // 挂载点
    ]);

    node.children = [toolbar, ...node.children];
  });
};

export default rehypeCodeToolbar;
