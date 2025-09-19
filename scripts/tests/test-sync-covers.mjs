// scripts/test-sync-covers.mjs
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(process.cwd());
const postsDir = path.join(repoRoot, "src/posts");
const testDir = path.join(postsDir, "__sync-tests__");
const assetsDir = path.join(repoRoot, "assets-local");

// ---------- utils ----------
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const ensureDir = async (p) => fs.mkdir(p, { recursive: true });
const rel = (p) => path.relative(repoRoot, p).replace(/\\/g, "/");

function comboName(hasCover, hasOther, hasBody) {
  return `case_${hasCover ? "C" : "c"}${hasOther ? "O" : "o"}${
    hasBody ? "B" : "b"
  }`;
}

function buildMarkdown({
  hasCover,
  hasOther,
  hasBody,
  imgRelPath,
  urlMatched,
  imgSha,
}) {
  const lines = [];
  if (hasOther) {
    lines.push(":::title", "My Test Title", ":::", "");
  }
  if (hasCover) {
    lines.push(":::cover");
    lines.push(`path="${imgRelPath}"`);
    if (urlMatched) {
      const fakeUrl = `https://mock.vercel-storage.com/images/${imgSha}.webp`;
      lines.push(`url="${fakeUrl}"`);
    }
    lines.push('alt="Alt text for testing"');
    lines.push(":::", "");
  }
  if (hasBody) {
    lines.push("# Heading", "", "Some **body** content here.", "");
  }
  if (lines.length === 0) lines.push("");
  return lines.join("\n");
}

function locateFirstCoverSpan(src) {
  const startIdx = src.indexOf(":::cover");
  if (startIdx === -1) return null;
  // 找到紧随的 "\n:::"（块结束标记所在的行首）
  const endMarkerIdx = src.indexOf("\n:::", startIdx + ":::cover".length);
  if (endMarkerIdx === -1) return null;
  const after = endMarkerIdx + 4; // 跳过 "\n:::"
  const tail = src.slice(after, after + 2);
  const eol = tail.match(/^\r?\n/)?.[0] ?? "";
  return { start: startIdx, end: after + eol.length };
}

// ---------- main ----------
async function main() {
  // 1) 准备测试资源：随机内容图片（只用于哈希）
  await ensureDir(assetsDir);
  const imgBuf = crypto.randomBytes(256);
  const imgSha = sha256(imgBuf);
  const imgFile = path.join(assetsDir, "sync-test.webp");
  await fs.writeFile(imgFile, imgBuf);
  const imgRelPath = rel(imgFile);

  // 2) 生成 8 种等价类组合
  await ensureDir(testDir);
  const combos = [];
  for (const hasCover of [false, true]) {
    for (const hasOther of [false, true]) {
      for (const hasBody of [false, true]) {
        combos.push({ hasCover, hasOther, hasBody });
      }
    }
  }

  const originals = new Map(); // filePath -> originalContent
  for (const c of combos) {
    const name = comboName(c.hasCover, c.hasOther, c.hasBody);
    const filePath = path.join(testDir, `${name}.md`);
    const urlMatched = c.hasCover; // 有 cover 的默认放匹配 URL
    const md = buildMarkdown({ ...c, imgRelPath, urlMatched, imgSha });
    await fs.writeFile(filePath, md, "utf8");
    originals.set(filePath, md);
  }

  // 3) 追加覆盖用例（path 正确，url 带错误哈希 → 期望被覆盖）
  const mismatchCaseFile = path.join(testDir, "case_cover_url_mismatch.md");
  const fakeWrongSha = "deadbeef1234567890abcdef";
  const wrongUrl = `https://mock.vercel-storage.com/images/${fakeWrongSha}.webp`;
  const mismatchMd = [
    ":::cover",
    `path="${imgRelPath}"`,
    `url="${wrongUrl}"`,
    'alt="Mismatch test"',
    ":::",
    "",
    "Some body content here for mismatch test.",
    "",
  ].join("\n");
  await fs.writeFile(mismatchCaseFile, mismatchMd, "utf8");
  originals.set(mismatchCaseFile, mismatchMd);

  // 4) 运行同步脚本（干跑，不联网）
  const syncPath = path.join(repoRoot, "scripts", "sync-blobs.mjs");
  const run = spawnSync(process.execPath, [syncPath], {
    env: {
      ...process.env,
      BLOB_DRY_RUN: "1",
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || "dummy",
    },
    stdio: "inherit",
    cwd: repoRoot,
  });
  if (run.status !== 0) {
    console.error(
      "\n[TEST] sync-blobs.mjs exited with non-zero status:",
      run.status
    );
    process.exit(run.status || 1);
  }

  // 5) 校验
  let failed = 0;

  for (const [filePath, before] of originals.entries()) {
    const after = await fs.readFile(filePath, "utf8");
    const isMismatch = path.basename(filePath) === "case_cover_url_mismatch.md";
    const hasCover = before.includes(":::cover");

    if (isMismatch) {
      if (after.includes(fakeWrongSha)) {
        console.error(`[FAIL] ${rel(filePath)} url was not replaced.`);
        failed++;
      } else if (!after.includes(imgSha)) {
        console.error(
          `[FAIL] ${rel(filePath)} url does not contain expected sha ${imgSha}.`
        );
        failed++;
      } else {
        console.log(`[PASS] ${rel(filePath)} url was correctly replaced ✅`);
      }
      continue;
    }

    if (!hasCover) {
      // 没 cover：整文件应保持不变
      if (after !== before) {
        console.error(
          `[FAIL] ${rel(filePath)} should remain unchanged (no cover present).`
        );
        failed++;
      }
      continue;
    }

    // 有 cover：块外内容必须完全一致
    const spanBefore = locateFirstCoverSpan(before);
    const spanAfter = locateFirstCoverSpan(after);
    if (!spanBefore || !spanAfter) {
      console.error(
        `[FAIL] ${rel(filePath)} cover block not detected consistently.`
      );
      failed++;
      continue;
    }

    const prefixBefore = before.slice(0, spanBefore.start);
    const suffixBefore = before.slice(spanBefore.end);
    const prefixAfter = after.slice(0, spanAfter.start);
    const suffixAfter = after.slice(spanAfter.end);

    if (prefixBefore !== prefixAfter || suffixBefore !== suffixAfter) {
      console.error(
        `[FAIL] ${rel(filePath)} content outside cover changed unexpectedly.`
      );
      failed++;
    }

    // cover 内应至少包含 path=，且最终要有 url=（匹配或新增）
    const inner = after.slice(spanAfter.start, spanAfter.end);
    if (!/^\s*path\s*=\s*".+?"/m.test(inner)) {
      console.error(
        `[FAIL] ${rel(filePath)} cover block missing path= after sync.`
      );
      failed++;
    }
    if (!/^\s*url\s*=\s*".+?"/m.test(inner)) {
      console.error(
        `[FAIL] ${rel(filePath)} cover block missing url= after sync.`
      );
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`\n[TEST RESULT] ${failed} case(s) failed.`);
    process.exit(1);
  } else {
    console.log("\n[TEST RESULT] All cases passed ✅");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
