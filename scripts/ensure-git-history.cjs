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
    execSync("git fetch --unshallow", { stdio: "inherit" });
  } else {
    // 非浅克隆仓库, 运行完整构建流程
    console.log("Repo is not shallow, skip --unshallow");
  }
} catch (e) {
  console.log("Skip ensure git history:", e?.message || e);
}
