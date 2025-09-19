// scripts/generate-blog-meta.cjs
const { execSync } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");

const PUBLIC_DIR = path.join(process.cwd(), "public");
const POSTS_DIR = path.join(process.cwd(), "src/posts");
const ACT_OUT = path.join(process.cwd(), "public/activity-data.json");

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function gitLastCommitInfo(file) {
  const fmt = "%H|%cI|%an|%ae"; // hash | committer date ISO | name | email
  const out = sh(
    `git log -1 --format=${fmt} -- "${file.replace(/"/g, '\\"')}"`
  );
  if (!out) return null;
  const [hash, iso, name, email] = out.split("|");
  return { hash, iso, name, email };
}

function gitContributors(file) {
  const fmt = "%an|%ae";
  const out = sh(
    `git log --format=${fmt} -- "${file.replace(/"/g, '\\"')}" || true`
  );
  const lines = out.split("\n").filter(Boolean);
  const seen = new Set();
  const arr = [];
  for (const line of lines) {
    const [name, email] = line.split("|");
    const key = `${name}|${email}`;
    if (!seen.has(key)) {
      seen.add(key);
      arr.push({ name, email });
    }
  }
  return arr;
}

(async () => {
  // 文章文件
  let files = [];
  try {
    files = (await fs.readdir(POSTS_DIR)).filter((f) => /\.(md|mdx)$/.test(f));
  } catch (e) {
    console.error("读取 posts 目录失败: ", POSTS_DIR, e?.message || e);
  }

  // 活动热力图(近365天)
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 365);
  const activity = {};
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    activity[d.toISOString().slice(0, 10)] = 0;
  }

  for (const f of files) {
    const full = path.join(POSTS_DIR, f);

    let info = gitLastCommitInfo(full);
    if (!info) {
      try {
        const st = await fs.stat(full);
        info = {
          hash: "",
          iso: new Date(st.mtime).toISOString(),
          name: "Unknown",
          email: "",
        };
      } catch {}
    }

    if (info) {
      const key = info.iso.slice(0, 10);
      if (key in activity) activity[key] += 1;
    }
  }

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(ACT_OUT, JSON.stringify(activity, null, 2), "utf8");
  console.log("Generated:", ACT_OUT);
})();
