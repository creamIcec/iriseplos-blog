// scripts/ensure-git-history.cjs
const { execSync } = require("node:child_process");

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

try {
  const shallow = sh("git rev-parse --is-shallow-repository");
  if (shallow === "true") {
    // 只有在浅仓库时才去 unshallow
    execSync("git fetch --unshallow", { stdio: "inherit" });
  } else {
    // 非浅仓库，什么也不做
    console.log("Repo is not shallow, skip --unshallow");
  }
} catch (e) {
  // 构建机可能没有完整 git，忽略错误继续
  console.log("Skip ensure git history:", e?.message || e);
}
