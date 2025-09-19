// lib/markdown-tools/extract-and-remove-metadata.ts
import type { Heading, Root as MdastRoot, Parent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { ContainerDirective } from "mdast-util-directive";

type PositionRule = "anywhere" | "beforeFirstHeading" | "afterTitle";
type Strategy = "first" | "last";
type MultipleBehavior = "warn" | "error" | "silent";

export interface RemarkExtractMetadataOptions {
  position?: PositionRule;
  strategy?: Strategy;
  onMultiple?: MultipleBehavior;
  splitPattern?: RegExp;
}

// 防止类型报错
interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
}

// 解析 cover 指令内部的 key="value"（逐行）
function parseCoverKV(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  const kvRe = /^\s*([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"\s*$/;
  text.split(/\r?\n/).forEach((line) => {
    const m = kvRe.exec(line.trim());
    if (m) map[m[1]] = m[2];
  });
  return map;
}

function nodeToText(n: MarkdownNode): string {
  const parts: string[] = [];
  const walk = (x: MarkdownNode) => {
    if (!x) return;
    if (x.value && (x.type === "text" || x.type === "inlineCode")) {
      parts.push(x.value);
    }
    if (x.type === "break") parts.push("\n");
    if (x.type === "paragraph") parts.push("\n");
    if (Array.isArray(x.children)) x.children.forEach(walk);
  };
  walk(n);
  return parts.join("").replace(/\s+\n/g, "\n").trim();
}

// 标题节点转文本（支持链接、强调等内联元素）
function headingToText(node: Heading): string {
  const parts: string[] = [];
  const walk = (x: MarkdownNode) => {
    if (!x) return;
    if (x.value && (x.type === "text" || x.type === "inlineCode"))
      parts.push(x.value);
    if (Array.isArray(x.children)) x.children.forEach(walk);
  };
  walk(node);
  return parts.join(" ").trim();
}

function normalizeDate(raw: string) {
  const s = raw.trim();

  // 匹配纯日期格式：2025-09-15 / 2025/09/15 / 2025.09.15
  const dateOnly = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/.exec(s);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return {
      ok: true,
      dateOnly: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
      iso: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
    };
  }

  // 匹配日期 + 时间（秒数可选）
  const dateTime =
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(
      s
    );
  if (dateTime) {
    const [, y, m, d, h, min, secRaw] = dateTime;

    const dateOnly = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

    let timeOnly: string;
    if (secRaw != null) {
      timeOnly = `${h.padStart(2, "0")}:${min.padStart(
        2,
        "0"
      )}:${secRaw.padStart(2, "0")}`;
    } else {
      timeOnly = `${h.padStart(2, "0")}:${min.padStart(2, "0")}`;
    }

    return {
      ok: true,
      dateOnly,
      iso: `${dateOnly}T${h.padStart(2, "0")}:${min.padStart(2, "0")}:${(
        secRaw ?? "00"
      ).padStart(2, "0")}`, // ISO 要完整
      dateTime: `${dateOnly} ${timeOnly}`, // 用户可见时不补秒
    };
  }

  // 尝试用 Date 构造函数解析其他格式
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const sec = String(d.getSeconds()).padStart(2, "0");

    const hasTime = d.getHours() || d.getMinutes() || d.getSeconds();

    return {
      ok: true,
      dateOnly: `${y}-${m}-${dd}`,
      iso: d.toISOString(),
      dateTime: hasTime
        ? `${y}-${m}-${dd} ${h}:${min}${d.getSeconds() ? ":" + sec : ""}`
        : `${y}-${m}-${dd}`,
    };
  }

  return { ok: false };
}

export const remarkExtractMetadata: Plugin<
  [RemarkExtractMetadataOptions?],
  MdastRoot
