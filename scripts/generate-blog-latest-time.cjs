// scripts/generate-blog-latest-time.cjs

const { execSync } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");

const PUBLIC_DIR = path.join(process.cwd(), "public");
const POSTS_DIR = path.join(process.cwd(), "src/posts");
const ACT_OUT = path.join(process.cwd(), "public/activity-data.json");
const LASTMOD_OUT = path.join(process.cwd(), "public/blog-lastmod.json");

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
      .toString()
      .trim();
  } catch (e) {
    console.error("Git命令执行失败:", e.message);
    return "";
  }
}

function isArticle(name) {
  return /\.(md|mdx)$/i.test(name);
}
function toSlug(name) {
  return name.replace(/\.(md|mdx)$/i, "");
}

async function generateActivityDataAndLastmod() {
  // 文章文件
  let files = [];
  try {
    files = (await fs.readdir(POSTS_DIR)).filter(isArticle);
    console.log(`找到 ${files.length} 个文章文件`);
  } catch (e) {
    console.error("读取 posts 目录失败: ", POSTS_DIR, e?.message || e);
    return;
  }

  // 活动热力图(近365天)
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 365);
  const activity = {};
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    activity[d.toISOString().slice(0, 10)] = 0;
  }

  const postsRelativePath = path.relative(process.cwd(), POSTS_DIR);
  const cmd = `git log --date=iso --name-only --format="%cI" -- "${postsRelativePath}/*.md" "${postsRelativePath}/*.mdx"`;
  console.log(`执行命令: ${cmd}`);

  const gitLog = sh(cmd);

  if (!gitLog) {
    console.error("无法获取Git历史记录");
  } else {
    const lines = gitLog.split("\n");
    let currentDate = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
        currentDate = line;
      } else if (currentDate && line.startsWith(postsRelativePath)) {
        if (isArticle(line)) {
          const dateKey = currentDate.slice(0, 10);
          if (dateKey in activity) activity[dateKey] += 1;
        }
      }
    }
  }

  // ===== 新增：生成每篇文章的最后提交时间 =====
  const lastmodMap = {};

  for (const f of files) {
    const full = path.join(POSTS_DIR, f);
    const relativePath = path.relative(process.cwd(), full);

    // 取该文件最后一次提交时间（跟随重命名）
    let last = sh(
      `git log -1 --date=iso --format="%cI" --follow -- "${relativePath}"`
    );

    // 没有 git 历史时的兜底：用文件 mtime（本地跑脚本时至少能用）
    if (!last) {
      try {
        const st = await fs.stat(full);
        last = new Date(st.mtime).toISOString();
      } catch {}
    }

    if (last) {
      lastmodMap[toSlug(f)] = last;
    }
  }

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(ACT_OUT, JSON.stringify(activity, null, 2), "utf8");
  await fs.writeFile(LASTMOD_OUT, JSON.stringify(lastmodMap, null, 2), "utf8");
  console.log("Generated:", ACT_OUT);
  console.log("Generated:", LASTMOD_OUT);
}

generateActivityDataAndLastmod().catch(console.error);
