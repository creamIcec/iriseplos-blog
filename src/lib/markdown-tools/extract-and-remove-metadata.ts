// lib/markdown-tools/extract-and-remove-metadata.ts
import type { Heading, Root as MdastRoot, Parent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

type PositionRule = "anywhere" | "beforeFirstHeading" | "afterTitle";
type Strategy = "first" | "last";
type MultipleBehavior = "warn" | "error" | "silent";

export interface RemarkExtractMetadataOptions {
  position?: PositionRule;
  strategy?: Strategy;
  onMultiple?: MultipleBehavior;
  splitPattern?: RegExp;
}

function nodeToText(n: any): string {
  const parts: string[] = [];
  const walk = (x: any) => {
    if (!x) return;
    if (x.type === "text" || x.type === "inlineCode") parts.push(x.value);
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
  const walk = (n: any) => {
    if (!n) return;
    if (n.type === "text" || n.type === "inlineCode") parts.push(n.value);
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  walk(node);
  return parts.join(" ").trim();
}

function normalizeDate(raw: string) {
  const s = raw.trim();

  // 匹配纯日期格式：2025-09-15 / 2025/09/15 / 2025.09.15
  const dateOnly = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/.exec(s);
  if (dateOnly) {
    const [_, y, m, d] = dateOnly;
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
    const [_, y, m, d, h, min, secRaw] = dateTime;

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
      node: any;
      index: number;
      parent: Parent;
      order: number;
      kind: string;
    };

    const hits: Hit[] = [];
    let order = 0;
    let seenHeading = false;
    let titleHit: { node: Heading; index: number; parent: Parent } | undefined;

    // 第一遍：收集所有目标节点
    visit(
      tree,
      (node: any, index: number | undefined, parent: Parent | undefined) => {
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

        // 收集指令节点
        if (!(node && node.type === "containerDirective")) return;
        if (!parent || typeof index !== "number") return;

        const name = String(node.name || "").toLowerCase();
        if (!["subtitle", "date", "category", "tag"].includes(name)) return;

        if (position === "beforeFirstHeading" && seenHeading) return;
        if (position === "afterTitle" && !seenHeading) return;

        hits.push({ node, index, parent, order: order++, kind: name });
      }
    );

    // 处理标题提取
    if (titleHit) {
      const text = headingToText(titleHit.node);
      if (text) {
        (file.data as any).extractedTitle = text;
      }
    }

    // 设置默认值
    (file.data as any).category = "杂项";
    (file.data as any).categories = ["杂项"];
    (file.data as any).tags = [];

    if (hits.length === 0 && !titleHit) {
      return; // 没有任何需要处理的节点
    }

    // 按类型分组
    const grouped = {
      subtitle: [] as Hit[],
      date: [] as Hit[],
      category: [] as Hit[],
      tag: [] as Hit[],
    };

    hits.forEach((h) => {
      (grouped as any)[h.kind].push(h);
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
      const text = nodeToText(hSubtitle.node);
      if (text) (file.data as any).subtitle = text;
    }

    /* ---- date ---- */
    const hDate = pick(grouped.date, "date");
    if (hDate) {
      const raw = nodeToText(hDate.node);
      const norm = normalizeDate(raw);
      (file.data as any).dateRaw = raw;
      (file.data as any).date = norm.ok ? norm.dateOnly : raw;
      (file.data as any).dateISO = norm.ok ? norm.iso : undefined;
      (file.data as any).datetime = norm.ok ? norm.dateTime : raw;
    }

    /* ---- category ---- */
    const hCat = pick(grouped.category, "category");
    if (hCat) {
      const raw = nodeToText(hCat.node);
      const items = raw
        .split(splitPattern)
        .map((s) => s.trim())
        .filter(Boolean);
      const unique = Array.from(new Set(items));
      if (unique.length) {
        (file.data as any).category = unique[0];
        (file.data as any).categories = unique;
        (file.data as any).categoryRaw = raw;
      }
    }

    /* ---- tag ---- */
    const hTag = pick(grouped.tag, "tag");
    if (hTag) {
      const raw = nodeToText(hTag.node);
      const items = raw
        .split(splitPattern)
        .map((s) => s.trim())
        .filter(Boolean);
      const unique = Array.from(new Set(items));
      (file.data as any).tags = unique;
      (file.data as any).tagsRaw = raw;
    }

    // 🔥 关键修复：统一删除所有目标节点（从后往前，避免索引错乱）
    const allNodesToRemove: Array<{ parent: Parent; index: number }> = [];

    // 添加标题到删除列表
    if (titleHit) {
      allNodesToRemove.push({
        parent: titleHit.parent,
        index: titleHit.index,
      });
    }

    // 添加所有指令节点到删除列表
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

    // 对每个 parent，从大到小的 index 开始删除
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
