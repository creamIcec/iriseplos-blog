// scripts/sync-blobs.mjs
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import glob from "fast-glob";
import { put, list } from "@vercel/blob";

// ------------ 配置 ------------
const POSTS_GLOB = "src/posts/**/*.{md,mdx}";
const BLOB_PREFIX = "images";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const CHECK_ONLY = process.env.BLOB_CHECK_ONLY === "1";
// --------------------------------

// === dry-run support (for tests/CI) ===
const DRY_RUN = process.env.BLOB_DRY_RUN === "1";
async function putBlob(key, buf, options) {
  if (DRY_RUN) {
    return { url: `https://mock.image.irise.storage.top/${key}` };
  }
  return await put(key, buf, options);
}
// =====================================

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

// --- 新增：清单与 URL 列表路径 ---
const manifestPath = path.join(repoRoot, "maintain", "blobs.manifest.json");
const urlsListPath = path.join(repoRoot, "maintain", "blobs-urls.txt");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function getContentType(ext) {
  const map = {
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

async function findExistingUrlByKey(key) {
  if (DRY_RUN) return null;
  // 用 key 当作 prefix，精确命中（服务端前缀匹配）
  const res = await list({ prefix: key, token: TOKEN });
  // 兼容不同字段名：pathname / key / url
  const hit = (res?.blobs || []).find(
    (b) => b?.pathname === key || b?.key === key
  );
  return hit?.url ?? null;
}

function parseKvFromTextBlock(text) {
  const out = {};
  const order = [];
  const kvRe = /^\s*([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"\s*$/;
  text.split(/\r?\n/).forEach((line) => {
    const m = line.trim().match(kvRe);
    if (m) {
      const k = m[1];
      const v = m[2];
      if (!(k in out)) order.push(k);
      out[k] = v;
    }
  });
  return { map: out, order };
}

function buildKeyValueBlock(map, prevOrder, eol = "\n") {
  const preferred = ["path", "url", "alt"];
  const rest = Object.keys(map)
    .filter((k) => !preferred.includes(k))
    .sort((a, b) => {
      const ia = prevOrder.indexOf(a);
      const ib = prevOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  const ordered = [...preferred.filter((k) => k in map), ...rest];
  return ordered.map((k) => `${k}="${map[k]}"`).join(eol);
}

function buildLineOffsets(src) {
  const offsets = [0];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "\n") offsets.push(i + 1);
  }
  return offsets;
}
function lcToOffset(line, column, lineOffsets) {
  return (lineOffsets[line - 1] ?? 0) + (column - 1);
}

// --- 新增：清单装载/保存 & URL 集合 ---
async function loadManifest() {
  try {
    const txt = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(txt);
  } catch {
    return { version: 1, updatedAt: null, items: {} };
  }
}
function ensureArray(a) {
  return Array.isArray(a) ? a : [];
}
function addManifestItem(
  manifest,
  { key, sha, ext, size, contentType, localPath, postFile, url }
) {
  const items = manifest.items || (manifest.items = {});
  const id = `${sha}${ext}`; // 以内容哈希+扩展名作为稳定主键
  const existing = items[id] || {};
  const usedIn = new Set(ensureArray(existing.usedIn));
  if (postFile) usedIn.add(postFile);

  items[id] = {
    sha256: sha,
    ext,
    size,
    contentType,
    key, // 在当前提供商的对象 key（如 images/<sha>.<ext>）
    url, // 当前有效访问 URL
    provider: DRY_RUN ? "mock" : "vercel-blob",
    localPath,
    usedIn: Array.from(usedIn).sort(),
    firstSeenAt: existing.firstSeenAt || new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}
async function saveManifestAndUrls(manifest, urlSet) {
  manifest.updatedAt = new Date().toISOString();
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  // 确保 public/ 存在
  await fs.mkdir(path.dirname(urlsListPath), { recursive: true });
  const urls = Array.from(urlSet).sort();
  await fs.writeFile(
    urlsListPath,
    urls.join("\n") + (urls.length ? "\n" : ""),
    "utf8"
  );
}

// --- 处理单文件 ---
async function processFile(absPath, manifest, urlSet) {
  const original = await fs.readFile(absPath, "utf8");
  const lineOffsets = buildLineOffsets(original);

  const ast = unified().use(remarkParse).use(remarkDirective).parse(original);

  const covers = [];
  visit(ast, (node) => {
    if (
      node.type === "containerDirective" &&
      node.name === "cover" &&
      node.position
    ) {
      const { start, end } = node.position;
      if (!start || !end) return;
      const startOffset = lcToOffset(start.line, start.column, lineOffsets);
      const endOffset = lcToOffset(end.line, end.column, lineOffsets);
      covers.push({ startOffset, endOffset });
    }
  });

  if (covers.length === 0) return;

  covers.sort((a, b) => b.startOffset - a.startOffset);

  let working = original;
  let changed = false;

  for (const { startOffset, endOffset } of covers) {
    const blockText = working.slice(startOffset, endOffset);
    const eol = blockText.includes("\r\n") ? "\r\n" : "\n";

    const firstLine = blockText.split(/\r?\n/, 1)[0] ?? "";
    const indentMatch = firstLine.match(/^([ \t]*):::\s*cover\b/);
    const indent = indentMatch ? indentMatch[1] : "";

    const indentEsc = indent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const innerRe = new RegExp(
      "^" +
        indentEsc +
        ":::\\s*cover[^\\n]*" +
        eol +
        "([\\s\\S]*?)" +
        eol +
        indentEsc +
        ":::" +
        "(?:" +
        eol +
        ")?" +
        "$"
    );
    const innerMatch = blockText.match(innerRe);
    if (!innerMatch) continue;

    const innerText = innerMatch[1];
    const { map: kv, order } = parseKvFromTextBlock(innerText);
    const originalUrl = kv.url; // <--- 关键：保存原始 URL

    const hasPath = typeof kv.path === "string" && kv.path.trim() !== "";
    if (!hasPath) continue;

    let absImg;
    if (kv.path.startsWith("/")) {
      absImg = path.resolve(repoRoot, "public", kv.path.slice(1));
    } else {
      absImg = path.resolve(repoRoot, kv.path);
    }

    let buf;
    try {
      buf = await fs.readFile(absImg);
    } catch {
      console.warn(
        `[warn] Missing local file for cover: ${kv.path} (in ${path.relative(
          repoRoot,
          absPath
        )})`
      );
      continue;
    }

    const localSha = sha256(buf);
    const ext = path.extname(absImg) || ".bin";
    const contentType = getContentType(ext);
    const size = buf.length;

    const hasUrl = typeof kv.url === "string" && kv.url.trim() !== "";
    let blobShaFromUrl = null;
    if (hasUrl) {
      const last = kv.url.split("/").pop() || "";
      blobShaFromUrl = last.replace(/\.[a-zA-Z0-9]+$/, "");
    }

    const key = `${BLOB_PREFIX}/${localSha}${ext}`;
    let finalUrl = kv.url; // 初始化为原始 URL

    const needsUpdate = !hasUrl || blobShaFromUrl !== localSha;
    if (needsUpdate) {
      if (CHECK_ONLY) {
        console.log(`[pending] ${path.relative(repoRoot, absPath)} → ${key}`);
        processFile.__hadPending = true;
      } else {
        const existedUrl = await findExistingUrlByKey(key);
        if (existedUrl) {
          console.log(`[reuse] ${key} already exists, skip upload.`);
          finalUrl = existedUrl;
        } else {
          console.log(`[upload] ${path.relative(repoRoot, absPath)} → ${key}`);
          const res = await putBlob(key, buf, {
            access: "public",
            contentType,
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControl: "public, max-age=31536000, immutable",
            token: TOKEN,
          });
          finalUrl = res.url;
        }
      }
    }

    // --- 这是关键的修复逻辑 ---
    // 如果最终 URL 和原始 URL 不一致 (包括原来没有 URL)，则执行重写
    const needsRewrite = !CHECK_ONLY && finalUrl && finalUrl !== originalUrl;
    if (needsRewrite) {
      changed = true;
      kv.url = finalUrl; // 更新 map 以便重建

      const newInnerText = buildKeyValueBlock(kv, order, eol);
      // 重新应用缩进
      const indentedInnerText = newInnerText
        .split(eol)
        .map((line) => indent + line)
        .join(eol);

      const newBlockText =
        `${indent}:::cover${eol}` +
        `${indentedInnerText}${eol}` +
        `${indent}:::`;

      // 在工作副本中替换旧块
      working =
        working.slice(0, startOffset) + newBlockText + working.slice(endOffset);
    }
    // -------------------------

    if (!CHECK_ONLY && finalUrl) {
      addManifestItem(manifest, {
        key,
        sha: localSha,
        ext,
        size,
        contentType,
        localPath: path.relative(repoRoot, absImg),
        postFile: path.relative(repoRoot, absPath),
        url: finalUrl,
      });
      urlSet.add(finalUrl);
    }
  }

  if (changed) {
    await fs.writeFile(absPath, working, "utf8");
  }
}

async function main() {
  if (!TOKEN && !DRY_RUN) {
    console.error("Missing BLOB_READ_WRITE_TOKEN.");
    process.exit(1);
  }

  // 载入旧清单以合并
  const manifest = await loadManifest();
  const urlSet = new Set();

  const files = await glob(POSTS_GLOB, { cwd: repoRoot, absolute: true });
  for (const f of files) {
    await processFile(f, manifest, urlSet);
  }

  if (CHECK_ONLY) {
    // 如果任何 processFile 标记了“有待处理项”，用特殊退出码 2
    if (processFile.__hadPending) {
      console.log("Cover check: pending uploads/rewrite detected.");
      process.exit(2);
    }
    console.log("Cover check: all up-to-date.");
  } else {
    await saveManifestAndUrls(manifest, urlSet);
    console.log("Cover sync complete.");
    console.log(`- Manifest written: ${path.relative(repoRoot, manifestPath)}`);
    console.log(`- URL list written: ${path.relative(repoRoot, urlsListPath)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
