// scripts/generate-blog-latest-time.cjs

const { execSync } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");

const PUBLIC_DIR = path.join(process.cwd(), "public");
const POSTS_DIR = path.join(process.cwd(), "src/posts");
const ACT_OUT = path.join(process.cwd(), "public/activity-data.json");

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

async function generateActivityData() {
  // 文章文件
  let files = [];
  try {
    files = (await fs.readdir(POSTS_DIR)).filter((f) => /\.(md|mdx)$/.test(f));
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

  // 获取所有博客文章的目录相对路径
  const postsRelativePath = path.relative(process.cwd(), POSTS_DIR);

  // 不使用 --follow，而是使用通配符获取所有文章提交记录
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

      // 日期行（ISO格式）
      if (line.match(/^\d{4}-\d{2}-\d{2}T/)) {
        currentDate = line;
      }
      // 文件路径行
      else if (currentDate && line.startsWith(postsRelativePath)) {
        const filePath = line;
        if (
          filePath &&
          (filePath.endsWith(".md") || filePath.endsWith(".mdx"))
        ) {
          const dateKey = currentDate.slice(0, 10);
          if (dateKey in activity) {
            activity[dateKey] += 1;
            console.log(`记录活动: ${dateKey} - ${filePath}`);
          }
        }
      }
    }
  }

  // 单独处理每个文件的历史（如果需要更准确的历史记录）
  for (const f of files) {
    const full = path.join(POSTS_DIR, f);
    const relativePath = path.relative(process.cwd(), full);

    // 对每个文件单独使用 --follow
    const fileCmd = `git log --date=iso --format="%cI" --follow -- "${relativePath}"`;
    const fileHistory = sh(fileCmd);

    if (fileHistory) {
      const dates = fileHistory.split("\n").filter(Boolean);
      for (const date of dates) {
        const dateKey = date.slice(0, 10);
        if (dateKey in activity) {
          activity[dateKey] += 1;
          console.log(`文件历史记录: ${dateKey} - ${f}`);
        }
      }
    } else {
      // 如果没有Git历史，使用文件修改时间
      try {
        const st = await fs.stat(full);
        const isoDate = new Date(st.mtime).toISOString();
        const key = isoDate.slice(0, 10);
        if (key in activity) {
          activity[key] += 1;
          console.log(`使用文件修改时间: ${key} - ${f}`);
        }
      } catch {}
    }
  }

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(ACT_OUT, JSON.stringify(activity, null, 2), "utf8");
  console.log("Generated:", ACT_OUT);
}

generateActivityData().catch(console.error);