> = (opts = {}) => {
  const {
    position = "anywhere",
    strategy = "first",
    onMultiple = "warn",
    splitPattern = /[,;|]\s*|\n+/g,
  } = opts;

  return (tree, file) => {
    type Hit = {
      node: unknown;
      index: number;
      parent: Parent;
      order: number;
      kind: string;
    };

    const hits: Hit[] = [];
    let order = 0;
    let seenHeading = false;
    let titleHit: { node: Heading; index: number; parent: Parent } | undefined;

    // 第一遍：收集所有目标节点（含 cover）
    visit(
      tree,
      (node, index: number | undefined, parent: Parent | undefined) => {
        // 记录第一个 H1 标题
        if (
          node?.type === "heading" &&
          (node as Heading).depth === 1 &&
          !titleHit
        ) {
          if (parent && typeof index === "number") {
            titleHit = { node: node as Heading, index, parent };
          }
          seenHeading = true;
          return;
        }

        if (node?.type === "heading") {
          seenHeading = true;
          return;
        }

        if (!(node && node.type === "containerDirective")) return;
        if (!parent || typeof index !== "number") return;

        const name = String(
          (node as ContainerDirective).name || ""
        ).toLowerCase();

        if (!["subtitle", "date", "category", "tag", "cover"].includes(name))
          return;

        if (position === "beforeFirstHeading" && seenHeading) return;
        if (position === "afterTitle" && !seenHeading) return;

        hits.push({ node, index, parent, order: order++, kind: name });
      }
    );

    // 处理标题提取
    if (titleHit) {
      const text = headingToText(titleHit.node);
      if (text) {
        file.data.extractedTitle = text;
      }
    }

    // 设置默认值
    file.data.category = "杂项";
    file.data.categories = ["杂项"];
    file.data.tags = [];

    if (hits.length === 0 && !titleHit) {
      return; // 没有任何需要处理的节点
    }

    // 按类型分组（包含 cover）
    const grouped: {
      subtitle: Hit[];
      date: Hit[];
      category: Hit[];
      tag: Hit[];
      cover: Hit[];
      [key: string]: Hit[];
    } = {
      subtitle: [],
      date: [],
      category: [],
      tag: [],
      cover: [],
    };

    hits.forEach((h) => {
      grouped[h.kind].push(h);
    });

    // 策略选择器
    const pick = (arr: Hit[], kindName: string) => {
      if (arr.length === 0) return null;
      if (arr.length > 1) {
        const msg = `Found ${arr.length} :::${kindName} blocks; using ${strategy}.`;
        if (onMultiple === "warn") file.message(msg);
        if (onMultiple === "error") {
          file.fail(msg);
          return null;
        }
      }
      return strategy === "first"
        ? arr[0]
        : arr.reduce((a, b) => (a.order > b.order ? a : b));
    };

    // 处理各种元数据（只提取值，稍后统一删除）

    /* ---- subtitle ---- */
    const hSubtitle = pick(grouped.subtitle, "subtitle");
    if (hSubtitle) {
      const text = nodeToText(hSubtitle.node as MarkdownNode);
      if (text) file.data.subtitle = text;
    }

    /* ---- date ---- */
    const hDate = pick(grouped.date, "date");
    if (hDate) {
      const raw = nodeToText(hDate.node as MarkdownNode);
      const norm = normalizeDate(raw);
      file.data.dateRaw = raw;
      file.data.date = norm.ok ? norm.dateOnly : raw;
      file.data.dateISO = norm.ok ? norm.iso : undefined;
      file.data.datetime = norm.ok ? norm.dateTime : raw;
    }

    /* ---- category ---- */
    const hCat = pick(grouped.category, "category");
    if (hCat) {
      const raw = nodeToText(hCat.node as MarkdownNode);
      const items = raw
        .split(splitPattern)
        .map((s) => s.trim())
        .filter(Boolean);
      const unique = Array.from(new Set(items));
      if (unique.length) {
        file.data.category = unique[0];
        file.data.categories = unique;
        file.data.categoryRaw = raw;
      }
    }

    /* ---- tag ---- */
    const hTag = pick(grouped.tag, "tag");
    if (hTag) {
      const raw = nodeToText(hTag.node as MarkdownNode);
      const items = raw
        .split(splitPattern)
        .map((s) => s.trim())
        .filter(Boolean);
      const unique = Array.from(new Set(items));
      file.data.tags = unique;
      file.data.tagsRaw = raw;
    }

    /* ---- cover ---- */
    const hCover = pick(grouped.cover, "cover");
    if (hCover) {
      const raw = nodeToText(hCover.node as unknown as MarkdownNode);
      const kv = parseCoverKV(raw);
      const src = (kv.url || kv.path || "").trim();
      const alt = (kv.alt || "").trim();

      file.data.coverUrl = src || undefined;
      file.data.coverAlt = alt || undefined;
      file.data.coverPath = kv.path || undefined;
    }

    // 🔥 统一删除：标题 + 所有被命中的指令（含 cover）
    const allNodesToRemove: Array<{ parent: Parent; index: number }> = [];

    if (titleHit) {
      allNodesToRemove.push({
        parent: titleHit.parent,
        index: titleHit.index,
      });
    }

    hits.forEach((hit) => {
      allNodesToRemove.push({
        parent: hit.parent,
        index: hit.index,
      });
    });

    // 按 parent 分组，然后按 index 降序排序删除（避免索引变化影响）
    const grouped_by_parent = new Map<Parent, number[]>();
    allNodesToRemove.forEach(({ parent, index }) => {
      if (!grouped_by_parent.has(parent)) {
        grouped_by_parent.set(parent, []);
      }
      grouped_by_parent.get(parent)!.push(index);
    });

    grouped_by_parent.forEach((indices, parent) => {
      indices.sort((a, b) => b - a); // 降序
      indices.forEach((index) => {
        if (parent.children && index < parent.children.length) {
          parent.children.splice(index, 1);
        }
      });
    });
  };
};

export default remarkExtractMetadata;
